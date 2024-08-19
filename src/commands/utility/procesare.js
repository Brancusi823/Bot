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

const mongoose = require('mongoose');

// const acuzatii = require('../../utils/acuzatii');  
const acuzatii = require('../../utils/acuzatii.json'); 
const procesare = require('../../schemas/procesare.js');  

module.exports = {
  data: new SlashCommandBuilder()
    .setName("procesare")
    .setDescription("Fa o procesare")
    .addStringOption((option) => option.setName('nume_prenume').setDescription('Scrie  numele si prenumele acuzatului').setRequired(true))
    .addNumberOption((option) => option.setName('cnp').setDescription('Scrie CNP-ul (ID) acuzatului').setRequired(true))
    .addAttachmentOption((option) => option.setName('poza').setDescription('Adauga poza').setRequired(true))
    // .addStringOption((option) => option.setName('raport').setDescription('Scrie un mic raport despre ce s-a intamplat').setRequired(true))
    .addStringOption((option) => option.setName('domiciliu').setDescription('Scrie domiciliul persoanei (optional)')),
  async execute(interaction) {
    if (interaction.channel.id !== process.env.DISCORD_PROCESARE_CHANNEL)
      return await interaction.reply({
        content: `Poti folosi aceasta comanda doar in <#${process.env.DISCORD_PROCESARE_CHANNEL}>`,
        ephemeral: true,
      });

    await interaction.deferReply()

    const { options, member } = interaction;

    const nume_prenume = options.getString('nume_prenume')
    const cnp = options.getNumber('cnp')
    const poza = options.getAttachment('poza')
    const domiciliu = options.getString('domiciliu')
    // const raport = options.getString('raport')

    if (!poza.contentType.includes('image')) return await interaction.editReply({ content: 'Nu ai trimis o poza!' })

    let comp = []
    
    Object.keys(acuzatii).forEach((capitol, ind) => {
      let acuzatiiOptions = [];
      for (const acuzatie of acuzatii[capitol]) {
        acuzatiiOptions.push({ label: acuzatie.Acuzatii.split(' ')[0], description: acuzatie.Acuzatii, value: acuzatie.Acuzatii })
      }
      
      comp.push(new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId(`acuzatii_procesare_${ind}`).setMinValues(1).setMaxValues(acuzatii[capitol].length).setPlaceholder(`${acName[ind]}`).addOptions(acuzatiiOptions)).toJSON());
    })

    const embed = new EmbedBuilder().setTitle('Procesare').setColor('Orange').setFields([
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
          "name": `Domiciliu`,
          "value": `${domiciliu || 'Nespecificat'}`,
          "inline": true
        },
        {
          "name": `Raport`,
          "value": `-`,
          inline: false
        },
        {
          "name": `Interval Amenda`,
          "value": "-",
          "inline": false
        },
        {
          "name": `Interval Inchisoare`,
          "value": "-",
          "inline": true
        },
        {
          "name": `Acuzatii:`,
          "value": `-`,
          inline: false
        }
      ]).setTimestamp().setThumbnail(poza.url);

      const confirm = new ButtonBuilder()
  			.setCustomId('procesare_confirm')
  			.setLabel('Confirm')
  			.setStyle(ButtonStyle.Success);

    const adaugaraportbutton = new ButtonBuilder()
        .setCustomId('procesare_raport')
        .setLabel('Adauga Raport')
        .setStyle(ButtonStyle.Primary);
  
  		const reset = new ButtonBuilder()
  			.setCustomId('procesare_reset')
  			.setLabel('Reset')
  			.setStyle(ButtonStyle.Danger);
  
  		comp.push(new ActionRowBuilder().addComponents(reset, adaugaraportbutton, confirm))
    
    const msg = await interaction.editReply({ content: `${member}`, components: comp, embeds: [embed] });

    let procesareProfile = new procesare({
        _id: new mongoose.Types.ObjectId(),
        userInfo: {
          userId: `${interaction.user.id}`,
          messageId: `${msg.reactions.message.id}`
        },
        suspectInfo: {
          numePrenume: `${nume_prenume}`,
          cnp: `${cnp}`,
          acuzatii: [],
          domiciliu: `${domiciliu || 'Nespecificat'}`,
          raport: `-`,
          poza: `${poza.url}`,
        }
      })
    
    await procesareProfile.save();
  },
};
