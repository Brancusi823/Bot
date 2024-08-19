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
    .setName("wipe-evidente")
    .setDescription("Da WIPE la evidente"),
  conducere: true,
  async execute(interaction, client) {    
    await interaction.deferReply({ ephemeral: true });

    try {
      await insigne.updateMany({}, { EVIDENTE: 0 });
      
      const logEmbed = new EmbedBuilder()
        .setColor('Orange')
        .setTitle(`WIPE EVIDENTE`)
        .setDescription(
          `${interaction.member} a dat WIPE la EVIDENTE`
        ).setTimestamp();

      await client.channels.cache
        .get(process.env.DISCORD_LOGS_CHANNEL)
        .send({ embeds: [logEmbed] });

      await interaction.editReply({ content: `WIPE la EVIDENTE cu succes!`, ephemeral: true })
      
    } catch (error) {
      console.log(`[VERIFICA_EVIDENTE_ERROR]:\n${error}`);
    }
  },
};
