/** Mantiene cinco peticiones de Discord activas como máximo, sin ráfagas. */
module.exports = async function procesarUltraRapido(canalVoz, callback) {
  const miembros = [...canalVoz.members.values()].filter(({ user }) => !user.bot);
  const limite = 5;
  let siguiente = 0;

  async function carril() {
    while (siguiente < miembros.length) {
      const miembro = miembros[siguiente++];
      await callback(miembro);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limite, miembros.length) }, carril));
};
