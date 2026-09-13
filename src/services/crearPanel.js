const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, StringSelectMenuBuilder } = require("discord.js");
const partidas = require("../state/partidas");

const ESTADOS = {
  lobby: { titulo: "Lobby", descripcion: "Elige una fase para comenzar la partida.", color: 0x57f287, emoji: "🟢" },
  tareas: { titulo: "Tareas 🔒", descripcion: "Los vivos están silenciados; los muertos pueden hablar.", color: 0xed4245, emoji: "🔒" },
  reunion: { titulo: "Reunión activa", descripcion: "Los vivos pueden hablar; los muertos permanecen silenciados.", color: 0x5865f2, emoji: "📢" }
};

function nombres(miembros) {
  return miembros.length ? miembros.map((miembro) => miembro.displayName).join(", ") : "Nadie";
}

module.exports = function crearPanel({ canalVoz = null, operador = null } = {}) {
  const partida = canalVoz ? partidas.obtener(canalVoz.guild.id) : null;
  const estadoActual = ESTADOS[partida?.fase] ?? ESTADOS.lobby;
  const jugadores = canalVoz ? [...canalVoz.members.values()].filter((miembro) => !miembro.user.bot) : [];
  const miembrosMuertos = partida ? [...partida.muertos].map((id) => canalVoz.guild.members.cache.get(id)).filter(Boolean) : [];
  const muertos = miembrosMuertos;
  const vivos = jugadores.filter((miembro) => !partida?.muertos.has(miembro.id));
  const silenciados = jugadores.filter((miembro) => miembro.voice.serverMute ?? miembro.voice.mute);
  const ensordecidos = jugadores.filter((miembro) => miembro.voice.serverDeaf ?? miembro.voice.deaf);
  const embed = new EmbedBuilder()
    .setColor(estadoActual.color)
    .setTitle(`${estadoActual.emoji} Among Us · Centro de mando`)
    .setDescription(`**${estadoActual.titulo}**\n${estadoActual.descripcion}`)
    .addFields(
      { name: "Canal", value: canalVoz ? `🔊 ${canalVoz.name}` : "Se aplicará al canal del administrador que pulse un botón.", inline: true },
      { name: "Jugadores", value: `👥 ${jugadores.length} · 💀 ${muertos.length} muertos`, inline: true },
      { name: "Vivos", value: `🧑 ${nombres(vivos)}`, inline: false },
      { name: "Silenciados", value: `🔇 ${nombres(silenciados)}`, inline: false },
      { name: "Ensordecidos", value: `🎧 ${nombres(ensordecidos)}`, inline: false },
      { name: "Muertos", value: `💀 ${nombres(muertos)}`, inline: false }
    )
    .setFooter({ text: operador ? `Última acción: ${operador}` : "Usa /dead y /alive para gestionar jugadores" })
    .setTimestamp();

  const fases = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("btn_start").setLabel("Tareas").setEmoji("🎮").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId("btn_meeting").setLabel("Reunión").setEmoji("📢").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("btn_stop").setLabel("Finalizar").setEmoji("🏁").setStyle(ButtonStyle.Danger)
  );

  const emergencia = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("btn_mute").setLabel("Silenciar todo").setEmoji("🔇").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("btn_unmute").setLabel("Hablar todos").setEmoji("🔊").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("btn_clear_dead").setLabel("Limpiar muertos").setEmoji("🧹").setStyle(ButtonStyle.Danger)
  );

  const jugadoresDelMenu = [...new Map([...jugadores, ...muertos].map((miembro) => [miembro.id, miembro])).values()];
  const opciones = jugadoresDelMenu.slice(0, 25).map((miembro) => ({
    label: miembro.displayName.slice(0, 100),
    value: miembro.id,
    description: partida?.muertos.has(miembro.id) ? "Muerto → revivir" : "Vivo → marcar como muerto",
    emoji: partida?.muertos.has(miembro.id) ? "💀" : "🧑"
  }));
  if (!opciones.length) opciones.push({ label: "No hay jugadores en el canal", value: "sin_jugadores", description: "Únete a un canal de voz para habilitar la lista" });

  const jugadoresMenu = new StringSelectMenuBuilder()
    .setCustomId("select_jugador")
    .setPlaceholder("Marcar muerto o revivir a un jugador")
    .setOptions(opciones)
    .setDisabled(!jugadores.length);

  return {
    embeds: [embed],
    components: [fases, emergencia, new ActionRowBuilder().addComponents(jugadoresMenu)]
  };
};
