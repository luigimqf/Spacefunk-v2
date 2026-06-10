import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";
import { useQueue, type GuildQueue } from "discord-player";
import type { Command } from "../types/index.js";

const PAGE_SIZE = 10;

export function buildQueueMessage(queue: GuildQueue, page: number) {
  const tracks = queue.tracks.toArray();
  const totalPages = Math.max(1, Math.ceil(tracks.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(0, page), totalPages - 1);
  const slice = tracks.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);
  const current = queue.currentTrack;

  const embed = new EmbedBuilder()
    .setTitle("🎶 SpaceFunk Queue")
    .setColor(0x5865f2)
    .setDescription(
      [
        `**Tocando agora:**\n▶️ [${current?.title ?? "Desconhecido"}](${current?.url}) — \`${current?.duration ?? "??"}\``,
        "",
        slice.length > 0
          ? `**A seguir:**\n${slice
              .map(
                (t, i) =>
                  `\`${safePage * PAGE_SIZE + i + 1}.\` [${t.title}](${t.url}) — \`${t.duration}\``,
              )
              .join("\n")}`
          : "*Não há mais faixas na fila.*",
      ].join("\n"),
    )
    .setFooter({
      text: `Página ${safePage + 1} / ${totalPages} · ${tracks.length} faixa${tracks.length !== 1 ? "s" : ""} na fila`,
    });

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`queue:page:${safePage - 1}`)
      .setLabel("◀")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(safePage === 0),
    new ButtonBuilder()
      .setCustomId(`queue:page:${safePage + 1}`)
      .setLabel("▶")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(safePage >= totalPages - 1),
    new ButtonBuilder()
      .setCustomId("queue:skip")
      .setLabel("⏭ Skip")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("queue:clear")
      .setLabel("🗑 Clear")
      .setStyle(ButtonStyle.Danger),
  );

  return { embed, components: [row] };
}

export default {
  data: new SlashCommandBuilder()
    .setName("queue")
    .setDescription("Mostra a fila de músicas atual.")
    .addIntegerOption((option) =>
      option
        .setName("page")
        .setDescription("Número da página (padrão: 1)")
        .setMinValue(1),
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const queue = useQueue(interaction.guild!);

    if (!queue || !queue.isPlaying()) {
      await interaction.reply({
        content: "❌ Nenhuma música tocando no momento.",
        ephemeral: true,
      });
      return;
    }

    const tracks = queue.tracks.toArray();
    const page = (interaction.options.getInteger("page") ?? 1) - 1;
    const totalPages = Math.max(1, Math.ceil(tracks.length / PAGE_SIZE));

    if (page >= totalPages) {
      await interaction.reply({
        content: `❌ A página ${page + 1} não existe. Há apenas ${totalPages} página(s).`,
        ephemeral: true,
      });
      return;
    }

    const { embed, components } = buildQueueMessage(queue, page);
    await interaction.reply({ embeds: [embed], components });
  },
} satisfies Command;
