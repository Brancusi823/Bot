const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { google } = require("googleapis");

const grade = require("../../utils/grade-dir.json");

const mongoose = require("mongoose");
const pontaj = require("../../schemas/pontaj");
const insigne = require("../../schemas/insigne");

function formatDate() {
  const today = new Date();
  const yyyy = today.getFullYear();
  let mm = today.getMonth() + 1;
  let dd = today.getDate();

  if (dd < 10) dd = "0" + dd;
  if (mm < 10) mm = "0" + mm;

  const formattedToday = dd + "/" + mm + "/" + yyyy;

  return formattedToday;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("retrogradeaza-membru-dir")
    .setDescription("Retrogradeaza membru DIR")
    .addUserOption((option) =>
      option
        .setName("membru")
        .setDescription("Alege membrul pe care vrei sa-l retrogradezi")
        .setRequired(true)
    ),
  conducere: true,
  async execute(interaction) {
    const membruRetrogradat = interaction.options.getMember("membru");

    await interaction.deferReply({ ephemeral: true })
    
    if (membruRetrogradat.user.bot)
      return await interaction.editReply({
        content: "Nu poti retrograda un bot..",
        ephemeral: true,
      });

    if (membruRetrogradat === interaction.member)
      return await interaction.editReply({
        content: "Nu te poti retrograda singur..",
        ephemeral: true,
      });

    const insignaProfile = await insigne.findOne({
      userId: membruRetrogradat.user.id,
    });

    if (!insignaProfile)
      return await interaction.editReply({
        content: "Acest membru nu este trecut pe docs!",
        ephemeral: true,
      });
    if (!insignaProfile.nrInsignaDIR)
      return await interaction.editReply({
        content: "Acest membru nu are insigna de DIR!",
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
        spreadsheetId: process.env.SHEET_DIR_ID,
        range: process.env.SHEET_DIR_RANGE,
        dateTimeRenderOption: "FORMATTED_STRING",
        majorDimension: "ROWS",
        valueRenderOption: "FORMULA",
      });

      let userRank;
      function gasesteUrmGrad(object, value) {
        const found = Object.keys(object).find((key) => object[key] === value);
        return Object.keys(object)[Object.keys(object).indexOf(found) - 1];
      }

      membruRetrogradat.roles.cache.some((role) => {
        if (Object.values(grade).includes(role.id)) {
          userRank = role;
          return true;
        }
        return false;
      });

      if (!userRank)
        return await interaction.editReply({
          content: "Acest membru nu are niciun grad legat de DIR!",
          ephemeral: true,
        });

      const urmGrad = gasesteUrmGrad(grade, userRank.id);

      for (let data of sheetData) {
        if (data.includes("nil") || data.length === 0) continue;

        if (!data[1] && !data[3] && data[4] === urmGrad) {
          const row = sheetData.indexOf(data) + 21;

          const prevData = sheetData.find(
            (subData) => subData[6] === membruRetrogradat.user.id
          );

          const prevRow = sheetData.indexOf(prevData) + 21;

          data[1] = prevData[1];
          data[3] = prevData[3];
          data[5] = prevData[5];
          data[6] = prevData[6];

          // update new
          googleSheetsInstance.spreadsheets.values.update({
            auth,
            spreadsheetId: process.env.SHEET_DIR_ID,
            range: `D.I.R!B${row}:H`,
            valueInputOption: "USER_ENTERED",
            resource: {
              values: [data],
            },
          });

          const resetArray = Array.from({ length: 7 }, () => "");

          resetArray[0] = prevData[0];
          resetArray[2] = prevData[2];
          resetArray[4] = prevData[4];
          resetArray[5] = '0';
          resetArray[6] = '';

          // remove from last spreadsheet
          googleSheetsInstance.spreadsheets.values.update({
            auth,
            spreadsheetId: process.env.SHEET_DIR_ID,
            range: `D.I.R!B${prevRow}:H`,
            valueInputOption: "USER_ENTERED",
            resource: {
              values: [resetArray],
            },
          });

          insignaProfile.nrInsignaDIR = data[2];
          await insignaProfile.save()

          await membruRetrogradat.roles.remove(userRank.id);
          await membruRetrogradat.roles.add(grade[urmGrad]);

          break;
        }
      }
      
      await interaction.editReply({ content: 'Membru retrogradat cu succes!', ephemeral: true })
      
      const message = await interaction.channel.send({
        embeds: [
          new EmbedBuilder()
            .setTitle(`Membru Retrogradat`)
            .setColor("DarkBlue")
            .setDescription(
              `${membruRetrogradat} a fost **RETROGRADAT** de ${interaction.member} la gradul de <@&${grade[urmGrad]}>`
            )
            .setTimestamp(),
        ],

        content: `${membruRetrogradat} Noul tau callsign este **${insignaProfile.nrInsignaDIR}**`,
      });
    } catch (error) {
      console.log(`[RETROGRADEAZA_MEMBRU_DIR_ERROR]:\n${error}`);
    }
  },
};
