const {
  SlashCommandBuilder,
  ChannelType,
  PermissionsBitField,
  EmbedBuilder,
} = require("discord.js");
const insigne = require("../../schemas/insigne");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("lockdown")
    .setDescription("Inchide/Deschide un canal")
    .addSubcommand((sc) =>
      sc
        .setName("inchide")
        .setDescription("Inchide un canal")
        .addChannelOption((option) =>
          option
            .setName("canal")
            .setDescription("Alege canalul pe care vrei sa-l inchizi")
            .setRequired(true)
            .addChannelTypes(ChannelType.GuildText)
        )
        .addStringOption((option) =>
          option
            .setName("motiv")
            .setDescription("Spune motivul")
            .setRequired(true)
        )
    )
    .addSubcommand((sc) =>
      sc
        .setName("deschide")
        .setDescription("Deschide un canal")
        .addChannelOption((option) =>
          option
            .setName("canal")
            .setDescription("Alege canalul pe care vrei sa-l deschizi")
            .setRequired(true)
            .addChannelTypes(ChannelType.GuildText)
        )
    ),
  conducere: true,
  async execute(interaction) {
    switch (interaction.options.getSubcommand()) {
      case "inchide": {
        const canal = interaction.options.getChannel("canal");
        const motiv = interaction.options.getString("motiv");

        canal.permissionOverwrites.edit(process.env.DISCORD_MAI_ROLE, {
          SendMessages: false,
        });

        canal.send({
          embeds: [
            new EmbedBuilder()
              .setTitle("Canal Inchis")
              .setDescription(
                `${interaction.member} a inchis acest canal temporrar`
              )
              .setTimestamp()
              .addFields({ name: "Motiv:", value: motiv })
              .setColor("DarkBlue"),
          ],
        });

        await interaction.reply({
          content: "Ai inchis cu succes canalul.",
          ephemeral: true,
        });
        break;
      }

      case "deschide": {
        const canal = interaction.options.getChannel("canal");

        canal.permissionOverwrites.edit(process.env.DISCORD_MAI_ROLE, {
          SendMessages: true,
        });

        canal.send({
          embeds: [
            new EmbedBuilder()
              .setTitle("Canal Deschis")
              .setDescription(`${interaction.member} a deschis acest canal`)
              .setTimestamp()
              .setColor("DarkBlue"),
          ],
        });

        await interaction.reply({
          content: "Ai deschis cu succes canalul.",
          ephemeral: true,
        });
        break;
      }

      default:
        await interaction.reply({
          content: "There was an error while executing this command.",
          ephemeral: true,
        });
        break;
    }
  },
};
