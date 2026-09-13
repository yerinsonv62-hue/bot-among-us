/** Ejecuta una acción para cada jugador humano del canal en paralelo. */
module.exports = async function procesarUltraRapido(canalVoz, callback) {
  const miembros = [...canalVoz.members.values()].filter(({ user }) => !user.bot);
  await Promise.all(miembros.map(callback));
};
