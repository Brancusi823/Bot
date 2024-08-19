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

const concediu = require('../../schemas/concediu.js')
const insigna = require('../../schemas/insigne.js')

function addDays(date, days) {
  date.setDate(date.getDate() + days);
  return date;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("concediu")
    .setDescription("Comenzi de concediu la un membru")
    .addSubcommand((subcommand) => 
      subcommand.setName("adauga").setDescription("Adauga concediu unui membru")
      .addUserOption((option) => option.setName('membru').setDescription('Alege membrul').setRequired(true))
      .addNumberOption((option) => option.setName('zile').setMaxValue(14).setMinValue(1).setDescription('Scrie cate zile de concediu are membrul').setRequired(true)))
    .addSubcommand((subcommand) => 
      subcommand.setName("anuleaza").setDescription("Anuleaza concediul unui membru")
      .addUserOption((option) => option.setName('membru').setDescription('Alege membrul').setRequired(true))),
  conducere: true,
  async execute(interaction) {
    const { options } = interaction;

    await interaction.deferReply({ ephemeral: true })

    const subcommand = options.getSubcommand();

    switch (subcommand) {
      case "adauga": {
        const membru = options.getMember('membru')
        const zile = options.getNumber('zile')

        if (!membru) return await interaction.editReply({ content: 'Nu am gasit membrul!', ephemeral: true })

        if (membru.user.bot) return await interaction.editReply({ content: 'Botul nu poate avea concediu..', ephemeral: true })

        let insignaProfile = await insigna.findOne({ userId: membru.user.id })
        if (!insignaProfile) return await interaction.editReply({ content: 'Acest membru nu este trecut pe docs!', ephemeral: true })
        if (insignaProfile.totalZileConcediu >= 14) return await interaction.editReply({ content: 'Acest membru a atins deja limita de 14 zile de concediu luna asta!', ephemeral: true })

        if (insignaProfile.totalZileConcediu + zile > 14) return await interaction.editReply({ content: `Acest membru mai poate avea doar **${14 - insignaProfile.totalZileConcediu}** zile de concediu!`, ephemeral: true })

        let concediuProfile = await concediu.findOne({ userId: membru.user.id });
        if (concediuProfile) return await interaction.editReply({ content: 'Acest membru este deja intr-un concediu!', ephemeral: true })
        else {
          const date = new Date();
          const endDate = addDays(new Date(), zile)

          concediuProfile = new concediu({
            _id: new mongoose.Types.ObjectId(),
            userId: membru.user.id,
            concediu: {
              start: date,
              end: endDate
            }
          })
          await concediuProfile.save().catch(console.error);

          insignaProfile.totalZileConcediu += zile;
          await insignaProfile.save().catch(console.error);

          await interaction.editReply({ content: 'Concediu inregistrat cu succes!', ephemeral: true })
        }
        break;
      }

      case "anuleaza": {
        const membru = options.getMember('membru')

        if (!membru) return await interaction.editReply({ content: 'Nu am gasit membrul!', ephemeral: true })

        if (membru.user.bot) return await interaction.editReply({ content: 'Botul nu poate avea concediu..', ephemeral: true })

        const concediuProfile = concediu.findOne({ userId: membru.user.id });
        if (!concediuProfile) return await interaction.editReply({ content: 'Acest membru nu are concediu!' })

        await concediu.deleteMany({ userId: membru.user.id });

        await interaction.editReply({ content: 'Concediu anulat cu succes!', ephemeral: true })
        break;
      }

      default: {
        interaction.editReply({ content: 'A intervenit o problema!' });
        break;
      }
    }
  },
};
