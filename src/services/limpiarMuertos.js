const partidas = require("../state/partidas");

/** Restablece el registro de muertes sin cambiar el estado de voz actual. */
module.exports = function limpiarMuertos(canalVoz) {
  partidas.obtener(canalVoz.guild.id).muertos.clear();
};
