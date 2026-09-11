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

// Definición de Slash Commands incluyendo el comando /panel
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

// Manejo de Interacciones (Slash Commands y Botones)
client.on("interactionCreate", async (interaction) => {
    // 1. Si es un botón interactivo del panel
    if (interaction.isButton()) {
        const canalVoz = await obtenerCanalVozUsuario(interaction.user, interaction.guildId);
        if (!canalVoz) {
            return interaction.reply({ content: "⚠️ Debes estar conectado a un canal de voz.", ephemeral: true });
        }

        if (interaction.customId === "btn_start") {
            await iniciarTareas(canalVoz);
            return interaction.reply({ content: `🎮 Tareas iniciadas en **${canalVoz.name}**. ¡A silenciarse!`, ephemeral: true });
        }
        if (interaction.customId === "btn_meeting") {
            await iniciarReunion(canalVoz);
            return interaction.reply({ content: `📢 Reunión convocada en **${canalVoz.name}**. ¡A hablar!`, ephemeral: true });
        }
        if (interaction.customId === "btn_stop") {
            await terminarPartida(canalVoz);
            return interaction.reply({ content: `🏁 Partida finalizada en **${canalVoz.name}**.`);
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

    if (commandName === "start") {
        const canalOpcion = options.getChannel("channel");
        let canalVoz = canalOpcion || (await obtenerCanalVozUsuario(user, guildId));

        if (!canalVoz) {
            return interaction.reply({ content: "⚠️ Debes estar conectado a un canal de voz.", ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });
        await iniciarTareas(canalVoz);
        return interaction.editReply(`🎮 Tareas iniciadas en **${canalVoz.name}**.`);
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

client.login(process.env.DISCORD_TOKEN);
