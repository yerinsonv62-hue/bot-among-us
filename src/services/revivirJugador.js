const partidas = require("../state/partidas");
const actualizarVoz = require("./actualizarVoz");

module.exports = async function revivirJugador(miembro) {
  const partida = partidas.obtener(miembro.guild.id);
  partida.muertos.delete(miembro.id);
  const enTareas = partida.fase === "tareas";
  await actualizarVoz(miembro, {
    mute: enTareas,
    deaf: enTareas,
    channelId: partida.canalPrincipalId
  });
};
