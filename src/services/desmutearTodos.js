const procesarUltraRapido = require("./procesarUltraRapido");
const actualizarVoz = require("./actualizarVoz");

module.exports = async function desmutearTodos(canalVoz) {
  await procesarUltraRapido(canalVoz, (miembro) => actualizarVoz(miembro, { mute: false, deaf: false }));
};
