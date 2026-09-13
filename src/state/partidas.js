// Una sesión independiente por servidor: no se comparte estado entre guilds.
const partidas = new Map();

function crearPartida() {
  return {
    fase: "lobby",
    canalPrincipalId: null,
    canalMuertosId: null,
    panel: null,
    muertos: new Set()
  };
}

module.exports = {
  obtener(guildId) {
    if (!partidas.has(guildId)) partidas.set(guildId, crearPartida());
    return partidas.get(guildId);
  }
};
