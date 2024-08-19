const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { google } = require("googleapis");

const grade = require("../../utils/grade.json");

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
    .setName("promoveaza-membru")
    .setDescription("Promoveaza membru")
    .addUserOption((option) =>
      option
        .setName("membru")
        .setDescription("Alege membrul pe care vrei sa-l promovezi")
        .setRequired(true)
    ),
  conducere: true,
  async execute(interaction) {
    const membruPromovat = interaction.options.getMember("membru");

    await interaction.deferReply({ ephemeral: true })

    if (membruPromovat.user.bot)
      return await interaction.editReply({
        content: "Nu poti promova un bot..",
        ephemeral: true,
      });

    if (membruPromovat === interaction.member)
      return await interaction.editReply({
        content: "Nu te poti promova singur..",
        ephemeral: true,
      });

    const insignaProfile = await insigne.findOne({
      userId: membruPromovat.user.id,
    });

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

      let userRank;
      function gasesteUrmGrad(object, value) {
        const found = Object.keys(object).find((key) => object[key] === value);
        return Object.keys(object)[Object.keys(object).indexOf(found) + 1];
      }

      membruPromovat.roles.cache.some((role) => {
        if (Object.values(grade).includes(role.id)) {
          userRank = role;
          return true;
        }
        return false;
      });

      if (!userRank)
        return await interaction.editReply({
          content: "Acest membru nu are niciun grad legat de politie!",
          ephemeral: true,
        });

      const urmGrad = gasesteUrmGrad(grade, userRank.id);

      // let { data: { values: pazaSheetData } } = await googleSheetsInstance.spreadsheets.values.get({
      //   auth,
      //   spreadsheetId: process.env.SHEET_ID,
      //   range: process.env.SHEET_PAZA_RANGE,
      //   dateTimeRenderOption: "FORMATTED_STRING",
      //   majorDimension: "ROWS",
      //   valueRenderOption: "FORMATTED_VALUE",
      // })

      for (let data of sheetData) {
        if (data.includes("nil") || data.length === 0) continue;

        if (!data[0] && !data[1] && !data[3] && data[4] === urmGrad) {
          const row = sheetData.indexOf(data) + 1;

          let prevData = sheetData.find(
            (subData) => subData[0] === membruPromovat.user.id
          );
          let prevRow = sheetData.indexOf(prevData) + 1;

          if (urmGrad === "CADET") {
            // UP AGENT-PAZA ->>> CADET
            prevData = pazaSheetData.find((subData) => subData[0] === membruPromovat.user.id)
            prevRow = pazaSheetData.indexOf(prevData) + 1;
          }

          data[0] = prevData[0];
          data[1] = prevData[1];
          data[3] = prevData[3];
          data[5] = formatDate();
          data[6] = prevData[6];

          if (prevData[7] !== "CONDUCERE") data[7] = prevData[7];

          for (let i = 8; i <= 14; i++) {
            data[i] = prevData[i];
          }
          for (let i = 17; i <= 20; i++) {
            data[i] = prevData[i];
          }

          // update new
          googleSheetsInstance.spreadsheets.values.update({
            auth,
            spreadsheetId: process.env.SHEET_ID,
            range: `Membri FIB/Pontaje!A${row}:U`,
            valueInputOption: "USER_ENTERED",
            resource: {
              values: [data],
            },
          });

          const resetArray = Array.from({ length: 20 }, () => "");

          resetArray[2] = prevData[2];
          resetArray[4] = prevData[4];
          resetArray[7] = 'N/A';
          resetArray[15] = prevData[15];
          resetArray[16] = prevData[16];
          resetArray[19] = resetArray[20] = false;

          // remove from last spreadsheet
          if (urmGrad === "CADET") {
            // // UP AGENT-PAZA ->>>> CADET
            // googleSheetsInstance.spreadsheets.values.update({
            //   auth,
            //   spreadsheetId: process.env.SHEET_ID,
            //   range: `Sectie Politie Pontaje!A${prevRow}:U`,
            //   valueInputOption: "USER_ENTERED",
            //   resource: {
            //     values: [resetArray],
            //   },
            // });
          } else {
            googleSheetsInstance.spreadsheets.values.update({
            auth,
            spreadsheetId: process.env.SHEET_ID,
            range: `Membri FIB/Pontaje!A${prevRow}:U`,
            valueInputOption: "USER_ENTERED",
            resource: {
              values: [resetArray],
            },
          });
          }

          await insigne.updateOne(
            { _id: insignaProfile._id },
            { nrInsigna: data[2], rank: urmGrad }
          );

          await membruPromovat.roles.remove(userRank.id);
          await membruPromovat.roles.add(grade[urmGrad]);

          try {
            await membruPromovat.setNickname(
              `[${data[2]}] ${data[3]} ${data[1]}`
            );
          } catch (error) {
            console.error();
          }

          break;
        }
      }

      await interaction.editReply({ content: 'Membru promovat cu succes!', ephemeral: true })

      const message = await interaction.channel.send({
        embeds: [
          new EmbedBuilder()
            .setTitle(`Membru Promovat`)
            .setColor("DarkBlue")
            .setDescription(
              `${membruPromovat} a fost **PROMOVAT** de ${interaction.member} la gradul de <@&${grade[urmGrad]}>`
            )
            .setTimestamp(),
        ],

        content: `${membruPromovat}`,
      });
    } catch (error) {
      console.log(`[PROMOVEAZA_MEMBRU_ERROR]:\n${error}`);
    }
  },
};
