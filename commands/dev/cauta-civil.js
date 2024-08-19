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

const mandat = require('../../schemas/mandat.js')
const procesare = require('../../schemas/procesare.js')

module.exports = {
  data: new SlashCommandBuilder()
    .setName("cauta-civil")
    .setDescription("Cauta informatii despre un civil")
    .addStringOption((option) => option.setName("cnp").setDescription("Scrie CNP-ul (ID) civilului").setRequired(true)),
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const cnp = interaction.options.getString("cnp")
      let mandatProfiles = await mandat.find({ "suspectInfo.cnp": `${cnp}` });
      let procesariProfiles = await procesare.find({ "suspectInfo.cnp": `${cnp}` });

      if ((!mandatProfiles || mandatProfiles.length < 1) && (!procesariProfiles || procesariProfiles.length < 1)) return await interaction.editReply({ content: 'Nu am gasit nicio informatie despre aceasta persoana!' });

      let count = 1;
      let emb = [];
      
      mandatProfiles.forEach((mandatProfile) => {
        const embed = new EmbedBuilder().setTitle(`#${count} | Mandat`).setColor(mandatProfile.suspectInfo.gradCautare == 2 ? 'Red' : 'DarkGreen').setFields([
          {
            "name": `Nume/Prenume`,
            "value": `${mandatProfile.suspectInfo.numePrenume}`,
            "inline": true
          },
          {
            "name": `CNP (ID)`,
            "value": `${mandatProfile.suspectInfo.cnp}`,
            "inline": true
          },
          {
            "name": `Grad Cautare`,
            "value": `${mandatProfile.suspectInfo.gradCautare}`,
            "inline": true
          },
          {
            "name": `Acuzatii:`,
            "value": `${mandatProfile.suspectInfo.acuzatii.join('\n')}`,
            inline: false
          }
        ]).setTimestamp().setThumbnail(mandatProfile.suspectInfo.poza);
        
        emb.push(embed);

        count++;
      })

      procesariProfiles.forEach((procesariProfile) => {
        const embed = new EmbedBuilder().setTitle(`#${count} | Procesare`).setColor('Orange').setFields([
          {
            "name": `Nume/Prenume`,
            "value": `${procesariProfile.suspectInfo.numePrenume}`,
            "inline": true
          },
          {
            "name": `CNP (ID)`,
            "value": `${procesariProfile.suspectInfo.cnp}`,
            "inline": true
          },
          {
            "name": `Domiciliu`,
            "value": `${procesariProfile.suspectInfo.domiciliu}`,
            "inline": true
          },
          {
            "name": `Raport`,
            "value": `${procesariProfile.suspectInfo.raport}`,
            inline: false
          },
          {
            "name": `Acuzatii:`,
            "value": `${procesariProfile.suspectInfo.acuzatii.join('\n')}`,
            inline: false
          }
        ]).setTimestamp().setThumbnail(procesariProfile.suspectInfo.poza);

        emb.push(embed);

        count++;
      })

      await interaction.editReply({ content: `Informatii gasite despre **${cnp}**`, embeds: emb, ephemeral: true })
      
    } catch (error) {
      console.log(error);
    }
  },
};
