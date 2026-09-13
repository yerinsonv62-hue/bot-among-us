const jugadoresMuertos = require("../state/jugadoresMuertos");

module.exports = async function revivirJugador(miembro) {
  jugadoresMuertos.delete(miembro.id);
  await Promise.all([
    miembro.voice.setMute(true).catch(() => null),
    miembro.voice.setDeaf(true).catch(() => null)
  ]);
};
