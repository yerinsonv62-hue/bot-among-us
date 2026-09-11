const { 
    Client, 
    GatewayIntentBits, 
    SlashCommandBuilder, 
    Partials,
    ChannelType
} = require("discord.js");
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
    partials: [Partials.Channel, Partials.Message]
});

const jugadoresMuertos = new Set();

async function iniciarTareas(canalVoz) {
    for (const miembro of canalVoz.members.values()) {
        if (miembro.user.bot) continue;
        if (jugadoresMuertos.has(miembro.id)) {
            await miembro.voice.setMute(false).catch(() => {});
            await miembro.voice.setDeaf(false).catch(() => {});
        } else {
            await miembro.voice.setMute(true).catch(() => {});
            await miembro.voice.setDeaf(true).catch(() => {});
        }
    }
}

async function iniciarReunion(canalVoz) {
    for (const miembro of canalVoz.members.values()) {
        if (miembro.user.bot) continue;
        if (jugadoresMuertos.has(miembro.id)) {
            await miembro.voice.setMute(true).catch(() => {});
            await miembro.voice.setDeaf(false).catch(() => {});
        } else {
            await miembro.voice.setMute(false).catch(() => {});
            await miembro.voice.setDeaf(false).catch(() => {});
        }
    }
}

async function silenciarTodos(canalVoz) {
    for (const miembro of canalVoz.members.values()) {
        if (miembro.user.bot) continue;
        await miembro.voice.setMute(true).catch(() => {});
    }
}

async function desmutearTodos(canalVoz) {
    for (const miembro of canalVoz.members.values()) {
        if (miembro.user.bot) continue;
        await miembro.voice.setMute(false).catch(() => {});
        await miembro.voice.setDeaf(false).catch(() => {});
    }
}

async function matarJugador(miembro) {
    jugadoresMuertos.add(miembro.id);
    await miembro.voice.setMute(false).catch(() => {});
    await miembro.voice.setDeaf(false).catch(() => {});
}

async function revivirJugador(miembro) {
    jugadoresMuertos.delete(miembro.id);
    await miembro.voice.setMute(true).catch(() => {});
    await miembro.voice.setDeaf(true).catch(() => {});
}

async function terminarPartida(canalVoz) {
    jugadoresMuertos.clear();
    for (const miembro of canalVoz.members.values()) {
        if (miembro.user.bot) continue;
        await miembro.voice.setMute(false).catch(() => {});
        await miembro.voice.setDeaf(false).catch(() => {});
    }
}

// Definición de Slash Commands con las opciones de code, timer y channel en /start
const commands = [
    new SlashCommandBuilder()
        .setName("start")
        .setDescription("Inicia la partida y mutea a todos")
        .addStringOption(option => 
            option.setName("code").setDescription("Código de la partida de Among Us").setRequired(false))
        .addIntegerOption(option => 
            option.setName("timer").setDescription("Tiempo de discusión o configuración").setRequired(false))
        .addChannelOption(option => 
            option.setName("channel").setDescription("Canal de voz a utilizar").addChannelTypes(ChannelType.GuildVoice).setRequired(false)),
    new SlashCommandBuilder().setName("meeting").setDescription("Desmutea a todos para una reunión"),
    new SlashCommandBuilder().setName("stop").setDescription("Termina la partida y desmutea a todos"),
    new SlashCommandBuilder().setName("mute").setDescription("Mutea a todos"),
    new SlashCommandBuilder().setName("unmute").setDescription("Desmutea a todos"),
    new SlashCommandBuilder()
        .setName("dead")
        .setDescription("Mutea a un jugador muerto")
        .addUserOption(option => option.setName("usuario").setDescription("Jugador que murió").setRequired(true)),
    new SlashCommandBuilder()
        .setName("alive")
        .setDescription("Desmutea a un jugador")
        .addUserOption(option => option.setName("usuario").setDescription("Jugador a revivir").setRequired(true))
];

client.once("ready", async () => {
    console.log(`Bot conectado exitosamente como ${client.user.tag}`);
    try {
        await client.application.commands.set(commands);
        console.log("Slash commands registrados correctamente con opciones.");
    } catch (error) {
        console.error("Error al registrar slash commands:", error);
    }
});

