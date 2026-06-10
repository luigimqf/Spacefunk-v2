import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { useQueue } from "discord-player";
import type { Command } from "../types/index.js";

export default {
  data: new SlashCommandBuilder()
    .setName("move")
    .setDescription("Move a track from one queue position to another.")
    .addIntegerOption((option) =>
      option
        .setName("from")
        .setDescription("Current position in the queue (1-based)")
        .setRequired(true)
        .setMinValue(1),
    )
    .addIntegerOption((option) =>
      option
        .setName("to")
        .setDescription("Target position in the queue (1-based)")
        .setRequired(true)
        .setMinValue(1),
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const queue = useQueue(interaction.guild!);

    if (!queue || !queue.isPlaying()) {
      await interaction.reply({
        content: "❌ Nothing is playing right now.",
        ephemeral: true,
      });
      return;
    }

    const fromPos = interaction.options.getInteger("from", true);
    const toPos = interaction.options.getInteger("to", true);

    if (fromPos === toPos) {
      await interaction.reply({
        content: "❌ The `from` and `to` positions are the same.",
        ephemeral: true,
      });
      return;
    }

    const tracks = queue.tracks.toArray();

    if (tracks.length === 0) {
      await interaction.reply({
        content: "❌ The queue is empty.",
        ephemeral: true,
      });
      return;
    }

    if (fromPos > tracks.length) {
      await interaction.reply({
        content: `❌ Position \`${fromPos}\` is out of range. Queue has \`${tracks.length}\` track(s).`,
        ephemeral: true,
      });
      return;
    }

    if (toPos > tracks.length) {
      await interaction.reply({
        content: `❌ Position \`${toPos}\` is out of range. Queue has \`${tracks.length}\` track(s).`,
        ephemeral: true,
      });
      return;
    }

    const track = tracks[fromPos - 1];
    queue.moveTrack(fromPos - 1, toPos - 1);

    await interaction.reply(
      `↕️ Moved **${track.title}** from position \`${fromPos}\` to \`${toPos}\`.`,
    );
  },
} satisfies Command;
