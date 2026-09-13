const iniciarTareas = require("./iniciarTareas");
const iniciarReunion = require("./iniciarReunion");
const terminarPartida = require("./terminarPartida");

const acciones = {
  btn_start: iniciarTareas,
  btn_meeting: iniciarReunion,
  btn_stop: terminarPartida
};

module.exports = async function ejecutarBoton(idBoton, canalVoz) {
  const accion = acciones[idBoton];
  if (!accion) return false;
  await accion(canalVoz);
  return true;
};
