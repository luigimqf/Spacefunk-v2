import {
  ChatInputCommandInteraction,
  GuildMember,
  SlashCommandBuilder,
} from "discord.js";
import { useQueue } from "discord-player";
import type { Command } from "../types/index.js";

export default {
  data: new SlashCommandBuilder()
    .setName("clear")
    .setDescription("Clear the queue and stop playback."),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const member = interaction.member as GuildMember;

    if (!member.voice.channel) {
      await interaction.reply({
        content: "🔇 You need to be in a voice channel to use this.",
        ephemeral: true,
      });
      return;
    }

    const queue = useQueue(interaction.guild!);

    if (!queue) {
      await interaction.reply({
        content: "❌ Nothing is playing right now.",
        ephemeral: true,
      });
      return;
    }

    queue.delete();

    await interaction.reply("🗑️ Queue cleared and playback stopped.");
  },
} satisfies Command;
