import { Player } from "discord-player";
import { DefaultExtractors, SpotifyExtractor } from "@discord-player/extractor";
import { Client } from "discord.js";

let playerInstance: Player | null = null;

export async function createPlayer(client: Client): Promise<Player> {
  if (playerInstance) return playerInstance;

  const player = new Player(client, {
    skipFFmpeg: false,
  });

  const spotifyClientId = process.env.SPOTIFY_CLIENT_ID;
  const spotifyClientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!spotifyClientId || !spotifyClientSecret) {
    console.warn(
      "[SpaceFunk] SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET not set — Spotify links will not work.",
    );
  }

  // loadMulti registers all DefaultExtractors (SoundCloud, Spotify, Attachment, etc.)
  // YouTube is handled natively by discord-player itself
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await player.extractors.loadMulti(DefaultExtractors, {
    [SpotifyExtractor.identifier]: {
      clientId: spotifyClientId ?? "",
      clientSecret: spotifyClientSecret ?? "",
    },
  } as any);

  player.events.on("playerError", (queue, error) => {
    console.error(`[Player] Error in guild ${queue.guild.id}:`, error.message);
  });

  player.events.on("error", (queue, error) => {
    console.error(
      `[Player] Queue error in guild ${queue.guild.id}:`,
      error.message,
    );
  });

  player.events.on("playerStart", (queue, track) => {
    queue.metadata?.channel?.send(
      `▶️ Now playing: **${track.title}** — \`${track.duration}\``,
    );
  });

  player.events.on("disconnect", (queue) => {
    queue.metadata?.channel?.send("👋 Disconnected from the voice channel.");
  });

  player.events.on("emptyQueue", (queue) => {
    queue.metadata?.channel?.send(
      "✅ Queue finished! Add more songs with `/play`.",
    );
  });

  player.events.on("emptyChannel", (queue) => {
    queue.metadata?.channel?.send("👀 Voice channel is empty — leaving.");
  });

  playerInstance = player;
  return player;
}

export function getPlayer(): Player {
  if (!playerInstance) {
    throw new Error(
      "Player has not been initialised. Call createPlayer() first.",
    );
  }
  return playerInstance;
}
