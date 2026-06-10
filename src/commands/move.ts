import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { useQueue } from "discord-player";
import type { Command } from "../types/index.js";

export default {
  data: new SlashCommandBuilder()
    .setName("move")
    .setDescription("Move uma faixa de uma posição para outra na fila.")
    .addIntegerOption((option) =>
      option
        .setName("from")
        .setDescription("Posição atual na fila (começa em 1)")
        .setRequired(true)
        .setMinValue(1),
    )
    .addIntegerOption((option) =>
      option
        .setName("to")
        .setDescription("Posição de destino na fila (começa em 1)")
        .setRequired(true)
        .setMinValue(1),
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

    const fromPos = interaction.options.getInteger("from", true);
    const toPos = interaction.options.getInteger("to", true);

    if (fromPos === toPos) {
      await interaction.reply({
        content: "❌ As posições `from` e `to` são iguais.",
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

    if (fromPos > tracks.length) {
      await interaction.reply({
        content: `❌ Posição \`${fromPos}\` fora do intervalo. A fila tem \`${tracks.length}\` faixa(s).`,
        ephemeral: true,
      });
      return;
    }

    if (toPos > tracks.length) {
      await interaction.reply({
        content: `❌ Posição \`${toPos}\` fora do intervalo. A fila tem \`${tracks.length}\` faixa(s).`,
        ephemeral: true,
      });
      return;
    }

    const track = tracks[fromPos - 1];
    queue.moveTrack(fromPos - 1, toPos - 1);

    await interaction.reply(
      `↕️ **${track.title}** movido da posição \`${fromPos}\` para \`${toPos}\`.`,
    );
  },
} satisfies Command;
