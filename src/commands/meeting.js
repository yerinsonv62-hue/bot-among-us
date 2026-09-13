const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const iniciarReunion = require("../services/iniciarReunion");

module.exports = {
  data: new SlashCommandBuilder().setName("meeting").setDescription("Desmutea a todos para una reunión").setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  aliases: ["meeting", ".meeting"],
  async execute({ canalVoz }) {
    await iniciarReunion(canalVoz);
    return `📢 Reunión convocada en **${canalVoz.name}**.`;
  }
};
