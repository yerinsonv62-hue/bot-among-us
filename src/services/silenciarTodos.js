const procesarUltraRapido = require("./procesarUltraRapido");

module.exports = async function silenciarTodos(canalVoz) {
  await procesarUltraRapido(canalVoz, (miembro) => miembro.voice.setMute(true).catch(() => null));
};
