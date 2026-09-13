const procesarUltraRapido = require("./procesarUltraRapido");

module.exports = async function desmutearTodos(canalVoz) {
  await procesarUltraRapido(canalVoz, (miembro) => Promise.all([
    miembro.voice.setMute(false).catch(() => null),
    miembro.voice.setDeaf(false).catch(() => null)
  ]));
};
