const {
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  EmbedBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

const acName = [
  "ART. 1 Sancțiuni rutiere",
  "ART. 2 Infracțiuni asupra domeniului privat si public",
  "ART. 3 Raspunderea in fata organelor de ordine",
  "ART. 4 + ART. 5",
];
const acuzatii = require("../../utils/acuzatii.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("calculare-amenda")
    .setDescription("Calculeaza amenda"),
  async execute(interaction) {
    try {
      if (
        interaction.channel.id !== process.env.DISCORD_CALCULEAZAAMENDA_CHANNEL
      )
        return await interaction.reply({
          content: "Nu poti folosi aceasta comanda aici!",
          ephemeral: true,
        });

      await interaction.deferReply();

      let comp = [];

      Object.keys(acuzatii).forEach((capitol, ind) => {
        let acuzatiiOptions = [];
        for (const acuzatie of acuzatii[capitol]) {
          acuzatiiOptions.push({
            label: acuzatie.Acuzatii.split(" ")[0],
            description: acuzatie.Acuzatii,
            value: acuzatie.Acuzatii,
          });
        }

        comp.push(
          new ActionRowBuilder()
            .addComponents(
              new StringSelectMenuBuilder()
                .setCustomId(`acuzatii_procesare_calculeaza_${ind}`)
                .setMinValues(1)
                .setMaxValues(acuzatii[capitol].length)
                .setPlaceholder(`${acName[ind]}`)
                .addOptions(acuzatiiOptions),
            )
            .toJSON(),
        );
      });

      const reset = new ButtonBuilder()
        .setCustomId("procesare_reset_calcul")
        .setLabel("Reset")
        .setStyle(ButtonStyle.Danger);

      comp.push(new ActionRowBuilder().addComponents(reset));

      const mainEmbed = new EmbedBuilder()
        .setTitle("Calculeaza Amenda")
        .addFields([
          { name: "Interval Amenda", value: "-", inline: false },
          { name: "Acuzatii", value: "-", inline: false },
        ])
        .setTimestamp()
        .setColor("#b8d8be");

      await interaction.editReply({
        content: `${interaction.member}`,
        components: comp,
        embeds: [mainEmbed],
      });
    } catch (error) {
      console.log(error);
    }
  },
};
