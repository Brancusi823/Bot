const {
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  EmbedBuilder,
} = require("discord.js");

const { google } = require("googleapis");

const mongoose = require("mongoose");
const pontaj = require("../../schemas/pontaj");
const concediu = require('../../schemas/concediu');

const DaysInfo = [
  { DayCount: 0, Arg: 10, Column: "K" }, // duminica
  { DayCount: 1, Arg: 11, Column: "L" }, // luni
  { DayCount: 2, Arg: 12, Column: "M" }, // marti
  { DayCount: 3, Arg: 13, Column: "N" }, // miercuri
  { DayCount: 4, Arg: 14, Column: "O" }, // joi
  { DayCount: 5, Arg: 8, Column: "I" }, // vineri
  { DayCount: 6, Arg: 9, Column: "J" }, // sambata
];

Date.prototype.addHours = function(h) {
  this.setTime(this.getTime() + (h*60*60*1000));
  return this;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("calculeaza-pontajele")
    .setDescription("Calculeaza pontajele pe toata ziua")
    .addNumberOption((option) => option.setName('zi').setDescription('Alege ziua').setRequired(true).setMaxValue(31).setMinValue(1)),
  conducere: true,
  async execute(interaction) {
    if (interaction.channel.id !== process.env.DISCORD_PONTAJ_CHANNEL)
      return await interaction.reply({
        content: `Poti folosi aceasta comanda doar in <#${process.env.DISCORD_PONTAJ_CHANNEL}>`,
        ephemeral: true,
      });

    const date = new Date();
    const day = interaction.options.getNumber('zi');
    date.addHours(3);
    date.setDate(day);
    
    const dayInfo = DaysInfo.find((inf) => {
      return inf.DayCount === date.getDay();
    });

    await interaction.deferReply({ ephemeral: true });

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

        if (data[0]) {
          let pontajProfiles = await pontaj.find({
            userId: data[0],
            estePontajDeschis: false,
            estePontajAnulat: false,
          });

          let newProfiles = []

          pontajProfiles.forEach((profile) => {
            if (profile.pontajDeschisLa.getDate() === date.getDate()) {
              newProfiles.push(profile)
            }
          })

          // are concediu
          let concediuProfile = await concediu.findOne({ userId: data[0] })
          if (concediuProfile && (date < concediuProfile.concediu.end)) {
            data[dayInfo.Arg] = 'CO'
          } else {
            // CASE 1, NU ARE NICIUN PONTAJ TOATA ZIUA
            if (!newProfiles) {
              data[dayInfo.Arg] = "0";
              data.splice(dayInfo.Arg + 1);
              return;
            } else {
              // CASE 2, ARE PONTAJ/E DESCHISE TOATA ZIUA
              let minutes = 0;
              newProfiles.forEach((profile) => {
                minutes += profile.totalMinute
              })

              data[dayInfo.Arg] = minutes;
              data.splice(dayInfo.Arg + 1);
            }
          }
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

      const yyyy = date.getFullYear();
      let mm = date.getMonth() + 1;
      let dd = date.getDate();

      if (dd < 10) dd = "0" + dd;
      if (mm < 10) mm = "0" + mm;

      const formattedToday = dd + "/" + mm + "/" + yyyy;

      await interaction.guild.channels.cache.get(process.env.DISCORD_TAGPONTAJE_CHANNEL).send({
        content: `<@&${process.env.DISCORD_MAI_ROLE}> Pontajele din data de ${formattedToday} au fost calculate si trecute pe DOCS. Au fost trecute pontajele doar celor ce au o insigna valida !!\n\n\nCei care ati primit ❗ la pontaj data viitoare nu se mai calculeaza !!!\nCei care ati primit ❌ la pontaj nu vi s-au calculat minutele !!!\n\n**DACA INTAMPINATI GRESELI/PROBLEME CU NUME/INSIGNA/DISCORD etc. FACETI UN TICKET SI O SA VA RASPUNDA CINEVA DIN CONDUCERE**\n\nhttps://docs.google.com/spreadsheets/d/1TNsXnZv_LoUljAs4kp1tmeKenecKRYvq5SYbZ4QVIdY/edit?gid=1237459569#gid=1237459569`,
      });

      await interaction.editReply({
        content: "Pontaje calculate cu succes!",
        ephemeral: true,
      });
    } catch (error) {
      console.log(`[CALCULEAZA_PONTAJE_ERROR]:\n${error}`);
    }
  },
};
