const fs = require('fs');
const path = require("path");
const { Client, Collection, GatewayIntentBits } = require("discord.js");
const keep_alive = require("./keep_alive.js')

const process = require('process');

process.on('unhandledRejection', (reason, promise) => console.log('Unhandled rejection at: ', promise, 'reason:', reason));
process.on('uncaughtException', (error) => console.log('Uncaught exception: ', error));
process.on('uncaughtExceptionMonitor', (err, origin) => console.log('Uncaught Exception Monitor ', err, origin));

const client = new Client({
  intents: Object.values(GatewayIntentBits)
});

client.commands = new Collection();
const commandsPath = path.join(__dirname, "src/commands");
const commandFolders = fs.readdirSync(commandsPath);

for (const folder of commandFolders) {
  const folderPath = path.join(commandsPath, folder);
  const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith(".js"));

  for (const file of commandFiles) {
    const filePath = path.join(folderPath, file);
    const command = require(filePath);

    if ("data" in command && "execute" in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.warn('[WARNING] The command at ${ filePath } is missing a required "data" or "execute" property.');
    }
  }
}

const eventsPath = path.join(__dirname, "src/events");
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith(".js"));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);

  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
}

require("./src/deploy-commands").execute();

client.login(process.env.DISCORD_TOKEN);
