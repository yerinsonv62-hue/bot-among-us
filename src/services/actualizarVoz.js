/** Envía mute, deaf y traslado en una única actualización de miembro. */
module.exports = async function actualizarVoz(miembro, { mute, deaf, channelId } = {}) {
  const cambios = {};
  if (typeof mute === "boolean") cambios.mute = mute;
  if (typeof deaf === "boolean") cambios.deaf = deaf;
  if (channelId) cambios.channel = channelId;

  try {
    await miembro.edit(cambios);
  } catch (error) {
    console.error(`No se pudo actualizar la voz de ${miembro.user.tag}:`, error.message);
  }
};
