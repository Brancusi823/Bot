const { Events } = require("discord.js");
const { google } = require("googleapis");

const pontaj = require("../schemas/pontaj");
const insigne = require("../schemas/insigne");

module.exports = {
  name: 'guildMemberRemove',
  async execute(member, client) {
    const auth = new google.auth.GoogleAuth({
      keyFile: "secrets.json",
      scopes: "https://www.googleapis.com/auth/spreadsheets",
    });

    const authClientObject = await auth.getClient();

    const googleSheetsInstance = google.sheets({
      version: "v4",
      auth: authClientObject,
    });

    const insignaProfile = await insigne.findOne({ userId: member.user.id });

    if (!insignaProfile) return;

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

        if (data[0] === member.user.id) {
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
            range: `Membri Poliție/Pontaje!A${row}:U`,
            valueInputOption: "USER_ENTERED",
            resource: {
              values: [resetArray],
            },
          });

          await insigne.deleteOne({ _id: insignaProfile._id });
          const pontajProfiles = await pontaj.find({ userId: member.user.id });

          pontajProfiles.forEach((prof) => prof.deleteOne());

          break;
        }
      }
    } catch (error) {
      console.error(`[GUILD_MEMBER_REMOVE_ERROR]:\n${error}`);
    }
  },
};
