const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { google } = require("googleapis");

const mongoose = require("mongoose");
const pontaj = require("../../schemas/pontaj");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("incheie-saptamana")
    .setDescription("Incheie saptamana de pontaje si trece-le pe docs"),
  conducere: true,
  async execute(interaction) {
    if (interaction.channel.id !== process.env.DISCORD_PONTAJ_CHANNEL)
      return await interaction.reply({
        content: `Poti folosi aceasta comanda doar in <#${process.env.DISCORD_PONTAJ_CHANNEL}>`,
        ephemeral: true,
      });

    const auth = new google.auth.GoogleAuth({
      keyFile: "secrets.json",
      scopes: "https://www.googleapis.com/auth/spreadsheets",
    });

    const authClientObject = await auth.getClient();

    const googleSheetsInstance = google.sheets({
      version: "v4",
      auth: authClientObject,
    });

    try {
      let {
        data: { values: sheetData },
      } = await googleSheetsInstance.spreadsheets.values.get({
        auth,
        spreadsheetId: process.env.SHEET_ID,
        range: process.env.SHEET_RANGE,
        dateTimeRenderOption: "FORMATTED_STRING",
        majorDimension: "ROWS",
        valueRenderOption: "FORMULA",
      });

      let {
        data: { values: sheet2 },
      } = await googleSheetsInstance.spreadsheets.values.get({
        auth,
        spreadsheetId: process.env.SHEET_ID,
        range: process.env.SHEET_RANGE,
        dateTimeRenderOption: "FORMATTED_STRING",
        majorDimension: "ROWS",
        valueRenderOption: "FORMATTED_VALUE",
      });

      for (let data of sheetData) {
        if (data.includes("nil") || data.length === 0) continue;

        if (data[0]) {
          const row = sheetData.indexOf(data) + 1;

          data[18] = data[17];
          sheet2[row-1][16]==="#DIV/0!" ? data[17] = '0' : data[17] = `${sheet2[row-1][16]}`
        }
      }

      googleSheetsInstance.spreadsheets.values.update({
            auth,
            spreadsheetId: process.env.SHEET_ID,
            range: process.env.SHEET_RANGE,
            valueInputOption: "USER_ENTERED",
            resource: {
              values: sheetData,
            },
          });

      await interaction.reply({
        content: "Saptamana de pontaje a fost incheiata cu succes!",
        ephemeral: true,
      });
    } catch (error) {
      console.log(`[INCHEIE_SAPTAMANA_ERROR]:\n${error}`);
    }
  },
};
