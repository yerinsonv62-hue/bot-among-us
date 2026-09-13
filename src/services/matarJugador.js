const partidas = require("../state/partidas");
const actualizarVoz = require("./actualizarVoz");

module.exports = async function matarJugador(miembro) {
  const partida = partidas.obtener(miembro.guild.id);
  partida.muertos.add(miembro.id);
  await actualizarVoz(miembro, { mute: false, deaf: false, channelId: partida.canalMuertosId });
};
