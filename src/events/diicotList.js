const { Events, EmbedBuilder } = require("discord.js");
const { MongoClient } = require("mongodb");
const mongoose = require("mongoose");

const grade = require('../utils/grade-dir.json');

module.exports = {
  name: 'ready',
  once: true,
  execute(client) {
    // setInterval(async function () {
    //   let guild = client.guilds.cache.get(process.env.DISCORD_GUILD_ID);
    //   let msg = await client.channels.cache
    //     .get('1082525314833457173')
    //     .messages.fetch('1142803974504853514');
    //   const List = new EmbedBuilder()
    //     .setColor(`DarkBlue`)
    //     .setTitle("Contact Information")
    //     .setDescription("\n")
    //     .setThumbnail(guild.iconURL({ dynamic: true }))
    //     .setTimestamp();
    //   Object.keys(grade).forEach((grad) => {
    //     List.addFields({
    //       name: `${grad}:`,
    //       value: `${
    //         client.guilds.cache
    //           .get(process.env.DISCORD_GUILD_ID)
    //           .roles.cache.find((r) => r.id == grade[grad])
    //           .members.map((m) => `${m.user} `)
    //           .join("") || "⠀"
    //       }`,
    //       inline: false,
    //     });
    //   });
    //   msg.edit({ embeds: [List], content: " " });
    // }, 5 * 1000);
  },
};
