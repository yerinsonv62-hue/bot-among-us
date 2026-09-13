const fs = require("node:fs");
const path = require("node:path");

module.exports = function cargarComandos(client) {
  const directorio = path.join(__dirname, "..", "commands");
  const comandos = fs.readdirSync(directorio)
    .filter((archivo) => archivo.endsWith(".js"))
    .map((archivo) => require(path.join(directorio, archivo)));

  for (const comando of comandos) {
    client.commands.set(comando.data.name, comando);
  }

  return comandos;
};
