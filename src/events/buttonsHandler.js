const {
  Events,
  EmbedBuilder,
  CommandInteraction,
  EmbedType,
  PermissionFlagsBits,
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} = require("discord.js");

const insigne = require("../schemas/insigne");
const procesare = require("../schemas/procesare.js");
const pontajMoto = require("../schemas/pontaj-moto.js");

module.exports = {
  name: "interactionCreate",
  async execute(interaction, client) {
    if (!interaction.isButton()) return;

    if (interaction.customId.includes("mandat_")) {
      if (interaction.message.interaction.user.id !== interaction.user.id)
        return await interaction.reply({
          content: "Nu este mandatul tau!",
          ephemeral: true,
        });

      if (interaction.customId === "mandat_reset") {
        interaction.message.embeds[0].fields[3].value = "-";

        await interaction.message.edit({
          embeds: [interaction.message.embeds[0]],
        });
        await interaction.reply({
          content: "Mandat resetat cu succes!",
          ephemeral: true,
        });
      } else if (interaction.customId === "mandat_confirm") {
        await interaction.message.edit({ components: [] });
        await interaction.reply({
          content: "Mandat confirmat cu succes!",
          ephemeral: true,
        });
      }
    }

    if (interaction.customId === "anuleazaPontajButton") {
      if (
        interaction.member.roles.cache.has("1057009920932847657") ||
        interaction.member.roles.cache.has("1024696848121876560") ||
        interaction.member.roles.cache.has("1064550677315067935")
      ) {
        let pontajProfile = await pontajMoto.findOne({
          messageId: interaction.message.id,
        });
        if (pontajProfile) {
          interaction.message.edit({
            components: [],
            content: `${interaction.message.content} - **pontaj anulat**`,
          });

          await pontajMoto.deleteOne({ _id: pontajProfile._id });
          await interaction.reply({
            content: "Pontaj anulat cu succes!",
            ephemeral: true,
          });
        }
      } else {
        await interaction.reply({
          ephemeral: true,
          content: "Nu ai permisiunea sa faci asta!",
        });
      }
    }

    if (interaction.customId.includes("procesare_")) {
      if (interaction.message.interaction.user.id !== interaction.user.id)
        return await interaction.reply({
          content: "Nu este procesarea ta!",
          ephemeral: true,
        });

      const insigneProfile = await insigne.findOne({
        userId: interaction.user.id,
      });

      if (interaction.customId.includes("procesare_reset")) {
        if (interaction.customId.includes("calcul")) {
          interaction.message.embeds[0].fields[0].value = "-";
          interaction.message.embeds[0].fields[1].value = "-";

          await interaction.message.edit({
            embeds: [interaction.message.embeds[0]],
          });
          await interaction.reply({
            content: "Calcul resetat cu succes!",
            ephemeral: true,
          });
        } else {
          interaction.message.embeds[0].fields[4].value = "-";
          interaction.message.embeds[0].fields[5].value = "-";
          interaction.message.embeds[0].fields[6].value = "-";

          await interaction.message.edit({
            embeds: [interaction.message.embeds[0]],
          });
          await interaction.reply({
            content: "Procesare resetata cu succes!",
            ephemeral: true,
          });

          let procesareProfile = await procesare.findOne({
            "userInfo.messageId": interaction.message.id,
          });
          if (!procesareProfile)
            return await interaction.editReply({
              content: "Eroare! Nu am gasit procesarea in baza de date",
              ephemeral: true,
            });
          procesareProfile.suspectInfo.acuzatii = [];
          await procesareProfile.save().catch(console.error);
        }
      } else if (interaction.customId === "procesare_confirm") {
        await interaction.message.edit({ components: [] });
        insigneProfile.procesari += 1;
        await insigneProfile.save().catch(console.error);
        await interaction.reply({
          content: "Procesare confirmata cu succes!",
          ephemeral: true,
        });
      } else if (interaction.customId === "procesare_raport") {

        const modal = new ModalBuilder()
          .setCustomId("procesareModal")
          .setTitle("Procesare");

        const procesareInput = new TextInputBuilder()
          .setCustomId("procesareInput")
          .setLabel("Scrie Raportul")
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
          .setMaxLength(768);

        const procesareActionRow = new ActionRowBuilder().addComponents(procesareInput);

        modal.addComponents(procesareActionRow);

        await interaction.showModal(modal);
      }
    }
  },
};
