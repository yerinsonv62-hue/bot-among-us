const { PermissionFlagsBits } = require("discord.js");
const obtenerCanalVozUsuario = require("../services/obtenerCanalVozUsuario");
const ejecutarBoton = require("../services/ejecutarBoton");

const SIN_CANAL = "⚠️ Debes estar conectado a un canal de voz.";
const SIN_PERMISOS = "⚠️ No tienes permisos de administrador para usar este comando.";

function esAdministrador(interaction) {
  return interaction.member?.permissions?.has(PermissionFlagsBits.Administrator);
}

module.exports = async function interactionCreate(interaction) {
  if (!interaction.inGuild()) return;

  if (!esAdministrador(interaction)) {
    if (interaction.isButton() || interaction.isChatInputCommand()) {
      await interaction.reply({ content: SIN_PERMISOS, ephemeral: true });
    }
    return;
  }

  if (interaction.isButton()) {
    const canalVoz = await obtenerCanalVozUsuario(interaction.guild, interaction.user.id);
    if (!canalVoz) return interaction.reply({ content: SIN_CANAL, ephemeral: true });

    await interaction.deferUpdate();
    await ejecutarBoton(interaction.customId, canalVoz);
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
  await interaction.editReply(typeof respuesta === "string" ? { content: respuesta } : respuesta);
};
