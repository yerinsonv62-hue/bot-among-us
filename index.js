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

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel] // Necesario para recibir DMs de usuarios
});

// Mapa para rastrear el estado de mute por canal (true = muteados, false = desmuteados)
const estadoCanales = new Map();
// Conjunto para almacenar los IDs de usuarios que están hablando en tiempo real
const usuariosHablando = new Set();

const commands = [
  new SlashCommandBuilder()
    .setName("start")
    .setDescription("Inicia la partida y mutea a todos"),
  new SlashCommandBuilder()
    .setName("meeting")
    .setDescription("Desmutea a todos para una reunión"),
  new SlashCommandBuilder()
    .setName("mute")
    .setDescription("Mutea a todos"),
  new SlashCommandBuilder()
    .setName("unmute")
    .setDescription("Desmutea a todos"),
  new SlashCommandBuilder()
    .setName("dead")
    .setDescription("Mutea a un jugador muerto")
    .addUserOption(option =>
      option
        .setName("jugador")
        .setDescription("Jugador muerto")
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName("alive")
    .setDescription("Desmutea a un jugador")
    .addUserOption(option =>
      option
        .setName("jugador")
        .setDescription("Jugador vivo")
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName("stop")
    .setDescription("Termina la partida y desmutea a todos")
].map(command => command.toJSON());

client.once("ready", async () => {
  console.log(`Bot conectado como ${client.user.tag}`);
  try {
    await client.application.commands.set(commands);
    console.log("Comandos registrados correctamente.");
  } catch (error) {
    console.error("Error registrando comandos:", error);
  }
});
client.on("messageCreate", async (message) => {
  // Ignorar mensajes de bots
  if (message.author.bot) return;

  // Comprobar si el mensaje viene por DM (Mensaje Privado)
  if (message.channel.type === ChannelType.DM || !message.guild) {
    const contenido = message.content.trim().toLowerCase();

    // 1. Buscar en qué servidor y canal de voz está el usuario que envió el DM
    let usuarioMiembro = null;
    let canalVoz = null;

    for (const guild of client.guilds.cache.values()) {
      try {
        const miembro = await guild.members.fetch(message.author.id);
        if (miembro && miembro.voice.channel) {
          usuarioMiembro = miembro;
          canalVoz = miembro.voice.channel;
          break; // Detener la búsqueda al encontrar el canal de voz activo del usuario
        }
      } catch (err) {
        // El usuario no pertenece a este servidor o no está en voz
      }
    }

    if (!canalVoz) {
      return message.reply("No te encontré en ningún canal de voz activo en los servidores donde estoy.");
    }

    // ==========================================
    // COMANDO 1: "sus" (Mute / Unmute por DM)
    // ==========================================
    if (contenido === "sus") {
      // Obtener o alternar el estado actual del canal
      const estadoActual = estadoCanales.get(canalVoz.id) || false;
      const nuevoEstado = !estadoActual;

      let procesados = 0;
      for (const miembro of canalVoz.members.values()) {
        if (miembro.user.bot) continue;
        try {
          await miembro.voice.setMute(nuevoEstado, "Comando sus por DM");
          procesados++;
        } catch (error) {
          console.error(`Error al modificar estado de ${miembro.user.tag}:`, error);
        }
      }

      estadoCanales.set(canalVoz.id, nuevoEstado);
      return message.reply(
        `Acción realizada en el canal **${canalVoz.name}**.\nJugadores ${
          nuevoEstado ? "muteados" : "desmuteados"
        }: ${procesados}`
      );
    }

    // ==========================================
    // COMANDO 2: ".i" (Unirse al canal y mutear no hablantes)
    // ==========================================
    if (contenido === ".i") {
      try {
        // Conectar el bot al canal de voz del usuario
        const conexion = joinVoiceChannel({
          channelId: canalVoz.id,
          guildId: canalVoz.guild.id,
          adapterCreator: canalVoz.guild.voiceAdapterCreator,
          selfMute: false,
          selfDeaf: false
        });

        message.reply(`Me he conectado al canal de voz **${canalVoz.name}**. Escuchando actividad de voz...`);

        // Escuchar eventos de habla
        conexion.receiver.speaking.on("start", (userId) => {
          usuariosHablando.add(userId);
        });

        conexion.receiver.speaking.on("end", (userId) => {
          usuariosHablando.delete(userId);
        });

        // Esperar 3 segundos de evaluación para determinar quién no está hablando y mutearlo
        setTimeout(async () => {
          let muteados = 0;
          for (const miembro of canalVoz.members.values()) {
            if (miembro.user.bot) continue;

            // Si el miembro NO está en la lista de usuarios que hablaron
            if (!usuariosHablando.has(miembro.id)) {
              try {
                await miembro.voice.setMute(true, "Inactivo / Silencioso detectado por .i");
                muteados++;
              } catch (e) {
                console.error(`No se pudo mutear a ${miembro.user.tag}`);
              }
            }
          }
          message.reply(`Evaluación completada en **${canalVoz.name}**. Muteados por silencio: ${muteados}`);
        }, 3000);

      } catch (error) {
        console.error("Error al conectar al canal de voz:", error);
        return message.reply("No pude unirme al canal de voz.");
      }
    }
  }
});
function obtenerCanal(interaction) {
  return interaction.member.voice.channel;
}

function tienePermiso(interaction) {
  return interaction.member.permissions.has(
    PermissionFlagsBits.ModerateMembers
  );
}

async function mutearTodos(canal) {
  let cantidad = 0;
  for (const miembro of canal.members.values()) {
    if (miembro.user.bot) continue;
    try {
      await miembro.voice.setMute(true, "Among Us jugador muteado");
      cantidad++;
    } catch (error) {
      console.log(`No pude mutear a ${miembro.user.tag}`);
    }
  }
  return cantidad;
}

async function desmutearTodos(canal) {
  let cantidad = 0;
  for (const miembro of canal.members.values()) {
    if (miembro.user.bot) continue;
    try {
      await miembro.voice.setMute(false, "Among Us jugador desmuteado");
      cantidad++;
    } catch (error) {
      console.log(`No pude desmutear a ${miembro.user.tag}`);
    }
  }
  return cantidad;
}

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (!tienePermiso(interaction)) {
    return interaction.reply({
      content: "Necesitas el permiso Moderar miembros.",
      ephemeral: true
    });
  }

  if (interaction.commandName === "start") {
    const canal = obtenerCanal(interaction);
    if (!canal) {
      return interaction.reply({
        content: "Primero entra a un canal de voz.",
        ephemeral: true
      });
    }
    await interaction.deferReply();
    const cantidad = await mutearTodos(canal);
    return interaction.editReply(`PARTIDA INICIADA\n${cantidad} jugadores muteados.`);
  }

  if (interaction.commandName === "meeting") {
    const canal = obtenerCanal(interaction);
    if (!canal) {
      return interaction.reply({
        content: "Primero entra a un canal de voz.",
        ephemeral: true
      });
    }
    await interaction.deferReply();
    const cantidad = await desmutearTodos(canal);
    return interaction.editReply(`REUNIÓN\n${cantidad} jugadores desmuteados.`);
  }

  if (interaction.commandName === "mute") {
    const canal = obtenerCanal(interaction);
    if (!canal) {
      return interaction.reply({
        content: "Primero entra a un canal de voz.",
        ephemeral: true
      });
    }
    await interaction.deferReply();
    const cantidad = await mutearTodos(canal);
    return interaction.editReply(`MUTEADOS\n${cantidad} jugadores.`);
  }

  if (interaction.commandName === "unmute") {
    const canal = obtenerCanal(interaction);
    if (!canal) {
      return interaction.reply({
        content: "Primero entra a un canal de voz.",
        ephemeral: true
      });
    }
    await interaction.deferReply();
    const cantidad = await desmutearTodos(canal);
    return interaction.editReply(`DESMUTEADOS\n${cantidad} jugadores.`);
  }

  if (interaction.commandName === "dead") {
    const jugador = interaction.options.getMember("jugador");
    if (!jugador) {
      return interaction.reply({
        content: "No encontré a ese jugador.",
        ephemeral: true
      });
    }
    try {
      await jugador.voice.setMute(true, "Among Us jugador muerto");
      return interaction.reply(`${jugador.displayName} ha muerto.\nHa sido muteado.`);
    } catch (error) {
      return interaction.reply({
        content: "No pude mutear a ese jugador.",
        ephemeral: true
      });
    }
  }

  if (interaction.commandName === "alive") {
    const jugador = interaction.options.getMember("jugador");
    if (!jugador) {
      return interaction.reply({
        content: "No encontré a ese jugador.",
        ephemeral: true
      });
    }
    try {
      await jugador.voice.setMute(false, "Among Us jugador vivo");
      return interaction.reply(`${jugador.displayName} está vivo.\nHa sido desmuteado.`);
    } catch (error) {
      return interaction.reply({
        content: "No pude desmutear a ese jugador.",
        ephemeral: true
      });
    }
  }

  if (interaction.commandName === "stop") {
    const canal = obtenerCanal(interaction);
    if (!canal) {
      return interaction.reply({
        content: "Primero entra a un canal de voz.",
        ephemeral: true
      });
    }
    await interaction.deferReply();
    const cantidad = await desmutearTodos(canal);
    return interaction.editReply(`PARTIDA TERMINADA\n${cantidad} jugadores desmuteados.`);
  }
});
client.login(process.env.DISCORD_TOKEN);
