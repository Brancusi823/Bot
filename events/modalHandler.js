const { Events } = require("discord.js");
const grade = require("../utils/grade.json");
const gradeDiicot = require('../utils/grade-dir.json')
const { google } = require("googleapis");

const insigne = require("../schemas/insigne");
const procesare = require("../schemas/procesare.js");
const { default: mongoose } = require("mongoose");

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

const DaysInfo = [
  { DayCount: 0, Arg: 10, Column: "K" }, // duminica
  { DayCount: 1, Arg: 11, Column: "L" }, // luni
  { DayCount: 2, Arg: 12, Column: "M" }, // marti
  { DayCount: 3, Arg: 13, Column: "N" }, // miercuri
  { DayCount: 4, Arg: 14, Column: "O" }, // joi
  { DayCount: 5, Arg: 8, Column: "I" }, // vineri
  { DayCount: 6, Arg: 9, Column: "J" }, // sambata
];

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    if (!interaction.isModalSubmit()) return;

    if (interaction.customId === "insignaModal") {
      const numeInput = interaction.fields.getTextInputValue("numeInput");
      const idInput = interaction.fields.getTextInputValue("idInput");

      let userRank;
      interaction.member.roles.cache.some((role) => {
        if (Object.values(grade).includes(role.id)) {
          userRank = role;
          return true;
        }
        return false;
      });

      if (userRank) {
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
            valueRenderOption: "FORMATTED_VALUE",
          });

          for (const grad in grade) {
            if (userRank.id === grade[grad]) {
              userRank = grad;
              break;
            }
          }

          let LOOP_STATUS = false;
          let paza = false;

          // if (userRank === "AGENT-PAZA") {
          //   const newData = await googleSheetsInstance.spreadsheets.values.get({
          //     auth,
          //     spreadsheetId: process.env.SHEET_ID,
          //     range: process.env.SHEET_PAZA_RANGE,
          //     dateTimeRenderOption: "FORMATTED_STRING",
          //     majorDimension: "ROWS",
          //     valueRenderOption: "FORMATTED_VALUE",
          //   })
          //   sheetData = newData.data.values
          //   paza = true;
          // };

          for (const data of sheetData) {
            if (data.includes("nil") || data.length === 0) continue;

            if (data[4] === userRank) {
              if (!data[0] && !data[1] && !data[3]) {
                const row = sheetData.indexOf(data) + 1;

                let isDiicot = 'N/A';
                if (interaction.member.roles.cache.has(process.env.DISCORD_DIICOT_ROLE)) isDiicot = 'DIICOT';

                const date = new Date();

                data[0] = interaction.user.id;
                data[1] = idInput;
                data[3] = numeInput;
                data[5] = data[6] = formatDate();
                data[7] = isDiicot;

                for (let i = 8; i <= 14; i++) {
                  const find = DaysInfo.find((day) => day.Arg === i)
                  if (find.DayCount === date.getDay()) break;
                  data[i] = '0';
                }

                if (userRank === 'AGENT-PAZA') {
                  // googleSheetsInstance.spreadsheets.values.append({
                  //   auth,
                  //   spreadsheetId: process.env.SHEET_ID,
                  //   range: `Sectie Politie Pontaje!A${row}`,
                  //   valueInputOption: "USER_ENTERED",
                  //   resource: {
                  //     values: [data],
                  //   },
                  // });
                } else {
                  googleSheetsInstance.spreadsheets.values.append({
                    auth,
                    spreadsheetId: process.env.SHEET_ID,
                    range: `Membri Poliție/Pontaje!A${row}`,
                    valueInputOption: "USER_ENTERED",
                    resource: {
                      values: [data],
                    },
                  });
                }
                await interaction.reply({
                  content: `**CALLSIGN SCHIMBAT**\nNoul tau callsign este [${data[2]}]`,
                });

                const insignaProfile = new insigne({
                  _id: new mongoose.Types.ObjectId(),
                  userId: interaction.user.id,
                  fivemId: idInput,
                  nrInsigna: data[2],
                  rank: data[4],
                });
                await insignaProfile.save().catch(console.error);

                try {
                  await interaction.member.setNickname(
                    `[${data[2]}] ${numeInput} ${idInput}`
                  );
                } catch (error) {
                  console.error();
                }

                LOOP_STATUS = true;
                break;
              } else {
                continue;
              }
            }
          }

          if (!LOOP_STATUS) {
            await interaction.reply({
              content: `Nu mai sunt locuri disponibile pentru gradul de ${userRank} !`,
              ephemeral: true,
            });
            return;
          }
        } catch (error) {
          console.log(`[CERERE_INSIGNA_ERROR]:\n${error}`);
        }
      } else {
        await interaction.reply({
          content: `Nu ti-a fost gasit gradul de politie rutiera!`,
          ephemeral: true,
        });
        return;
      }
    }

    if (interaction.customId === "insignaDiicotModal") {
      const numeInput = interaction.fields.getTextInputValue("numeInput");
      const idInput = interaction.fields.getTextInputValue("idInput");

      let userRank;
      interaction.member.roles.cache.some((role) => {
        if (Object.values(gradeDiicot).includes(role.id)) {
          userRank = role;
          return true;
        }
        return false;
      });

      if (userRank) {
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
            spreadsheetId: process.env.SHEET_DIICOT_ID,
            range: process.env.SHEET_DIICOT_RANGE,
            dateTimeRenderOption: "FORMATTED_STRING",
            majorDimension: "ROWS",
            valueRenderOption: "FORMATTED_VALUE",
          });

          for (const grad in gradeDiicot) {
            if (userRank.id === gradeDiicot[grad]) {
              userRank = grad;
              break;
            }
          }

          let LOOP_STATUS = false;

          for (const data of sheetData) {
            if (data.includes("nil") || data.length === 0) continue;

            // console.log(data[4], userRank);
            if (data[4] === userRank) {
              if (!data[1] && !data[3]) {
                const row = sheetData.indexOf(data)+8;

                data[1] = idInput
                data[3] = numeInput
                data[6] = interaction.user.id

                googleSheetsInstance.spreadsheets.values.update({
                  auth,
                  spreadsheetId: process.env.SHEET_DIICOT_ID,
                  range: `D.I.I.C.O.T!B${row}:H`,
                  valueInputOption: "USER_ENTERED",
                  resource: {
                    values: [data],
                  },
                });
                await interaction.reply({
                  content: `**CALLSIGN SCHIMBAT**\nNoul tau callsign este [${data[2]}]\n\nIti pui [ Insigna DIICOT ] [ Insigna Politie ] Nume + Id`,
                });

                const insignaProfile = await insigne.findOne({ userId: interaction.user.id })

                insignaProfile.nrInsignaDiicot = data[2];
                await insignaProfile.save().catch(console.error)

                LOOP_STATUS = true;
                break;
              } else {
                continue;
              }
            }
          }

          if (!LOOP_STATUS) {
            await interaction.reply({
              content: `Nu mai sunt locuri disponibile pentru gradul de ${userRank} !`,
              ephemeral: true,
            });
            return;
          }
        } catch (error) {
          console.log(`[CERERE_INSIGNA_DIICOT_ERROR]:\n${error}`);
        }
      }
    }

    if (interaction.customId === "procesareModal") {
      const procesareInput = interaction.fields.getTextInputValue("procesareInput");

      const insigneProfile = await insigne.findOne({
        userId: interaction.user.id,
      });
      
      let procesareProfile = await procesare.findOne({
        "userInfo.messageId": interaction.message.id,
      });
      if (!procesareProfile)
        return await interaction.editReply({
          content: "Eroare! Nu am gasit procesarea in baza de date",
          ephemeral: true,
        });

      interaction.message.embeds[0].fields[3].value = procesareInput;

      await interaction.message.edit({
        embeds: [interaction.message.embeds[0]],
      });

      procesareProfile.raport = procesareInput;

      await procesareProfile.save().catch(console.error);

      await interaction.reply({ content: 'Raport adaugat cu succes!', ephemeral: true });
      
    }
  },
};
