require("dotenv").config();
const { Client, Collection, GatewayIntentBits, Partials } = require("discord.js");
const cargarComandos = require("./src/loaders/cargarComandos");
const interactionCreate = require("./src/handlers/interactionCreate");
const messageCreate = require("./src/handlers/messageCreate");

process.on("unhandledRejection", (error) => console.error("Promesa no controlada:", error));
process.on("uncaughtException", (error) => console.error("Excepción no controlada:", error));

if (!process.env.DISCORD_TOKEN) {
  throw new Error("Falta DISCORD_TOKEN. Crea el archivo .env a partir de .env.example.");
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel, Partials.Message]
});

client.commands = new Collection();
const comandos = cargarComandos(client);

client.once("ready", async () => {
  console.log(`Bot conectado como ${client.user.tag}`);
  try {
    await client.application.commands.set(comandos.map(({ data }) => data));
    console.log("Comandos registrados correctamente.");
  } catch (error) {
    console.error("No se pudieron registrar los comandos:", error);
  }
});

client.on("interactionCreate", interactionCreate);
client.on("messageCreate", messageCreate);
client.login(process.env.DISCORD_TOKEN);
