import "dotenv/config";
import { Client, Collection, Events, GatewayIntentBits } from "discord.js";
import { createPlayer } from "./lib/player.js";
import readyHandler from "./events/ready.js";
import interactionCreateHandler from "./events/interactionCreate.js";
import type { Command } from "./types/index.js";

// ── Command imports ───────────────────────────────────────────────────────────
import playCommand from "./commands/play.js";
import skipCommand from "./commands/skip.js";
import queueCommand from "./commands/queue.js";
import clearCommand from "./commands/clear.js";
import removeCommand from "./commands/remove.js";
import moveCommand from "./commands/move.js";

// ── Client setup ──────────────────────────────────────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
  ],
});

// ── Load commands ─────────────────────────────────────────────────────────────
client.commands = new Collection<string, Command>();

const commands: Command[] = [
  playCommand,
  skipCommand,
  queueCommand,
  clearCommand,
  removeCommand,
  moveCommand,
];
for (const command of commands) {
  client.commands.set(command.data.name, command);
}

// ── Register events ───────────────────────────────────────────────────────────
client.once(Events.ClientReady, (c) => readyHandler(c));
client.on(Events.InteractionCreate, (i) => interactionCreateHandler(i));

// ── Boot ──────────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  const token = process.env.DISCORD_TOKEN;
  if (!token) {
    throw new Error(
      "DISCORD_TOKEN is not set. Please create a .env file from .env.example.",
    );
  }

  // Initialise the music player BEFORE logging in
  await createPlayer(client);

  await client.login(token);
}

main().catch((error) => {
  console.error("[Boot] Fatal error:", error);
  process.exit(1);
});
