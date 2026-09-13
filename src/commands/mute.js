const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const silenciarTodos = require("../services/silenciarTodos");

module.exports = {
  data: new SlashCommandBuilder().setName("mute").setDescription("Mutea a todos").setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  aliases: ["mute", ".mute"],
  async execute({ canalVoz }) {
    await silenciarTodos(canalVoz);
    return "🔇 Todos silenciados.";
  }
};
