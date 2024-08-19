const {
  SlashCommandBuilder,
  ModalBuilder,
  EmbedBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

const acName = ['ART. 1 Sancțiuni rutiere', 'ART. 2 Infracțiuni asupra domeniului privat si public', 'ART. 3 Raspunderea in fata organelor de ordine', 'ART. 4 + ART. 5']

const acuzatii = require('../../utils/acuzatii.json'); 

const mandat = require('../../schemas/mandat.js')

const mongoose = require('mongoose');

module.exports = {
  data: new SlashCommandBuilder()
    .setName("mandat")
    .setDescription("Vezi comenzile legate de mandate")
    .addSubcommand((sc) => sc.setName('creeaza').setDescription('Creeaza un mandat')
      .addStringOption((option) => option.setName('nume_prenume').setDescription('Scrie  numele si prenumele acuzatului').setRequired(true))
      .addNumberOption((option) => option.setName('cnp').setDescription('Scrie CNP-ul (ID) acuzatului').setRequired(true))
      .addNumberOption((option) => option.setName('grad_cautare').setDescription('Alege gradul de cautare al acuzatului').setRequired(true).addChoices({ name: 'Grad 1', value: 1 }, { name: "Grad 2", value: 2 }))
      .addAttachmentOption((option) => option.setName('poza').setDescription('Adauga poza').setRequired(true)))
    .addSubcommand((sc) => sc.setName('verifica').setDescription('Creeaza un mandat')
      .addNumberOption((option) => option.setName('cnp').setDescription('Scrie CNP-ul (ID) acuzatului pe care vrei sa-l cauti').setRequired(true))),
  async execute(interaction) {
    if (interaction.channel.id !== process.env.DISCORD_MANDAT_CHANNEL)
      return await interaction.reply({
        content: `Poti folosi aceasta comanda doar in <#${process.env.DISCORD_MANDAT_CHANNEL}>`,
        ephemeral: true,
      });

    await interaction.deferReply()

    const { options, member } = interaction;

    switch (options.getSubcommand()) {
      case "creeaza": {
        const nume_prenume = options.getString('nume_prenume')
        const cnp = options.getNumber('cnp')
        const gradCautare = options.getNumber('grad_cautare')
        const poza = options.getAttachment('poza')
    
        if (!poza.contentType.includes('image')) return await interaction.editReply({ content: 'Nu ai trimis o poza!' })
    
        let comp = []
        
        Object.keys(acuzatii).forEach((capitol, ind) => {
          let acuzatiiOptions = [];
          for (const acuzatie of acuzatii[capitol]) {
            acuzatiiOptions.push({ label: acuzatie.Acuzatii.split(' ')[0], description: acuzatie.Acuzatii, value: acuzatie.Acuzatii })
          }
          
          comp.push(new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId(`acuzatii_mandat_${ind}`).setMinValues(1).setMaxValues(acuzatii[capitol].length).setPlaceholder(`${acName[ind]}`).addOptions(acuzatiiOptions)).toJSON());
        })
    
        const embed = new EmbedBuilder().setTitle('Mandat').setColor(gradCautare == 2 ? 'Red' : 'DarkGreen').setFields([
            {
              "name": `Nume/Prenume`,
              "value": `${nume_prenume}`,
              "inline": true
            },
            {
              "name": `CNP (ID)`,
              "value": `${cnp}`,
              "inline": true
            },
            {
              "name": `Grad Cautare`,
              "value": `${gradCautare}`,
              "inline": true
            },
            {
              "name": `Acuzatii:`,
              "value": `-`,
              inline: false
            }
          ]).setTimestamp().setThumbnail(poza.url);
    
          const confirm = new ButtonBuilder()
      			.setCustomId('mandat_confirm')
      			.setLabel('Confirm')
      			.setStyle(ButtonStyle.Success);
      
      		const reset = new ButtonBuilder()
      			.setCustomId('mandat_reset')
      			.setLabel('Reset')
      			.setStyle(ButtonStyle.Danger);
      
      		comp.push(new ActionRowBuilder().addComponents(reset, confirm))
    
        const msg = await interaction.editReply({ content: `${member}`, components: comp, embeds: [embed] });

        let mandatProfile = new mandat({
          _id: new mongoose.Types.ObjectId(),
          userInfo: {
            userId: `${interaction.user.id}`,
            messageId: `${msg.reactions.message.id}`
          },
          suspectInfo: {
            numePrenume: `${nume_prenume}`,
            cnp: `${cnp}`,
            acuzatii: [],
            gradCautare: `${gradCautare}`,
            poza: `${poza.url}`,
          }
        })
        await mandatProfile.save();
        break;
      }
      case "verifica": {
        const cnp = options.getNumber('cnp');
        let mandatProfile = await mandat.findOne({ "suspectInfo.cnp": `${cnp}` });

        if (mandatProfile) {
          const embed = new EmbedBuilder().setTitle('Aceasta persoana este data in urmarire!').setColor(mandatProfile.suspectInfo.gradCautare == 2 ? 'Red' : 'DarkGreen').setFields([
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
          
          await interaction.editReply({ embeds: [embed] })
        } else {
          await interaction.editReply({ content: 'Aceasta persoana nu este data in urmarire!' })
        }
        break;
      }
      default: {
        console.log('err default')
        break;
      }
    }
  },
};
