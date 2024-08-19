const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder().setName("uptime").setDescription("Vezi de cat timp este on botul de la ultimul reset"),
  async execute(interaction, client) {
    let totalSeconds = (client.uptime / 1000);
let days = Math.floor(totalSeconds / 86400);
totalSeconds %= 86400;
let hours = Math.floor(totalSeconds / 3600);
totalSeconds %= 3600;
let minutes = Math.floor(totalSeconds / 60);
let seconds = Math.floor(totalSeconds % 60);
    await interaction.reply(`${days}d, ${hours}h, ${minutes}m and ${seconds}s`);
  },
};
