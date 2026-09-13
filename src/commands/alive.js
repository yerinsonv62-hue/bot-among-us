const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const revivirJugador = require("../services/revivirJugador");

module.exports = {
  data: new SlashCommandBuilder().setName("alive").setDescription("Revive a un jugador").setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption((option) => option.setName("usuario").setDescription("Jugador a revivir").setRequired(true)),
  aliases: ["alive", ".alive"],
  needsVoiceChannel: false,
  async execute({ miembroObjetivo }) {
    if (!miembroObjetivo) return "No se encontró al usuario.";
    await revivirJugador(miembroObjetivo);
    return `✨ **${miembroObjetivo.user.username}** revivido.`;
  }
};
