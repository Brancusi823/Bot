const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("emit")
    .setDescription("[DEV]")
    .addStringOption((option) =>
      option.setName("event").setDescription("[DEV]").setRequired(true)
    ),
  ownerOnly: true,
  async execute(interaction, client) {
    const event = interaction.options.getString("event");

    switch (event) {
      case "guildMemberRemove":
        {
          const emitted = await client.emit(event, interaction.member);
          await interaction.reply({ content: "-", ephemeral: true });
        }
        break;

      default:
        await interaction.reply({ content: "-", ephemeral: true });
        break;
    }
  },
};
