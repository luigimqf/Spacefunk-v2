import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { useQueue } from "discord-player";
import type { Command } from "../types/index.js";

export default {
  data: new SlashCommandBuilder()
    .setName("skip")
    .setDescription("Skip the currently playing track."),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const queue = useQueue(interaction.guild!);

    if (!queue || !queue.isPlaying()) {
      await interaction.reply({
        content: "❌ Nothing is playing right now.",
        ephemeral: true,
      });
      return;
    }

    const current = queue.currentTrack;
    queue.node.skip();

    const next = queue.tracks.at(0);
    const nextInfo = next
      ? `\nUp next: **${next.title}**`
      : "\nThe queue is now empty.";

    await interaction.reply(
      `⏭️ Skipped **${current?.title ?? "current track"}**.${nextInfo}`,
    );
  },
} satisfies Command;
