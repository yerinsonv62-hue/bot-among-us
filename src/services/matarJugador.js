const jugadoresMuertos = require("../state/jugadoresMuertos");

module.exports = async function matarJugador(miembro) {
  jugadoresMuertos.add(miembro.id);
  await Promise.all([
    miembro.voice.setMute(false).catch(() => null),
    miembro.voice.setDeaf(false).catch(() => null)
  ]);
};
