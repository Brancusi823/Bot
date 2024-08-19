const {
  Events,
  EmbedBuilder,
  CommandInteraction,
  EmbedType,
  PermissionFlagsBits,
} = require("discord.js");

const acuzatii = require("../utils/acuzatii.json");
const mandat = require("../schemas/mandat.js");
const procesare = require("../schemas/procesare.js");

module.exports = {
  name: "interactionCreate",
  async execute(interaction, client) {
    if (!interaction.isStringSelectMenu()) return;

    if (interaction.customId.includes("acuzatii_procesare_")) {
      if (interaction.customId.includes("calculeaza")) {
        if (interaction.message.interaction.user.id !== interaction.user.id)
          return await interaction.reply({
            content: "Nu este calculul tau!",
            ephemeral: true,
          });

        await interaction.deferReply({ ephemeral: true });

        let embed = interaction.message.embeds[0];
        let newValue = embed.fields[1].value;
        let values = interaction.values;
        let totalAcuzatii = [];

        if (newValue.split("\n").length + values.length > 10)
          return await interaction.editReply({
            content: "Poti avea maxim 10 acuzatii!",
            ephemeral: true,
          });

        let intervalAmenda = { minim: 0, maxim: 0 };

        for (const value of values) {
          if (newValue.includes(value))
            return await interaction.editReply({
              content: `Acuzatia \`${value}\` este deja trecuta!`,
              ephemeral: true,
            });
        }

        newValue.length === 1
          ? (newValue = values.join("\n"))
          : (newValue = newValue + "\n" + values.join("\n"));

        values = newValue.split("\n");

        Object.values(acuzatii).forEach(
          (a) => (totalAcuzatii = totalAcuzatii.concat(a)),
        );

        values.forEach((acuzatie) => {
          const info = totalAcuzatii.find((obj) => obj.Acuzatii === acuzatie);

          intervalAmenda.minim += info.Amenda.Minim;
          intervalAmenda.maxim += info.Amenda.Maxim;
        });

        interaction.message.embeds[0].fields[0].value = `${intervalAmenda.minim.toLocaleString()} - ${intervalAmenda.maxim.toLocaleString()}`;
        interaction.message.embeds[0].fields[1].value = newValue;

        await interaction.message.edit({
          embeds: [interaction.message.embeds[0]],
        });
        await interaction.editReply({
          content: "Acuzatii adaugate cu succes!",
          ephemeral: true,
        });
      } else {
        if (interaction.message.interaction.user.id !== interaction.user.id)
          return await interaction.reply({
            content: "Nu este procesarea ta!",
            ephemeral: true,
          });

        await interaction.deferReply({ ephemeral: true });

        let intervalAmenda = { minim: 0, maxim: 0 };
        let intervalInchisoare = { minim: 0, maxim: 0 };

        let embed = interaction.message.embeds[0];
        let newValue = embed.fields[6].value;
        let values = interaction.values;
        let totalAcuzatii = [];

        if (newValue.split("\n").length + values.length > 10)
          return await interaction.editReply({
            content: "Poti avea maxim 10 acuzatii!",
            ephemeral: true,
          });

        for (const value of values) {
          if (newValue.includes(value))
            return await interaction.editReply({
              content: `Acuzatia \`${value}\` este deja trecuta!`,
              ephemeral: true,
            });
        }

        newValue.length === 1
          ? (newValue = values.join("\n"))
          : (newValue = newValue + "\n" + values.join("\n"));

        values = newValue.split("\n");

        Object.values(acuzatii).forEach(
          (a) => (totalAcuzatii = totalAcuzatii.concat(a)),
        );

        let procesareProfile = await procesare.findOne({
          "userInfo.messageId": interaction.message.id,
        });
        if (!procesareProfile)
          return await interaction.editReply({
            content: "Eroare! Nu am gasit procesarea in baza de date",
            ephemeral: true,
          });
        procesareProfile.suspectInfo.acuzatii = values;
        await procesareProfile.save().catch(console.error);

        values.forEach((acuzatie) => {
          const info = totalAcuzatii.find((obj) => obj.Acuzatii === acuzatie);

          intervalAmenda.minim += info.Amenda.Minim;
          intervalAmenda.maxim += info.Amenda.Maxim;
          intervalInchisoare.minim += info.Sentinta.Minim;
          intervalInchisoare.maxim += info.Sentinta.Maxim;
        });

        interaction.message.embeds[0].fields[4].value = `${intervalAmenda.minim.toLocaleString()} - ${intervalAmenda.maxim.toLocaleString()}`;
        interaction.message.embeds[0].fields[5].value = `${intervalInchisoare.minim} - ${intervalInchisoare.maxim}`;
        interaction.message.embeds[0].fields[6].value = newValue;

        await interaction.message.edit({
          embeds: [interaction.message.embeds[0]],
        });
        await interaction.editReply({
          content: "Acuzatii adaugate cu succes!",
          ephemeral: true,
        });
      }
    } else if (interaction.customId.includes("acuzatii_mandat_")) {
      if (interaction.message.interaction.user.id !== interaction.user.id)
        return await interaction.reply({
          content: "Nu este mandatul tau!",
          ephemeral: true,
        });

      await interaction.deferReply({ ephemeral: true });

      let embed = interaction.message.embeds[0];
      let newValue = embed.fields[3].value;
      let values = interaction.values;
      let totalAcuzatii = [];

      if (newValue.split("\n").length + values.length > 10)
        return await interaction.editReply({
          content: "Poti avea maxim 10 acuzatii!",
          ephemeral: true,
        });

      for (const value of values) {
        if (newValue.includes(value))
          return await interaction.editReply({
            content: `Acuzatia \`${value}\` este deja trecuta!`,
            ephemeral: true,
          });
      }

      newValue.length === 1
        ? (newValue = values.join("\n"))
        : (newValue = newValue + "\n" + values.join("\n"));

      values = newValue.split("\n");

      Object.values(acuzatii).forEach(
        (a) => (totalAcuzatii = totalAcuzatii.concat(a)),
      );

      let mandatProfile = await mandat.findOne({
        "userInfo.messageId": interaction.message.id,
      });
      if (!mandatProfile)
        return await interaction.editReply({
          content: "Eroare! Nu am gasit mandatul in baza de date",
          ephemeral: true,
        });
      mandatProfile.suspectInfo.acuzatii = values;
      await mandatProfile.save().catch(console.error);

      interaction.message.embeds[0].fields[3].value = newValue;

      await interaction.message.edit({
        embeds: [interaction.message.embeds[0]],
      });
      await interaction.editReply({
        content: "Acuzatii adaugate cu succes!",
        ephemeral: true,
      });
    }
  },
};