async function obtenerCanalVozUsuario(user, guildId = null) {
    if (guildId) {
        const guild = client.guilds.cache.get(guildId);
        if (guild) {
            try {
                const miembro = await guild.members.fetch(user.id);
                if (miembro && miembro.voice.channel) return miembro.voice.channel;
            } catch (err) {}
        }
    }
    for (const guild of client.guilds.cache.values()) {
        try {
            const miembro = await guild.members.fetch(user.id);
            if (miembro && miembro.voice.channel) return miembro.voice.channel;
        } catch (err) {}
    }
    return null;
}

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName, user, options, guildId } = interaction;

    if (commandName === "start") {
        // Obtener el canal especificado en la opción o buscar el del usuario automáticamente
        const canalOpcion = options.getChannel("channel");
        const codigoPartida = options.getString("code");
        const tiempoTimer = options.getInteger("timer");

        let canalVoz = canalOpcion || (await obtenerCanalVozUsuario(user, guildId));

        if (!canalVoz) {
            return interaction.reply({ content: "⚠️ Debes estar conectado a un canal de voz o seleccionar uno en la opción.", ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });
        await iniciarTareas(canalVoz);

        let respuesta = `🎮 Tareas iniciadas en **${canalVoz.name}**`;
        if (codigoPartida) respuesta += ` | Código: \`${codigoPartida}\``;
        if (tiempoTimer) respuesta += ` | Timer: \`${tiempoTimer}s\``;

        await interaction.editReply(respuesta);
        return;
    }

    const canalVoz = await obtenerCanalVozUsuario(user, guildId);
    if (!canalVoz) {
        return interaction.reply({ content: "⚠️ Debes estar conectado a un canal de voz.", ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    if (commandName === "meeting") {
        await iniciarReunion(canalVoz);
        await interaction.editReply(`📢 Reunión convocada en **${canalVoz.name}**.`);
    } else if (commandName === "stop") {
        await terminarPartida(canalVoz);
        await interaction.editReply(`🏁 Partida finalizada en **${canalVoz.name}**.`);
    } else if (commandName === "mute") {
        await silenciarTodos(canalVoz);
        await interaction.editReply(`🔇 Todos silenciados.`);
    } else if (commandName === "unmute") {
        await desmutearTodos(canalVoz);
        await interaction.editReply(`🔊 Todos desmuteados.`);
    } else if (commandName === "dead") {
        const miembroMeta = options.getMember("usuario");
        if (!miembroMeta) return interaction.editReply("No se encontró al usuario.");
        await matarJugador(miembroMeta);
        await interaction.editReply(`💀 ${miembroMeta.user.username} marcado como muerto.`);
    } else if (commandName === "alive") {
        const miembroMeta = options.getMember("usuario");
        if (!miembroMeta) return interaction.editReply("No se encontró al usuario.");
        await revivirJugador(miembroMeta);
        await interaction.editReply(`✨ ${miembroMeta.user.username} revivido.`);
    }
});

// Control por mensajes de texto directos o DM por si acaso
client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    const contenido = message.content.trim().toLowerCase();
    const comandosValidos = ["start", ".start", "meeting", ".meeting", "stop", ".stop", "dead", ".dead", "mute", "unmute"];
    
    if (!comandosValidos.some(cmd => contenido.startsWith(cmd))) return;

    const canalVoz = await obtenerCanalVozUsuario(message.author);

    if (!canalVoz) {
        return message.reply("⚠️ Debes estar conectado a un canal de voz para usar los comandos.");
    }

    if (contenido === "start" || contenido === ".start") {
        await iniciarTareas(canalVoz);
        return message.reply(`🎮 Tareas iniciadas en **${canalVoz.name}**.`);
    } else if (contenido === "meeting" || contenido === ".meeting") {
        await iniciarReunion(canalVoz);
        return message.reply(`📢 Reunión convocada en **${canalVoz.name}**.`);
    } else if (contenido === "stop" || contenido === ".stop") {
        await terminarPartida(canalVoz);
        return message.reply(`🏁 Partida finalizada en **${canalVoz.name}**.`);
    } else if (contenido === "mute") {
        await silenciarTodos(canalVoz);
        return message.reply(`🔇 Canal silenciado.`);
    } else if (contenido === "unmute") {
        await desmutearTodos(canalVoz);
        return message.reply(`🔊 Canal desmuteado.`);
    } else if (contenido.startsWith("dead") || contenido.startsWith(".dead")) {
        const mencion = message.mentions.members.first();
        if (!mencion) return message.reply("Menciona al jugador muerto. Ej: `.dead @Usuario`");
        await matarJugador(mencion);
        return message.reply(`💀 **${mencion.user.username}** registrado como muerto.`);
    }
});

client.login(process.env.DISCORD_TOKEN);
