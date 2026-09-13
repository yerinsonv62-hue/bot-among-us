const { 
    Client, 
    GatewayIntentBits, 
    SlashCommandBuilder, 
    Partials,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
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

// Función auxiliar para lotes seguros (límite de 15 por lote)
async function procesarEnLotes(canalVoz, callback) {
    const miembros = Array.from(canalVoz.members.values()).filter(m => !m.user.bot);
    const tamanoLote = 15;

    for (let i = 0; i < miembros.length; i += tamanoLote) {
        const lote = miembros.slice(i, i + tamanoLote);
        await Promise.all(lote.map(callback));
        if (i + tamanoLote < miembros.length) {
            await new Promise(r => setTimeout(r, 150));
        }
    }
}

async function iniciarTareas(canalVoz) {
    await procesarEnLotes(canalVoz, async (miembro) => {
        if (jugadoresMuertos.has(miembro.id)) {
            await miembro.voice.setMute(false).catch(() => {});
            await miembro.voice.setDeaf(false).catch(() => {});
        } else {
            await miembro.voice.setMute(true).catch(() => {});
            await miembro.voice.setDeaf(true).catch(() => {});
        }
    });
}

async function iniciarReunion(canalVoz) {
    await procesarEnLotes(canalVoz, async (miembro) => {
        if (jugadoresMuertos.has(miembro.id)) {
            await miembro.voice.setMute(true).catch(() => {});
            await miembro.voice.setDeaf(false).catch(() => {});
        } else {
            await miembro.voice.setMute(false).catch(() => {});
            await miembro.voice.setDeaf(false).catch(() => {});
        }
    });
}

async function silenciarTodos(canalVoz) {
    await procesarEnLotes(canalVoz, async (miembro) => {
        await miembro.voice.setMute(true).catch(() => {});
    });
}

async function desmutearTodos(canalVoz) {
    await procesarEnLotes(canalVoz, async (miembro) => {
        await miembro.voice.setMute(false).catch(() => {});
        await miembro.voice.setDeaf(false).catch(() => {});
    });
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
    await procesarEnLotes(canalVoz, async (miembro) => {
        await miembro.voice.setMute(false).catch(() => {});
        await miembro.voice.setDeaf(false).catch(() => {});
    });
}

const commands = [
    new SlashCommandBuilder()
        .setName("start")
        .setDescription("Inicia la partida y mutea a todos")
        .addStringOption(option => option.setName("code").setDescription("Código de la partida").setRequired(false))
        .addIntegerOption(option => option.setName("timer").setDescription("Tiempo").setRequired(false))
        .addChannelOption(option => option.setName("channel").setDescription("Canal de voz").addChannelTypes(ChannelType.GuildVoice).setRequired(false)),
    new SlashCommandBuilder().setName("meeting").setDescription("Desmutea a todos para una reunión"),
    new SlashCommandBuilder().setName("stop").setDescription("Termina la partida y desmutea a todos"),
    new SlashCommandBuilder().setName("panel").setDescription("Envía el panel de control con botones interactivos"),
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
        console.log("Slash commands registrados correctamente.");
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
    if (interaction.isButton()) {
        const canalVoz = await obtenerCanalVozUsuario(interaction.user, interaction.guildId);
        if (!canalVoz) {
            return interaction.reply({ content: "⚠️ Debes estar conectado a un canal de voz.", ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        if (interaction.customId === "btn_start") {
            await iniciarTareas(canalVoz);
            return interaction.editReply({ content: `🎮 Tareas iniciadas en **${canalVoz.name}**. ¡A silenciarse!` });
        }
        if (interaction.customId === "btn_meeting") {
            await iniciarReunion(canalVoz);
            return interaction.editReply({ content: `📢 Reunión convocada en **${canalVoz.name}**. ¡A hablar!` });
        }
        if (interaction.customId === "btn_stop") {
            await terminarPartida(canalVoz);
            return interaction.editReply({ content: `🏁 Partida finalizada en **${canalVoz.name}**.` });
        }
    }

    if (!interaction.isChatInputCommand()) return;

    const { commandName, user, options, guildId } = interaction;

    if (commandName === "panel") {
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("btn_start").setLabel("Iniciar Tareas (Mute)").setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId("btn_meeting").setLabel("Reunión (Hablar)").setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId("btn_stop").setLabel("Terminar Partida").setStyle(ButtonStyle.Danger)
        );

        return interaction.reply({
            content: "🎮 **Panel de Control de Among Us**\nUsa los botones de abajo para cambiar los estados de voz rápidamente desde cualquier dispositivo:",
            components: [row]
        });
    }

    const canalVoz = await obtenerCanalVozUsuario(user, guildId);
    if (!canalVoz) {
        return interaction.reply({ content: "⚠️ Debes estar conectado a un canal de voz.", ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    if (commandName === "start") {
        await iniciarTareas(canalVoz);
        return interaction.editReply(`🎮 Tareas iniciadas en **${canalVoz.name}**.`);
    } else if (commandName === "meeting") {
        await iniciarReunion(canalVoz);
        return interaction.editReply(`📢 Reunión convocada en **${canalVoz.name}**.`);
    } else if (commandName === "stop") {
        await terminarPartida(canalVoz);
        return interaction.editReply(`🏁 Partida finalizada en **${canalVoz.name}**.`);
    } else if (commandName === "mute") {
        await silenciarTodos(canalVoz);
        return interaction.editReply(`🔇 Todos silenciados.`);
    } else if (commandName === "unmute") {
        await desmutearTodos(canalVoz);
        return interaction.editReply(`🔊 Todos desmuteados.`);
    } else if (commandName === "dead") {
        const miembroMeta = options.getMember("usuario");
        if (!miembroMeta) return interaction.editReply("No se encontró al usuario.");
        await matarJugador(miembroMeta);
        return interaction.editReply(`💀 ${miembroMeta.user.username} marcado como muerto.`);
    } else if (commandName === "alive") {
        const miembroMeta = options.getMember("usuario");
        if (!miembroMeta) return interaction.editReply("No se encontró al usuario.");
        await revivirJugador(miembroMeta);
        return interaction.editReply(`✨ ${miembroMeta.user.username} revivido.`);
    }
});

// Control por mensajes de texto directos o DM
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
