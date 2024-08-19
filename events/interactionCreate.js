const {
  Events,
  EmbedBuilder,
  CommandInteraction,
  EmbedType,
  PermissionFlagsBits,
} = require("discord.js");
const logger = require("../helpers/logMessages");
const datafile = require("../utils/data")

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
      console.error(
        `No command matching ${interaction.commandName} was found.`
      );
      return;
    }

    try {

      if (datafile.important.inDevelopment && interaction.user.id !== process.env.DISCORD_OWNER) return await interaction.reply({
          content: `Nu poti folosi aceasta comanda deocamdata`,
          ephemeral: true,
        });
      
      if (
        command.ownerOnly &&
        (interaction.user.id !== process.env.DISCORD_OWNER)
      )
        return await interaction.reply({
          content: `Nu ai permisiune sa folosesti aceasta comanda! [DEV ONLY]`,
          ephemeral: true,
        });

      if (
        command.conducere &&
        !interaction.member.roles.cache.has(
          process.env.DISCORD_CONDUCERE_ROLE
        ) &&
        !interaction.member.permissions.has(PermissionFlagsBits.Administrator)
      )
        return await interaction.reply({
          content: `Nu ai permisiune sa folosesti aceasta comanda!`,
          ephemeral: true,
        });

      await command.execute(interaction, client);
      
      logger.executed(interaction, client);
      
    } catch (error) {
      console.error(error);
      logger.error(interaction, client, error);

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: "There was an error while executing this command!",
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: 'There was an error while executing this command!',
          ephemeral: true,
        });
      }
    }
  },
};