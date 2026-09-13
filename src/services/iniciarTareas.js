const jugadoresMuertos = require("../state/jugadoresMuertos");
const procesarUltraRapido = require("./procesarUltraRapido");

module.exports = async function iniciarTareas(canalVoz) {
  await procesarUltraRapido(canalVoz, async (miembro) => {
    const estaMuerto = jugadoresMuertos.has(miembro.id);
    await Promise.all([
      miembro.voice.setMute(!estaMuerto).catch(() => null),
      miembro.voice.setDeaf(!estaMuerto).catch(() => null)
    ]);
  });
};
