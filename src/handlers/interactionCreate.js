const { PermissionFlagsBits } = require("discord.js");
const obtenerCanalVozUsuario = require("../services/obtenerCanalVozUsuario");
const obtenerCanalPartida = require("../services/obtenerCanalPartida");
const ejecutarBoton = require("../services/ejecutarBoton");
const crearPanel = require("../services/crearPanel");
const matarJugador = require("../services/matarJugador");
const revivirJugador = require("../services/revivirJugador");
const actualizarPanel = require("../services/actualizarPanel");
const partidas = require("../state/partidas");

const SIN_CANAL = "⚠️ Debes estar conectado a un canal de voz.";
const SIN_PERMISOS = "⚠️ No tienes permisos de administrador para usar este comando.";

function esAdministrador(interaction) {
  return interaction.member?.permissions?.has(PermissionFlagsBits.Administrator);
}

module.exports = async function interactionCreate(interaction) {
  if (!interaction.inGuild()) return;

  if (!esAdministrador(interaction)) {
    if (interaction.isButton() || interaction.isStringSelectMenu() || interaction.isChatInputCommand()) {
      await interaction.reply({ content: SIN_PERMISOS, ephemeral: true });
    }
    return;
  }

  if (interaction.isButton()) {
    const canalVoz = await obtenerCanalPartida(interaction.guild, interaction.user.id);
    if (!canalVoz) return interaction.reply({ content: SIN_CANAL, ephemeral: true });

    await interaction.deferUpdate();
    const panelActualizado = await ejecutarBoton(interaction.customId, canalVoz, interaction.user.tag);
    if (panelActualizado) {
      await interaction.editReply(panelActualizado);
    }
    return;
  }

  if (interaction.isStringSelectMenu() && interaction.customId === "select_jugador") {
    const canalVoz = await obtenerCanalPartida(interaction.guild, interaction.user.id);
    if (!canalVoz) return interaction.reply({ content: SIN_CANAL, ephemeral: true });

    const partida = partidas.obtener(interaction.guild.id);
    const miembroObjetivo = await interaction.guild.members.fetch(interaction.values[0]).catch(() => null);
    if (!miembroObjetivo || miembroObjetivo.user.bot) {
      return interaction.reply({ content: "⚠️ Ese jugador ya no está en el canal de voz.", ephemeral: true });
    }

    await interaction.deferUpdate();
    if (partida.muertos.has(miembroObjetivo.id)) await revivirJugador(miembroObjetivo);
    else await matarJugador(miembroObjetivo);

    const panelActualizado = crearPanel({ canalVoz, operador: interaction.user.tag });
    await interaction.editReply(panelActualizado);
    return;
  }

  if (!interaction.isChatInputCommand()) return;
  const comando = interaction.client.commands.get(interaction.commandName);
  if (!comando) return;

  const miembroObjetivo = interaction.options.getMember("usuario") ?? null;
  const canalElegido = interaction.options.getChannel("channel") ?? null;
  const canalVoz = canalElegido ?? await obtenerCanalVozUsuario(interaction.guild, interaction.user.id);
  if (comando.needsVoiceChannel !== false && !canalVoz) {
    return interaction.reply({ content: SIN_CANAL, ephemeral: true });
  }

  await interaction.deferReply({ ephemeral: true });
  const respuesta = await comando.execute({ interaction, canalVoz, miembroObjetivo });
  if (["start", "meeting", "stop", "mute", "unmute", "dead", "alive"].includes(comando.data.name)) {
    const canalPrincipal = await obtenerCanalPartida(interaction.guild, interaction.user.id);
    if (canalPrincipal) await actualizarPanel(interaction.guild, canalPrincipal, interaction.user.tag);
  }
  await interaction.editReply(typeof respuesta === "string" ? { content: respuesta } : respuesta);
  if (comando.data.name === "panel") {
    const panel = await interaction.fetchReply();
    const partida = partidas.obtener(interaction.guild.id);
    partida.canalPrincipalId = canalVoz.id;
    partida.panel = { canalTextoId: panel.channelId, mensajeId: panel.id };
  }
};
