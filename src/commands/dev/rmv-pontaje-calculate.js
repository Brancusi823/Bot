const {
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  EmbedBuilder,
} = require("discord.js");

const { google } = require("googleapis");

const pontaj = require("../../schemas/pontaj");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rmv-pontaje-calculate")
  .setDescription("Developer only")
  .addNumberOption((option) => option.setName("x").setRequired(true).setDescription('X')),
  ownerOnly: true,
  async execute(interaction) {
    const x = interaction.options.getNumber("x");

    await interaction.deferReply();

    try {
      const profiles = await pontaj.find()

      // luna!!!!!!!!!
      // for (const pontajProfile of profiles) {
      //   const date2 = new Date(pontajProfile.pontajDeschisLa)
      //   if (x === date2.getMonth()+1) await pontaj.deleteOne({ _id: pontajProfile._id });
      // }

      // zi!!!!!!!!!!!
      for (const pontajProfile of profiles) {
        const date2 = new Date(pontajProfile.pontajDeschisLa)
        if (x === date2.getDate()) await pontaj.deleteOne({ _id: pontajProfile._id });
      }


      await interaction.editReply({
        content: "Done",
      });
    } catch (error) {
      console.log(`[RMV_PONTAJ_ERR]:\n${error}`);
    }
  },
};