import {
  ChatInputCommandInteraction,
  GuildMember,
  SlashCommandBuilder,
  TextChannel,
} from "discord.js";
import { useMainPlayer, useQueue } from "discord-player";
import youtubeDl from "youtube-dl-exec";
import type { Command } from "../types/index.js";

const YOUTUBE_PLAYLIST_REGEX = /[?&]list=([\w-]+)/i;

// youtubei.js não mapeia os nós `LockupView` que o YouTube passou a usar nas
// páginas de playlist, então o parser de playlist do discord-player-youtubei
// pode devolver 0 faixas. yt-dlp lida com isso de forma confiável, então
// expandimos a playlist manualmente e resolvemos cada vídeo individualmente
// (busca de vídeo único continua funcionando bem via youtubei.js).
async function expandYoutubePlaylist(url: string): Promise<string[]> {
  const result = await youtubeDl(url, {
    flatPlaylist: true,
    dumpSingleJson: true,
    noWarnings: true,
    skipDownload: true,
  });

  const entries =
    typeof result === "object"
      ? (result as { entries?: Array<{ id?: string; url?: string }> }).entries
      : undefined;

  if (!entries?.length) return [];

  return entries
    .map((entry) => {
      if (entry.id) return `https://www.youtube.com/watch?v=${entry.id}`;
      return entry.url ?? null;
    })
    .filter((url): url is string => Boolean(url));
}

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

    if (YOUTUBE_PLAYLIST_REGEX.test(query)) {
      let videoUrls: string[] = [];
      try {
        videoUrls = await expandYoutubePlaylist(query);
      } catch (err) {
        console.error(`[Play] Falha ao expandir playlist via yt-dlp (${query}):`, err);
      }

      if (videoUrls.length > 0) {
        const firstResult = await player.search(videoUrls[0], {
          requestedBy: interaction.user,
        });

        if (!firstResult.hasTracks()) {
          await interaction.editReply(`❌ Nenhum resultado encontrado para **${query}**.`);
          return;
        }

        await player.play(voiceChannel, firstResult, {
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

        const queue = useQueue(interaction.guild!.id);
        const remainingTracks = [];
        for (const url of videoUrls.slice(1)) {
          try {
            const videoResult = await player.search(url, {
              requestedBy: interaction.user,
            });
            if (videoResult.hasTracks()) remainingTracks.push(videoResult.tracks[0]);
          } catch {
            // ignora vídeos indisponíveis/privados dentro da playlist
          }
        }
        if (remainingTracks.length > 0) queue?.addTrack(remainingTracks);

        await interaction.editReply(
          `🎶 Playlist adicionada — ${remainingTracks.length + 1} faixas`,
        );
        return;
      }
    }

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
