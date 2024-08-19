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
    .setName("cerere-insigna-dir")
    .setDescription("Completeaza formularul pentru a primi o insigna de DIR!"),
  async execute(interaction) {
    if (!interaction.member.roles.cache.has(process.env.DISCORD_DIR_ROLE))
      return await interaction.reply({
        content: `Poti folosi aceasta comanda doar daca ai rolul de <@&${process.env.DISCORD_DIR_ROLE}>`,
        ephemeral: true,
      });
    
    if (interaction.channel.id !== process.env.DISCORD_DIR_INSIGNA_CHANNEL)
      return await interaction.reply({
        content: `Poti folosi aceasta comanda doar in <#${process.env.DISCORD_DIR_INSIGNA_CHANNEL}>`,
        ephemeral: true,
      });
    const insignaProfile = await insigne.findOne({
      userId: interaction.user.id,
    });
    if (!insignaProfile) return await interaction.reply({ content: 'Nu esti in baza de date! Fa cerere-insigna de pd', ephemeral: true })
    if (insignaProfile && insignaProfile.nrInsignaDIR)
      return await interaction.reply({
        content: `Ai deja callsign **${insignaProfile.nrInsignaDIR}**!`,
        ephemeral: true,
      });

    const modal = new ModalBuilder()
      .setCustomId("insignaDIRModal")
      .setTitle("Cerere Insigna DIR");

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
