const { PermissionFlagsBits } = require("discord.js");
const obtenerCanalVozUsuario = require("../services/obtenerCanalVozUsuario");

module.exports = async function messageCreate(message) {
  if (message.author.bot || !message.guild) return;

  const miembro = await message.guild.members.fetch(message.author.id).catch(() => null);
  if (!miembro?.permissions.has(PermissionFlagsBits.Administrator)) return;

  const contenido = message.content.trim().toLowerCase();
  const comando = [...message.client.commands.values()].find(({ aliases = [] }) =>
    aliases.some((alias) => contenido === alias || contenido.startsWith(`${alias} `))
  );
  if (!comando) return;

  const miembroObjetivo = message.mentions.members.first() ?? null;
  const canalVoz = await obtenerCanalVozUsuario(message.guild, message.author.id);
  if (comando.needsVoiceChannel !== false && !canalVoz) {
    return message.reply("⚠️ Debes estar conectado a un canal de voz para usar los comandos.");
  }

  const respuesta = await comando.execute({ message, canalVoz, miembroObjetivo });
  if (typeof respuesta === "string") await message.reply(respuesta);
};
