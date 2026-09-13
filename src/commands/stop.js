const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const terminarPartida = require("../services/terminarPartida");

module.exports = {
  data: new SlashCommandBuilder().setName("stop").setDescription("Termina la partida y desmutea a todos").setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  aliases: ["stop", ".stop"],
  async execute({ canalVoz }) {
    await terminarPartida(canalVoz);
    return `🏁 Partida finalizada en **${canalVoz.name}**.`;
  }
};
