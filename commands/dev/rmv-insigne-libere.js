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
    .setName("rmv-insigne-libere")
    .setDescription("Developer only"),
  ownerOnly: true,
  async execute(interaction) {
    try {
      const auth = new google.auth.GoogleAuth({
        keyFile: "secrets.json",
        scopes: "https://www.googleapis.com/auth/spreadsheets",
      });

      const authClientObject = await auth.getClient();

      const googleSheetsInstance = google.sheets({
        version: "v4",
        auth: authClientObject,
      });

      let {
        data: { values: sheetData },
      } = await googleSheetsInstance.spreadsheets.values.get({
        auth,
        spreadsheetId: process.env.SHEET_ID,
        range: process.env.SHEET_RANGE,
        dateTimeRenderOption: "FORMATTED_STRING",
        majorDimension: "ROWS",
        valueRenderOption: "FORMATTED_VALUE",
      });

      let insigne = await insigna.find({})

      // E IN DATABASE
      for (let insignaProfile of insigne) {
        const data = sheetData.find(d => d[0] === insignaProfile.userId);
        if (!data) {
          // NU E PE DOCS
          console.log(insignaProfile.userId)
          await insigna.deleteOne({ _id: insignaProfile._id })
        } else {
          if (!interaction.guild.members.cache.get(insignaProfile.userId)) {
            console.log(insignaProfile.userId)
            // NU E PE SERVER
            const row = sheetData.indexOf(data) + 1;

            const resetArray = Array.from({ length: 20 }, () => "");

            if (data[4] === "GENERAL_MAIOR") resetArray[7] = "N/A";

            resetArray[2] = data[2];
            resetArray[4] = data[4];
            data[4] === "GENERAL_MAIOR"
              ? (resetArray[7] = "CONDUCERE")
              : (resetArray[7] = "N/A");
            resetArray[15] = data[15];
            resetArray[16] = data[16];
            resetArray[19] = resetArray[20] = false;

            // remove from last spreadsheet
            googleSheetsInstance.spreadsheets.values.update({
              auth,
              spreadsheetId: process.env.SHEET_ID,
              range: `Membri FIB/Pontaje!A${row}:U`,
              valueInputOption: "USER_ENTERED",
              resource: {
                values: [resetArray],
              },
            });

            await insigna.deleteOne({ _id: insignaProfile._id });
          }
        }
      }
      // E PE DOCS SI DATABASE, NU E PE SERVER
    } catch (error) {
      console.log(error);
    }

    await interaction.reply({ content: 'Done', ephemeral: true })
  },
};
