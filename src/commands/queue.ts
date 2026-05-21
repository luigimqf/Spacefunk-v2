import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";
import { useQueue } from "discord-player";
import type { Command } from "../types/index.js";

const PAGE_SIZE = 10;

export default {
  data: new SlashCommandBuilder()
    .setName("queue")
    .setDescription("Show the current song queue.")
    .addIntegerOption((option) =>
      option
        .setName("page")
        .setDescription("Page number (default: 1)")
        .setMinValue(1),
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const queue = useQueue(interaction.guild!);

    if (!queue || !queue.isPlaying()) {
      await interaction.reply({
        content: "❌ Nothing is playing right now.",
        ephemeral: true,
      });
      return;
    }

    const tracks = queue.tracks.toArray();
    const page = (interaction.options.getInteger("page") ?? 1) - 1;
    const totalPages = Math.max(1, Math.ceil(tracks.length / PAGE_SIZE));

    if (page >= totalPages) {
      await interaction.reply({
        content: `❌ Page ${page + 1} does not exist. There are only ${totalPages} page(s).`,
        ephemeral: true,
      });
      return;
    }

    const slice = tracks.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
    const current = queue.currentTrack;

    const embed = new EmbedBuilder()
      .setTitle("🎶 SpaceFunk Queue")
      .setColor(0x5865f2)
      .setDescription(
        [
          `**Now playing:**\n▶️ [${current?.title ?? "Unknown"}](${current?.url}) — \`${current?.duration ?? "??"}\``,
          "",
          slice.length > 0
            ? `**Up next:**\n${slice
                .map(
                  (t, i) =>
                    `\`${page * PAGE_SIZE + i + 1}.\` [${t.title}](${t.url}) — \`${t.duration}\``,
                )
                .join("\n")}`
            : "*No more tracks in queue.*",
        ].join("\n"),
      )
      .setFooter({
        text: `Page ${page + 1} / ${totalPages} · ${tracks.length} track${tracks.length !== 1 ? "s" : ""} in queue`,
      });

    await interaction.reply({ embeds: [embed] });
  },
} satisfies Command;
