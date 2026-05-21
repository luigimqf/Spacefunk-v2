import { Events, type Interaction } from "discord.js";
import type { Command } from "../types/index.js";

export default async function interactionCreate(
  interaction: Interaction,
): Promise<void> {
  if (!interaction.isChatInputCommand()) return;

  const command = interaction.client.commands.get(interaction.commandName) as
    | Command
    | undefined;

  if (!command) {
    console.warn(`[Commands] Unknown command: ${interaction.commandName}`);
    await interaction.reply({
      content: "❌ Unknown command.",
      ephemeral: true,
    });
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(
      `[Commands] Error executing /${interaction.commandName}:`,
      error,
    );
    const message = {
      content: "❌ An error occurred while executing this command.",
      ephemeral: true,
    };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(message);
    } else {
      await interaction.reply(message);
    }
  }
}
