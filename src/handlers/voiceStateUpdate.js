const partidas = require("../state/partidas");
const actualizarVoz = require("../services/actualizarVoz");
const actualizarPanel = require("../services/actualizarPanel");

module.exports = async function voiceStateUpdate(anterior, actual) {
  if (actual.member.user.bot || anterior.channelId === actual.channelId || !actual.channelId) return;

  const partida = partidas.obtener(actual.guild.id);
  if (actual.channelId !== partida.canalPrincipalId) return;

  if (partida.muertos.has(actual.member.id) && partida.canalMuertosId) {
    await actualizarVoz(actual.member, { mute: false, deaf: false, channelId: partida.canalMuertosId });
  } else if (partida.fase === "tareas") {
    await actualizarVoz(actual.member, { mute: true, deaf: true });
  }

  await actualizarPanel(actual.guild, actual.channel);
};
