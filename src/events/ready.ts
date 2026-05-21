import type { Client } from "discord.js";

export default function ready(client: Client<true>): void {
  console.log(`✅ SpaceFunk is online! Logged in as ${client.user.tag}`);
}
