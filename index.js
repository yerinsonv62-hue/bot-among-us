const { 
    Client, 
    GatewayIntentBits, 
    SlashCommandBuilder, 
    Partials,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChannelType,
    PermissionFlagsBits
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

// Ejecución ultra rápida en paralelo para todos de golpe
async function procesarUltraRapido(canalVoz, callback) {
    const miembros = Array.from(canalVoz.members.values()).filter(m => !m.user.bot);
    await Promise.all(miembros.map(callback));
}

async function iniciarTareas(canalVoz) {
    await procesarUltraRapido(canalVoz, async (miembro) => {
        if (jugadoresMuertos.has(miembro.id)) {
            await Promise.all([
                miembro.voice.setMute(false).catch(() => {}),
                miembro.voice.setDeaf(false).catch(() => {})
            ]);
        } else {
            await Promise.all([
                miembro.voice.setMute(true).catch(() => {}),
                miembro.voice.setDeaf(true).catch(() => {})
            ]);
        }
    });
}

async function iniciarReunion(canalVoz) {
    await procesarUltraRapido(canalVoz, async (miembro) => {
        if (jugadoresMuertos.has(miembro.id)) {
            await Promise.all([
                miembro.voice.setMute(true).catch(() => {}),
                miembro.voice.setDeaf(false).catch(() => {})
            ]);
        } else {
            await Promise.all([
                miembro.voice.setMute(false).catch(() => {}),
                miembro.voice.setDeaf(false).catch(() => {})
            ]);
        }
    });
}

async function silenciarTodos(canalVoz) {
    await procesarUltraRapido(canalVoz, async (miembro) => {
        await miembro.voice.setMute(true).catch(() => {});
    });
}

async function desmutearTodos(canalVoz) {
    await procesarUltraRapido(canalVoz, async (miembro) => {
        await Promise.all([
            miembro.voice.setMute(false).catch(() => {}),
            miembro.voice.setDeaf(false).catch(() => {})
        ]);
    });
}

async function matarJugador(miembro) {
    jugadoresMuertos.add(miembro.id);
    await Promise.all([
        miembro.voice.setMute(false).catch(() => {}),
        miembro.voice.setDeaf(false).catch(() => {})
    ]);
}

async function revivirJugador(miembro) {
    jugadoresMuertos.delete(miembro.id);
    await Promise.all([
        miembro.voice.setMute(true).catch(() => {}),
        miembro.voice.setDeaf(true).catch(() => {})
    ]);
}

async function terminarPartida(canalVoz) {
    jugadoresMuertos.clear();
    await procesarUltraRapido(canalVoz, async (miembro) => {
        await Promise.all([
            miembro.voice.setMute(false).catch(() => {}),
            miembro.voice.setDeaf(false).catch(() => {})
        ]);
    });
}

const commands = [
    new SlashCommandBuilder()
        .setName("start")
        .setDescription("Inicia la partida y mutea a todos")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option => option.setName("code").setDescription("Código de la partida").setRequired(false))
        .addIntegerOption(option => option.setName("timer").setDescription("Tiempo").setRequired(false))
        .addChannelOption(option => option.setName("channel").setDescription("Canal de voz").addChannelTypes(ChannelType.GuildVoice).setRequired(false)),
    new SlashCommandBuilder().setName("meeting").setDescription("Desmutea a todos para una reunión").setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    new SlashCommandBuilder().setName("stop").setDescription("Termina la partida y desmutea a todos").setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    new SlashCommandBuilder().setName("panel").setDescription("Envía el panel de control con botones interactivos").setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    new SlashCommandBuilder().setName("mute").setDescription("Mutea a todos").setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    new SlashCommandBuilder().setName("unmute").setDescription("Desmutea a todos").setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    new SlashCommandBuilder()
        .setName("dead")
        .setDescription("Mutea a un jugador muerto")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addUserOption(option => option.setName("usuario").setDescription("Jugador que murió").setRequired(true)),
    new SlashCommandBuilder()
        .setName("alive")
        .setDescription("Desmutea a un jugador")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
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
    const esAdmin = interaction.member?.permissions.has(PermissionFlagsBits.Administrator);

    if (interaction.isButton()) {
        if (!esAdmin) {
            return interaction.reply({ content: "⚠️ Solo los administradores pueden usar este panel.", ephemeral: true });
        }

        const canalVoz = await obtenerCanalVozUsuario(interaction.user, interaction.guildId);
        if (!canalVoz) {
            return interaction.reply({ content: "⚠️ Debes estar conectado a un canal de voz.", ephemeral: true });
        }

        // Reconoce el clic al instante sin texto ni "pensando"
        await interaction.deferUpdate();

        if (interaction.customId === "btn_start") {
            iniciarTareas(canalVoz);
        } else if (interaction.customId === "btn_meeting") {
            iniciarReunion(canalVoz);
        } else if (interaction.customId === "btn_stop") {
            terminarPartida(canalVoz);
        }
        return;
    }

    if (!interaction.isChatInputCommand()) return;

    if (!esAdmin) {
        return interaction.reply({ content: "⚠️ No tienes permisos de administrador para usar este comando.", ephemeral: true });
    }

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
        return interaction.editReply({ content: `🎮 Tareas iniciadas en **${canalVoz.name}**.` });
    } else if (commandName === "meeting") {
        await iniciarReunion(canalVoz);
        return interaction.editReply({ content: `📢 Reunión convocada en **${canalVoz.name}**.` });
    } else if (commandName === "stop") {
        await terminarPartida(canalVoz);
        return interaction.editReply({ content: `🏁 Partida finalizada en **${canalVoz.name}**.` });
    } else if (commandName === "mute") {
        await silenciarTodos(canalVoz);
        return interaction.editReply({ content: `🔇 Todos silenciados.` });
    } else if (commandName === "unmute") {
        await desmutearTodos(canalVoz);
        return interaction.editReply({ content: `🔊 Todos desmuteados.` });
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

client.on("messageCreate", async (message) => {
    if (message.author.bot || !message.guild) return;

    const miembro = await message.guild.members.fetch(message.author.id).catch(() => null);
    if (!miembro || !miembro.permissions.has(PermissionFlagsBits.Administrator)) return;

    const contenido = message.content.trim().toLowerCase();
    const comandosValidos = ["start", ".start", "meeting", ".meeting", "stop", ".stop", "dead", ".dead", "mute", "unmute"];
    
    if (!comandosValidos.some(cmd => contenido.startsWith(cmd))) return;

    const canalVoz = await obtenerCanalVozUsuario(message.author, message.guild.id);

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
