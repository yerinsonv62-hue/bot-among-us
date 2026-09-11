const {
  Client,
  GatewayIntentBits,
  PermissionFlagsBits,
  SlashCommandBuilder,
  Partials,
  ChannelType
} = require("discord.js");
const { joinVoiceChannel, VoiceConnectionStatus } = require("@discordjs/voice");
require("dotenv").config();

// Prevención de crasheos del servidor
process.on("unhandledRejection", (reason) => console.error("⚠️ Error no capturado:", reason));
process.on("uncaughtException", (error) => console.error("⚠️ Excepción no capturada:", error));

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

// Variables de estado
const estadoCanales = new Map();
const usuariosHablando = new Set();
const jugadoresMuertos = new Set();

// Funciones de lógica de juego
async function iniciarTareas(canalVoz) {
  for (const miembro of canalVoz.members.values()) {
    if (miembro.user.bot) continue;
    if (jugadoresMuertos.has(miembro.id)) {
      await miembro.voice.setMute(false);
      await miembro.voice.setDeaf(false);
    } else {
      await miembro.voice.setMute(true);
      await miembro.voice.setDeaf(true);
    }
  }
}

async function iniciarReunion(canalVoz) {
  for (const miembro of canalVoz.members.values()) {
    if (miembro.user.bot) continue;
    if (jugadoresMuertos.has(miembro.id)) {
      await miembro.voice.setMute(true);
      await miembro.voice.setDeaf(false);
    } else {
      await miembro.voice.setMute(false);
      await miembro.voice.setDeaf(false);
    }
  }
}

async function matarJugador(miembro) {
  jugadoresMuertos.add(miembro.id);
  await miembro.voice.setMute(false);
  await miembro.voice.setDeaf(false);
}

async function terminarPartida(canalVoz) {
  jugadoresMuertos.clear();
  for (const miembro of canalVoz.members.values()) {
    if (miembro.user.bot) continue;
    await miembro.voice.setMute(false);
    await miembro.voice.setDeaf(false);
  }
}

// Evento Ready
client.once("ready", () => {
  console.log(`Bot conectado exitosamente como ${client.user.tag}`);
});

// Escuchador de Comandos por DM
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (message.channel.type === ChannelType.DM || !message.guild) {
    const contenido = message.content.trim().toLowerCase();

    let canalVoz = null;
    for (const guild of client.guilds.cache.values()) {
      try {
        const miembro = await guild.members.fetch(message.author.id);
        if (miembro && miembro.voice.channel) {
          canalVoz = miembro.voice.channel;
          break;
        }
      } catch (err) {}
    }

    if (!canalVoz) {
      return message.reply("Debes estar conectado a un canal de voz en un servidor.");
    }

    if (contenido === "start" || contenido === ".start") {
      await iniciarTareas(canalVoz);
      return message.reply(`🎮 **Tareas iniciadas** en **${canalVoz.name}**.`);
    }

    if (contenido === "meeting" || contenido === ".meeting") {
      await iniciarReunion(canalVoz);
      return message.reply(`📢 **Reunión convocada** en **${canalVoz.name}**.`);
    }

    if (contenido.startsWith(".dead") || contenido.startsWith("dead")) {
      const mencion = message.mentions.members.first();
      if (!mencion) return message.reply("Menciona al jugador muerto. Ej: `.dead @Usuario`");
      await matarJugador(mencion);
      return message.reply(`💀 **${mencion.user.username}** es ahora un fantasma.`);
    }

    if (contenido === "stop" || contenido === ".stop") {
      await terminarPartida(canalVoz);
      return message.reply(`🏁 **Partida finalizada** en **${canalVoz.name}**.`);
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
