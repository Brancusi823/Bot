const {
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} = require("discord.js");
const insigne = require("../../schemas/insigne");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("cerere-insigna")
    .setDescription("Completeaza formularul pentru a primi o insigna!"),
  async execute(interaction) {
    if (interaction.channel.id !== process.env.DISCORD_INSIGNA_CHANNEL)
      return await interaction.reply({
        content: `Poti folosi aceasta comanda doar in <#${process.env.DISCORD_INSIGNA_CHANNEL}>`,
        ephemeral: true,
      });
    const insignaProfile = await insigne.findOne({
      userId: interaction.user.id,
    });
    if (insignaProfile)
      return await interaction.reply({
        content: `Ai deja callsign **${insignaProfile.nrInsigna}**!`,
        ephemeral: true,
      });

    const modal = new ModalBuilder()
      .setCustomId("insignaModal")
      .setTitle("Cerere Insigna");

    const numeInput = new TextInputBuilder()
      .setCustomId("numeInput")
      .setLabel("Nume+Prenume (IC)")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(20);

    const idInput = new TextInputBuilder()
      .setCustomId("idInput")
      .setLabel("ID")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(5);

    const numeActionRow = new ActionRowBuilder().addComponents(numeInput);
    const idActionRow = new ActionRowBuilder().addComponents(idInput);

    modal.addComponents(numeActionRow);
    modal.addComponents(idActionRow);

    await interaction.showModal(modal);
  },
};
