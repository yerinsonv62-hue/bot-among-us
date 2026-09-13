const partidas = require("../state/partidas");
const procesarUltraRapido = require("./procesarUltraRapido");
const actualizarVoz = require("./actualizarVoz");

module.exports = async function iniciarTareas(canalVoz) {
  const partida = partidas.obtener(canalVoz.guild.id);
  partida.fase = "tareas";
  partida.canalPrincipalId = canalVoz.id;
  await procesarUltraRapido(canalVoz, async (miembro) => {
    if (!partida.muertos.has(miembro.id)) await actualizarVoz(miembro, { mute: true, deaf: true });
  });
};
