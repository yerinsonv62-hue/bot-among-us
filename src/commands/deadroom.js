const { SlashCommandBuilder, ChannelType, PermissionFlagsBits } = require("discord.js");
const partidas = require("../state/partidas");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("deadroom")
    .setDescription("Configura la sala de voz para jugadores muertos")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption((option) => option.setName("channel").setDescription("Sala secundaria de muertos").addChannelTypes(ChannelType.GuildVoice).setRequired(true)),
  needsVoiceChannel: false,
  async execute({ interaction }) {
    const canal = interaction.options.getChannel("channel", true);
    partidas.obtener(interaction.guild.id).canalMuertosId = canal.id;
    return `💀 Sala de muertos configurada: **${canal.name}**.`;
  }
};
