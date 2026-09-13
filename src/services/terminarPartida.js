const partidas = require("../state/partidas");
const desmutearTodos = require("./desmutearTodos");
const actualizarVoz = require("./actualizarVoz");
const procesarUltraRapido = require("./procesarUltraRapido");

module.exports = async function terminarPartida(canalVoz) {
  const partida = partidas.obtener(canalVoz.guild.id);
  const miembrosMuertos = await Promise.all([...partida.muertos].map((id) => canalVoz.guild.members.fetch(id).catch(() => null)));
  // Devuelve a los muertos de la sala secundaria antes de liberar la voz.
  await procesarUltraRapido({ members: new Map(miembrosMuertos.filter(Boolean).map((miembro) => [miembro.id, miembro])) }, (miembro) =>
    actualizarVoz(miembro, { mute: false, deaf: false, channelId: canalVoz.id })
  );
  partida.muertos.clear();
  partida.fase = "lobby";
  partida.canalPrincipalId = canalVoz.id;
  await desmutearTodos(canalVoz);
};
