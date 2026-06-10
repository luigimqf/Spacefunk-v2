import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { useQueue } from "discord-player";
import type { Command } from "../types/index.js";

export default {
  data: new SlashCommandBuilder()
    .setName("skip")
    .setDescription("Pula a música que está tocando."),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const queue = useQueue(interaction.guild!);

    if (!queue || !queue.isPlaying()) {
      await interaction.reply({
        content: "❌ Nenhuma música tocando no momento.",
        ephemeral: true,
      });
      return;
    }

    const current = queue.currentTrack;
    queue.node.skip();

    const next = queue.tracks.at(0);
    const nextInfo = next
      ? `\nPróxima: **${next.title}**`
      : "\nA fila está vazia agora.";

    await interaction.reply(
      `⏭️ Pulou **${current?.title ?? "música atual"}**.${nextInfo}`,
    );
  },
} satisfies Command;
