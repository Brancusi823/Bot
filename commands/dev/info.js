const {
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  EmbedBuilder,
} = require("discord.js");

const { google } = require("googleapis");
const mongoose = require('mongoose');

const insigna = require('../../schemas/insigne.js')

module.exports = {
  data: new SlashCommandBuilder()
    .setName("info")
    .setDescription("Info")
    .addUserOption((option) => option.setName("user").setDescription("user").setRequired(true)),
  ownerOnly: true,
  async execute(interaction) {
    try {
      const user = interaction.options.getMember("user")
      let insigne = await insigna.findOne({ userId: user.id })

      if (!insigne) await interaction.reply({ content: 'User not in database' })

      const embed = new EmbedBuilder().setTitle(`Info about ${user}`).setDescription(`${insigne.toString()}`).setColor("Blue")

      await interaction.reply({ embeds: [embed] })
    } catch (error) {
      console.log(error);
    }
  },
};
