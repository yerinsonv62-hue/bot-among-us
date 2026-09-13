const partidas = require("../state/partidas");
const crearPanel = require("./crearPanel");

/** Actualiza el único panel activo de la partida sin crear mensajes nuevos. */
module.exports = async function actualizarPanel(guild, canalVoz, operador = null) {
  const partida = partidas.obtener(guild.id);
  if (!partida.panel) return;

  const canalTexto = guild.channels.cache.get(partida.panel.canalTextoId);
  const mensaje = await canalTexto?.messages.fetch(partida.panel.mensajeId).catch(() => null);
  if (!mensaje) {
    delete partida.panel;
    return;
  }

  await mensaje.edit(crearPanel({ canalVoz, operador })).catch((error) => {
    console.error("No se pudo actualizar el panel:", error.message);
  });
};
