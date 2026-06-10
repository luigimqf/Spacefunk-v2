/**
 * deploy-commands.ts
 *
 * Run with: pnpm run deploy
 *
 * If DISCORD_GUILD_ID is set  → registers commands to that guild only (instant, great for dev)
 * If DISCORD_GUILD_ID is empty → registers commands globally (takes ~1h to propagate, use in prod)
 */
import "dotenv/config";
import { REST, Routes } from "discord.js";
import type { RESTPostAPIChatInputApplicationCommandsJSONBody } from "discord-api-types/v10";

import playCommand from "./commands/play.js";
import skipCommand from "./commands/skip.js";
import queueCommand from "./commands/queue.js";
import clearCommand from "./commands/clear.js";
import removeCommand from "./commands/remove.js";
import moveCommand from "./commands/move.js";

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;
const guildId = process.env.DISCORD_GUILD_ID;

if (!token) throw new Error("DISCORD_TOKEN is not set.");
if (!clientId) throw new Error("DISCORD_CLIENT_ID is not set.");

const commands: RESTPostAPIChatInputApplicationCommandsJSONBody[] = [
  playCommand.data.toJSON(),
  skipCommand.data.toJSON(),
  queueCommand.data.toJSON(),
  clearCommand.data.toJSON(),
  removeCommand.data.toJSON(),
  moveCommand.data.toJSON(),
];

const rest = new REST({ version: "10" }).setToken(token);

(async () => {
  try {
    console.log(`Deploying ${commands.length} slash command(s)…`);

    if (guildId) {
      await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
        body: commands,
      });
      console.log(
        `✅ Registered ${commands.length} command(s) to guild ${guildId} (instant).`,
      );
    } else {
      await rest.put(Routes.applicationCommands(clientId), { body: commands });
      console.log(
        `✅ Registered ${commands.length} command(s) globally (propagation ~1h).`,
      );
    }
  } catch (error) {
    console.error("❌ Failed to deploy commands:", error);
    process.exit(1);
  }
})();
