const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { google } = require("googleapis");

const grade = require("../../utils/grade.json");

const mongoose = require("mongoose");
const pontaj = require("../../schemas/pontaj");
const insigne = require("../../schemas/insigne");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("scoate-membru")
    .setDescription("Scoate un membru")
    .addUserOption((option) => option.setName("membru").setDescription("Alege membrul pe care vrei sa-l scoti").setRequired(true)),
  conducere: true,
  async execute(interaction, client) {
    let membruScos = interaction.options.getMember('membru');

    await interaction.deferReply();
    
    if (!membruScos)
      return await interaction.editReply({
        content: "Nu am gasit membrul!",
        ephemeral: true,
      });

    if (membruScos.user.bot)
      return await interaction.editReply({
        content: "Nu poti scoate un bot..",
        ephemeral: true,
      });

    // if (membruScos === interaction.member)
    //   return await interaction.editReply({
    //     content: "Nu te poti scoate singur..",
    //     ephemeral: true,
    //   });

    const insignaProfile = await insigne.findOne({
      userId: membruScos.user.id,
    });

    console.log(insignaProfile)

    if (!insignaProfile)
      return await interaction.editReply({
        content: "Acest membru nu este trecut pe docs!",
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

      for (let data of sheetData) {
        if (data.includes("nil") || data.length === 0) continue;

        if (data[0] === membruScos.user.id) {
          const row = sheetData.indexOf(data) + 1;

          const resetArray = Array.from({ length: 20 }, () => "");

          if (data[4] === "GENERAL_MAIOR") resetArray[7] = "N/A";

          resetArray[2] = data[2];
          resetArray[4] = data[4];
          data[4] === "GENERAL_Maior"
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

          await insigne.deleteOne({ _id: insignaProfile._id });
          const pontajProfiles = await pontaj.find({
            userId: membruScos.user.id,
          });

          pontajProfiles.forEach((prof) => prof.deleteOne());

          await interaction.editReply({
            content: "Membru scos cu succes!",
            ephemeral: true,
          });

          break;
        }
        else
        {
          await insigne.deleteOne({ _id: insignaProfile._id });
          const pontajProfiles = await pontaj.find({
            userId: membruScos.user.id,
          });

          pontajProfiles.forEach((prof) => prof.deleteOne());

          await interaction.editReply({
            content: "Membru scos cu succes!",
            ephemeral: true,
          });
        }
      }
    } catch (error) {
      console.log(`[SCOATE_MEMBRU_ERROR]:\n${error}`);
    }
  },
};
