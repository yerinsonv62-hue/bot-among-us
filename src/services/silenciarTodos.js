const procesarUltraRapido = require("./procesarUltraRapido");
const actualizarVoz = require("./actualizarVoz");

module.exports = async function silenciarTodos(canalVoz) {
  await procesarUltraRapido(canalVoz, (miembro) => actualizarVoz(miembro, { mute: true }));
};
