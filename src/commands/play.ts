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
    .setDescription("Toca uma música do YouTube, Spotify ou SoundCloud.")
    .addStringOption((option) =>
      option
        .setName("query")
        .setDescription("Nome da música ou URL (YouTube / Spotify / SoundCloud)")
        .setRequired(true),
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply();

    const member = interaction.member as GuildMember;
    const voiceChannel = member.voice.channel;

    if (!voiceChannel) {
      await interaction.editReply(
        "🔇 Você precisa estar em um canal de voz primeiro!",
      );
      return;
    }

    const query = interaction.options.getString("query", true);
    const player = useMainPlayer();

    const result = await player.search(query, {
      requestedBy: interaction.user,
    });

    if (!result.hasTracks()) {
      await interaction.editReply(`❌ Nenhum resultado encontrado para **${query}**.`);
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
        `🎶 Playlist **${searchResult.playlist!.title}** adicionada — ${searchResult.tracks.length} faixas`,
      );
    } else {
      await interaction.editReply(
        `🎵 **${track.title}** adicionado à fila — \`${track.duration}\``,
      );
    }
  },
} satisfies Command;
