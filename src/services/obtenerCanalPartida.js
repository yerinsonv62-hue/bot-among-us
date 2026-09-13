const partidas = require("../state/partidas");
const obtenerCanalVozUsuario = require("./obtenerCanalVozUsuario");

/** Usa el canal principal configurado para la partida o el canal del administrador. */
module.exports = async function obtenerCanalPartida(guild, userId) {
  const partida = partidas.obtener(guild.id);
  if (partida.canalPrincipalId) {
    const canal = guild.channels.cache.get(partida.canalPrincipalId)
      ?? await guild.channels.fetch(partida.canalPrincipalId).catch(() => null);
    if (canal?.isVoiceBased()) return canal;
  }
  return obtenerCanalVozUsuario(guild, userId);
};
