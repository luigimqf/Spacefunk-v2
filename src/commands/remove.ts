import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { useQueue } from "discord-player";
import type { Command } from "../types/index.js";

export default {
  data: new SlashCommandBuilder()
    .setName("remove")
    .setDescription("Remove uma faixa da fila pela posição ou nome.")
    .addIntegerOption((option) =>
      option
        .setName("position")
        .setDescription("Posição na fila (começa em 1)")
        .setMinValue(1),
    )
    .addStringOption((option) =>
      option
        .setName("name")
        .setDescription("Nome da faixa (sem distinção de maiúsculas)"),
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const queue = useQueue(interaction.guild!);

    if (!queue || !queue.isPlaying()) {
      await interaction.reply({
        content: "❌ Nenhuma música tocando no momento.",
        ephemeral: true,
      });
      return;
    }

    const position = interaction.options.getInteger("position");
    const name = interaction.options.getString("name");

    if (position === null && name === null) {
      await interaction.reply({
        content: "❌ Informe uma `position` ou um `name`.",
        ephemeral: true,
      });
      return;
    }

    const tracks = queue.tracks.toArray();

    if (tracks.length === 0) {
      await interaction.reply({
        content: "❌ A fila está vazia.",
        ephemeral: true,
      });
      return;
    }

    let index: number;

    if (position !== null) {
      index = position - 1;
      if (index >= tracks.length) {
        await interaction.reply({
          content: `❌ Posição \`${position}\` fora do intervalo. A fila tem \`${tracks.length}\` faixa(s).`,
          ephemeral: true,
        });
        return;
      }
    } else {
      const lowerName = name!.toLowerCase();
      index = tracks.findIndex((t) => t.title.toLowerCase().includes(lowerName));
      if (index === -1) {
        await interaction.reply({
          content: `❌ Nenhuma faixa com o nome **${name}** encontrada na fila.`,
          ephemeral: true,
        });
        return;
      }
    }

    const track = tracks[index];
    queue.removeTrack(index);

    await interaction.reply(
      `🗑️ **${track.title}** removido da posição \`${index + 1}\`.`,
    );
  },
} satisfies Command;
