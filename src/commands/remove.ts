import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { useQueue } from "discord-player";
import type { Command } from "../types/index.js";

export default {
  data: new SlashCommandBuilder()
    .setName("remove")
    .setDescription("Remove a track from the queue by position or name.")
    .addIntegerOption((option) =>
      option
        .setName("position")
        .setDescription("Position in the queue (1-based)")
        .setMinValue(1),
    )
    .addStringOption((option) =>
      option
        .setName("name")
        .setDescription("Track name to search for (case-insensitive)"),
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

    const position = interaction.options.getInteger("position");
    const name = interaction.options.getString("name");

    if (position === null && name === null) {
      await interaction.reply({
        content: "❌ Please specify either a `position` or a `name`.",
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

    let index: number;

    if (position !== null) {
      index = position - 1;
      if (index >= tracks.length) {
        await interaction.reply({
          content: `❌ Position \`${position}\` is out of range. Queue has \`${tracks.length}\` track(s).`,
          ephemeral: true,
        });
        return;
      }
    } else {
      const lowerName = name!.toLowerCase();
      index = tracks.findIndex((t) => t.title.toLowerCase().includes(lowerName));
      if (index === -1) {
        await interaction.reply({
          content: `❌ No track matching **${name}** found in the queue.`,
          ephemeral: true,
        });
        return;
      }
    }

    const track = tracks[index];
    queue.removeTrack(index);

    await interaction.reply(
      `🗑️ Removed **${track.title}** from position \`${index + 1}\`.`,
    );
  },
} satisfies Command;
