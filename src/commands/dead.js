const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const matarJugador = require("../services/matarJugador");

module.exports = {
  data: new SlashCommandBuilder().setName("dead").setDescription("Marca a un jugador como muerto").setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption((option) => option.setName("usuario").setDescription("Jugador que murió").setRequired(true)),
  aliases: ["dead", ".dead"],
  needsVoiceChannel: false,
  async execute({ miembroObjetivo }) {
    if (!miembroObjetivo) return "No se encontró al usuario.";
    await matarJugador(miembroObjetivo);
    return `💀 **${miembroObjetivo.user.username}** registrado como muerto.`;
  }
};
