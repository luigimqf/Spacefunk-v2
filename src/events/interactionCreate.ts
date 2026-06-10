import { Events, type Interaction } from "discord.js";
import { useQueue } from "discord-player";
import type { Command } from "../types/index.js";
import { buildQueueMessage } from "../commands/queue.js";

export default async function interactionCreate(
  interaction: Interaction,
): Promise<void> {
  if (interaction.isChatInputCommand()) {
    const command = interaction.client.commands.get(
      interaction.commandName,
    ) as Command | undefined;

    if (!command) {
      console.warn(`[Commands] Unknown command: ${interaction.commandName}`);
      await interaction.reply({
        content: "❌ Comando desconhecido.",
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
        content: "❌ Ocorreu um erro ao executar este comando.",
        ephemeral: true,
      };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(message);
      } else {
        await interaction.reply(message);
      }
    }
    return;
  }

  if (interaction.isButton()) {
    const [namespace, action, ...args] = interaction.customId.split(":");

    if (namespace !== "queue") return;

    const queue = useQueue(interaction.guild!);

    try {
      if (action === "page") {
        const page = parseInt(args[0], 10);

        if (!queue || !queue.isPlaying()) {
          await interaction.update({
            content: "❌ Nenhuma música tocando no momento.",
            embeds: [],
            components: [],
          });
          return;
        }

        const { embed, components } = buildQueueMessage(queue, page);
        await interaction.update({ embeds: [embed], components });
        return;
      }

      if (action === "skip") {
        if (!queue || !queue.isPlaying()) {
          await interaction.update({
            content: "❌ Nenhuma música tocando no momento.",
            embeds: [],
            components: [],
          });
          return;
        }

        const skipped = queue.currentTrack;
        queue.node.skip();

        const freshQueue = useQueue(interaction.guild!);
        if (!freshQueue || !freshQueue.isPlaying()) {
          await interaction.update({
            content: `⏭️ Pulou **${skipped?.title ?? "música atual"}**. A fila está vazia agora.`,
            embeds: [],
            components: [],
          });
          return;
        }

        const { embed, components } = buildQueueMessage(freshQueue, 0);
        await interaction.update({ embeds: [embed], components });
        return;
      }

      if (action === "clear") {
        if (queue) queue.delete();

        await interaction.update({
          content: "🗑️ Fila limpa e reprodução parada.",
          embeds: [],
          components: [],
        });
        return;
      }
    } catch (error) {
      console.error(`[Buttons] Error handling queue button "${action}":`, error);
      await interaction.reply({
        content: "❌ Ocorreu um erro ao processar essa ação.",
        ephemeral: true,
      });
    }
  }
}
