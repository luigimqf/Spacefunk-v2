import type {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
} from "discord.js";

export interface Command {
  data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

// Augment the discord.js Client with a commands collection
declare module "discord.js" {
  interface Client {
    commands: import("discord.js").Collection<string, Command>;
  }
}
