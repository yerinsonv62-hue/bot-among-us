const jugadoresMuertos = require("../state/jugadoresMuertos");
const desmutearTodos = require("./desmutearTodos");

module.exports = async function terminarPartida(canalVoz) {
  jugadoresMuertos.clear();
  await desmutearTodos(canalVoz);
};
