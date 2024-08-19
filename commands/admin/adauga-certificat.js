const {
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  EmbedBuilder,
} = require("discord.js");

const { google } = require("googleapis");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("adauga-certificat")
    .setDescription("Adauga certificat")
    .addStringOption((option) =>
      option
        .setName("certificat")
        .setDescription("Alege certificatul pe care vrei sa-l dai")
        .setRequired(true)
        .addChoices(
          { name: "Certificat HS", value: "certificat_hs" },
          { name: "Certificat SNIPER", value: "certificat_sniper" },
          { name: "Certificat HELI", value: "certificat_heli" },
        )
    )
    .addUserOption((option) => option.setName("membru").setDescription("Alege membrul").setRequired(true)),
  conducere: true,
  async execute(interaction, client) {
    const membru = interaction.options.getMember('membru');
    const certificat = interaction.options.getString('certificat')

    if (interaction.channel.id !== process.env.DISCORD_CERTIFICAT_CHANNEL)
      return await interaction.reply({
        content: `Poti folosi aceasta comanda doar in <#${process.env.DISCORD_CERTIFICAT_CHANNEL}>`,
        ephemeral: true,
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
        valueRenderOption: "FORMATTED_VALUE",
      });

      for (let data of sheetData) {
        if (data.includes("nil") || data.length === 0) continue;
        
        if (data[0] === membru.user.id) {
          const row = sheetData.indexOf(data) + 1;

          switch(certificat) {
            case 'certificat_heli': {
              data[21] = true;

              await membru.roles.add(process.env.DISCORD_HELI_ROLE);
              
              break;
            }

            case 'certificat_hs': {
              data[20] = true;

              await membru.roles.add(process.env.DISCORD_HS_ROLE);
              
              break;
            }

            case 'certificat_sniper': {
              data[19] = true;

              await membru.roles.add(process.env.DISCORD_SNIPER_ROLE);
              
              break;
            }
          }
          
          googleSheetsInstance.spreadsheets.values.update({
            auth,
            spreadsheetId: process.env.SHEET_ID,
            range: `Membri FIB/Pontaje!A${row}:U`,
            valueInputOption: "USER_ENTERED",
            resource: {
              values: [data],
            },
          });
        }
      }

      const logEmbed = new EmbedBuilder()
        .setColor('#1fbc9d')
        .setTitle(`Certificat Adaugat`)
        .setDescription(
          `${membru} a primit **${certificat}** pe DOCS de la ${interaction.user}`
        ).setTimestamp();

      await client.channels.cache
        .get(process.env.DISCORD_LOGS_CHANNEL)
        .send({ embeds: [logEmbed] });

      interaction.editReply({ content: 'Certificat adaugat cu succes!' })
      
    } catch (error) {
      console.log(`[ADAUGA_CERTIFICAT_ERROR]:\n${error}`);
    }
  },
};
