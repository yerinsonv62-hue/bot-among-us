/** Devuelve el canal de voz actual del usuario sin recorrer otros servidores. */
module.exports = async function obtenerCanalVozUsuario(guild, userId) {
  const miembroEnCache = guild.members.cache.get(userId);
  if (miembroEnCache?.voice.channel) return miembroEnCache.voice.channel;

  const miembro = await guild.members.fetch(userId).catch(() => null);
  return miembro?.voice.channel ?? null;
};
