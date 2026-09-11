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

// Prevención de crasheos
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

// Mapa de canales y registro de jugadores muertos
const estadoCanales = new Map();
const jugadoresMuertos = new Set();

// Funciones de control de la partida
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

client.once("ready", () => {
    console.log(`Bot conectado exitosamente como ${client.user.tag}`);
});

client.login(process.env.DISCORD_TOKEN);
