const { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder().setName("panel").setDescription("Envía el panel de control con botones interactivos").setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  needsVoiceChannel: false,
  async execute() {
    const fila = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("btn_start").setLabel("Iniciar tareas").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("btn_meeting").setLabel("Reunión").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("btn_stop").setLabel("Terminar partida").setStyle(ButtonStyle.Danger)
    );
    return {
      content: "🎮 **Panel de Control de Among Us**\nUsa los botones para cambiar los estados de voz.",
      components: [fila],
      ephemeral: false
    };
  }
};
