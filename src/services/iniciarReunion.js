const partidas = require("../state/partidas");
const procesarUltraRapido = require("./procesarUltraRapido");
const actualizarVoz = require("./actualizarVoz");

module.exports = async function iniciarReunion(canalVoz) {
  const partida = partidas.obtener(canalVoz.guild.id);
  partida.fase = "reunion";
  partida.canalPrincipalId = canalVoz.id;
  await procesarUltraRapido(canalVoz, async (miembro) => {
    await actualizarVoz(miembro, { mute: partida.muertos.has(miembro.id), deaf: false });
  });
};
