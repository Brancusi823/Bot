const { Events } = require("discord.js");
const { MongoClient } = require("mongodb");
const mongoose = require("mongoose");

module.exports = {
  name: 'ready',
  once: true,
  execute(client) {
    console.log(`[DISCORD] Logged in as ${client.user.tag}`);

    client.user.setPresence({ activities: [{ name: 'KRONOS România' }], status: 'dnd' });
    
    async function main() {
      await mongoose
        .connect(process.env.MONGO_CONN_STRING)
        .catch(console.error())
        .then(() => console.log("[DATABASE] Connected."));
    }
    main();
  },
};
