const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const desmutearTodos = require("../services/desmutearTodos");

module.exports = {
  data: new SlashCommandBuilder().setName("unmute").setDescription("Desmutea a todos").setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  aliases: ["unmute", ".unmute"],
  async execute({ canalVoz }) {
    await desmutearTodos(canalVoz);
    return "🔊 Todos desmuteados.";
  }
};
