import {
  ChatInputCommandInteraction,
  GuildMember,
  SlashCommandBuilder,
  TextChannel,
} from "discord.js";
import { useMainPlayer } from "discord-player";
import type { Command } from "../types/index.js";

export default {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("Play a song from YouTube, Spotify or SoundCloud.")
    .addStringOption((option) =>
      option
        .setName("query")
        .setDescription("Song name, URL (YouTube / Spotify / SoundCloud)")
        .setRequired(true),
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply();

    const member = interaction.member as GuildMember;
    const voiceChannel = member.voice.channel;

    if (!voiceChannel) {
      await interaction.editReply(
        "🔇 You need to be in a voice channel first!",
      );
      return;
    }

    const query = interaction.options.getString("query", true);
    const player = useMainPlayer();

    const result = await player.search(query, {
      requestedBy: interaction.user,
    });

    if (!result.hasTracks()) {
      await interaction.editReply(`❌ No results found for **${query}**.`);
      return;
    }

    const { track, searchResult } = await player.play(voiceChannel, result, {
      nodeOptions: {
        metadata: {
          channel: interaction.channel as TextChannel,
        },
        selfDeaf: true,
        volume: 80,
        leaveOnEmpty: true,
        leaveOnEmptyCooldown: 30_000,
        leaveOnEnd: false,
      },
    });

    const isPlaylist = searchResult.hasPlaylist();

    if (isPlaylist) {
      await interaction.editReply(
        `🎶 Queued playlist **${searchResult.playlist!.title}** — ${searchResult.tracks.length} tracks`,
      );
    } else {
      await interaction.editReply(
        `🎵 Queued **${track.title}** — \`${track.duration}\``,
      );
    }
  },
} satisfies Command;
