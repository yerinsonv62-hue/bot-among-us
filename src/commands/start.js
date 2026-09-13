const { SlashCommandBuilder, ChannelType, PermissionFlagsBits } = require("discord.js");
const iniciarTareas = require("../services/iniciarTareas");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("start")
    .setDescription("Inicia la partida y mutea a todos")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((option) => option.setName("code").setDescription("Código de la partida"))
    .addIntegerOption((option) => option.setName("timer").setDescription("Tiempo"))
    .addChannelOption((option) => option.setName("channel").setDescription("Canal de voz").addChannelTypes(ChannelType.GuildVoice)),
  aliases: ["start", ".start"],
  async execute({ canalVoz }) {
    await iniciarTareas(canalVoz);
    return `🎮 Tareas iniciadas en **${canalVoz.name}**.`;
  }
};
