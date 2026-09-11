const {
  Client,
  GatewayIntentBits,
  PermissionFlagsBits,
  SlashCommandBuilder
} = require("discord.js");
require("dotenv").config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMembers
  ]
});

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