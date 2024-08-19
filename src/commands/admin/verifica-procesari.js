const {
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  EmbedBuilder,
} = require("discord.js");

const insigne = require("../../schemas/insigne");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("verifica-evidentele")
    .setDescription("Verifica evidentele unui membru")
    .addUserOption((option) => option.setName("membru").setDescription("Alege membrul").setRequired(true)),
  conducere: true,
  async execute(interaction, client) {
    const membru = interaction.options.getMember('membru');
    
    await interaction.deferReply({ ephemeral: true });

    try {
      const insigneProfile = await insigne.findOne({
        userId: membru.user.id,
      });

      if (!insigneProfile) return await interaction.editReply({ 
content: 'Acest membru nu este trecut in baza de date!', ephemeral: true })

      let evidente = insigneProfile.evidente ? insigneProfile.evidente : 0;

      await interaction.editReply({ content: `${membru} are ${evidente} ${evidente === 1 ? 'evidente' : 'evidentele'}!`, ephemeral: true })
      
    } catch (error) {
      console.log(`[VERIFICA_evidente_ERROR]:\n${error}`);
    }
  },
};
