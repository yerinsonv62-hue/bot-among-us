const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const crearPanel = require("../services/crearPanel");

module.exports = {
  data: new SlashCommandBuilder().setName("panel").setDescription("Envía el panel de control con botones interactivos").setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute({ canalVoz }) {
    return {
      ...crearPanel({ canalVoz }),
      ephemeral: false
    };
  }
};
