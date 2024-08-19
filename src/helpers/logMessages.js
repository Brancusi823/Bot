const { Client, CommandInteraction, EmbedBuilder } = require("discord.js");
const Data = require("../utils/data");
const warningLink =
  "https://cdn.discordapp.com/attachments/855121905128439808/1172588478123483167/image-removebg-preview.png?ex=6560dd1e&is=654e681e&hm=08673d8d4b5c542f148bdfbae986c03a5bb39fa6a11b3bda4dd3205aa28eb8b5&";

/**
 *
 * @param {CommandInteraction} interaction
 * @param {Client} client
 */

async function logError(interaction, client, err) {
  const channel = client.channels.cache.get(Data.discord.channels.logs);
  const user = client.users.cache.get(Data.important.seb);

  const embed = new EmbedBuilder()
    .setTitle(`Console Error`)
    .setColor("Red")
    .setThumbnail(warningLink)
    .setDescription(err.message)
    .addFields([
      {
        name: "Command",
        value: `${interaction.commandName}`,
        inline: true,
      },
      {
        name: "Triggered By",
        value: `${interaction.member}`,
        inline: true,
      },
    ]);
  await channel.send({ embeds: [embed], content: `<@539127161467174944>` });
}

/**
 *
 * @param {CommandInteraction} interaction
 * @param {Client} client
 */
async function logExecuted(interaction, client) {
  const channel = client.channels.cache.get(Data.discord.channels.logs);

  const embed = new EmbedBuilder()
    .setTitle(`Comanda Utilizata`)
    .setColor("DarkBlue")
    .addFields([
      {
        name: "Command",
        value: `${interaction.commandName}`,
        inline: true,
      },
      {
        name: "Channel",
        value: `${interaction.channel}`,
        inline: true,
      },
      {
        name: "Triggered By",
        value: `${interaction.member} (\`${interaction.user.tag}\`)`,
        inline: false,
      },
      {
        name: `Options`,
        value: `${
          interaction.options.data.length >= 1
            ? interaction.options.data
                .map(
                  (optionData) =>
                    `\`Name:\` ${optionData.name} | \`Value:\` ${
                      optionData.user ||
                      optionData.role ||
                      optionData.message ||
                      optionData.member ||
                      optionData.channel ||
                      optionData.value
                    }`
                )
                .join("\n")
            : "None"
        }`,
        inline: false,
      },
    ])
    .setTimestamp();
  await channel.send({ embeds: [embed] });
}

module.exports.error = logError;
module.exports.executed = logExecuted;
