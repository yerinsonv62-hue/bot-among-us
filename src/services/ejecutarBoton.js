const iniciarTareas = require("./iniciarTareas");
const iniciarReunion = require("./iniciarReunion");
const terminarPartida = require("./terminarPartida");
const silenciarTodos = require("./silenciarTodos");
const desmutearTodos = require("./desmutearTodos");
const limpiarMuertos = require("./limpiarMuertos");
const crearPanel = require("./crearPanel");

const acciones = {
  btn_start: iniciarTareas,
  btn_meeting: iniciarReunion,
  // Las acciones de emergencia conservan la fase actual de la partida.
  btn_mute: silenciarTodos,
  btn_unmute: desmutearTodos,
  btn_clear_dead: limpiarMuertos,
  btn_stop: terminarPartida
};

module.exports = async function ejecutarBoton(idBoton, canalVoz, operador) {
  const accion = acciones[idBoton];
  if (!accion) return false;
  await accion(canalVoz);
  return crearPanel({ canalVoz, operador });
};
