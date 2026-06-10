import {
  ChatInputCommandInteraction,
  GuildMember,
  SlashCommandBuilder,
} from "discord.js";
import { useQueue } from "discord-player";
import type { Command } from "../types/index.js";

export default {
  data: new SlashCommandBuilder()
    .setName("clear")
    .setDescription("Limpa a fila e para a reprodução."),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const member = interaction.member as GuildMember;

    if (!member.voice.channel) {
      await interaction.reply({
        content: "🔇 Você precisa estar em um canal de voz para usar isso.",
        ephemeral: true,
      });
      return;
    }

    const queue = useQueue(interaction.guild!);

    if (!queue) {
      await interaction.reply({
        content: "❌ Nenhuma música tocando no momento.",
        ephemeral: true,
      });
      return;
    }

    queue.delete();

    await interaction.reply("🗑️ Fila limpa e reprodução parada.");
  },
} satisfies Command;
