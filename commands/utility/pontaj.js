const {
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

const pontajMoto = require("../../schemas/pontaj-moto.js");
const mongoose = require("mongoose");

const pontaj = require("../../schemas/pontaj");
const insigne = require("../../schemas/insigne");

const timeout = [];

module.exports = {
  data: new SlashCommandBuilder()
    .setName("pontaj")
    .setDescription("Deschide/inchide pontajele")
    .addSubcommand((sc) =>
      sc
        .setName("rutiera")
        .setDescription("Deschide/inchide pontajul de rutiera")
        .addStringOption((option) =>
          option
            .setName("actiune")
            .setDescription("Alege una dintre variante")
            .addChoices(
              { name: "Clock In", value: "clock_in" },
              { name: "Clock Out", value: "clock_out" },
            )
            .setRequired(true),
        ),
    ),
  async execute(interaction, client) {
    try {
      const { options, channel, member } = interaction;

      switch (options.getSubcommand()) {
        case "rutiera": {
          const action_type = interaction.options.getString("actiune");

          const pontaje = [process.env.DISCORD_PONTAJ_CHANNEL];

          if (!pontaje.includes(interaction.channel.id))
            return await interaction.reply({
              content: `Poti folosi aceasta comanda doar in canalul de pontaj!`,
              ephemeral: true,
            });

          const insigneProfile = await insigne.findOne({
            userId: interaction.user.id,
          });
          if (!insigneProfile)
            return await interaction.reply({
              content:
                "Nu poti folosi aceasta comanda deoarece nu ai insigna. Fa cerere insigna si incearca din nou!",
              ephemeral: true,
            });

          switch (action_type) {
            case "clock_in": {
              if (timeout.includes(interaction.user.id))
                return await interaction.reply({
                  content:
                    "Nu poti folosi aceasta comanda asa repede, incearca din nou in 10 minute.",
                  ephemeral: true,
                });

              // VERIFICA DACA ARE VREUN PONTAJ DESCHIS

              let pontajProfile = await pontaj.findOne({
                userId: interaction.user.id,
                estePontajDeschis: true,
              });

              // ARE UNUL DEJA DESCHIS, STERGE-L

              if (pontajProfile && pontajProfile.estePontajDeschis) {
                try {
                  await interaction.channel.messages.delete(
                    pontajProfile.messageId,
                  );
                  await pontaj.deleteOne({ _id: pontajProfile._id });
                } catch (error) {
                  await pontaj.deleteOne({ _id: pontajProfile._id });
                }
              }

              // DESCHIDE PONTAJ NOU

              let coeff = 1000 * 60 * 5;
              const date = new Date();

              date.setTime(date.getTime() + 3 * 60 * 60 * 1000);

              let rounded = new Date(
                Math.round(date.getTime() / coeff) * coeff,
              );
              let minutes = rounded.getMinutes();
              minutes < 10 ? (minutes = `0${minutes}`) : (minutes = minutes);

              const embed = new EmbedBuilder()
                .setColor(`DarkBlue`)
                .setDescription(
                  `Clock in: ${
                    date.getHours() < 10
                      ? `0${date.getHours()}`
                      : date.getHours()
                  }:${minutes} / Clock out:`,
                );

              const message = await interaction.channel.send({
                content: `<@${interaction.user.id}>`,
                embeds: [embed],
              });

              const collectorFilter = async (reaction, user) => {
                const member = await client.guilds.cache
                  .get(reaction.message.guildId)
                  .members.cache.get(user.id);
                return (
                  reaction.emoji.name === "❌" &&
                  (member.roles.cache.get(process.env.DISCORD_RU_ROLE) ||
                    member.roles.cache.get(process.env.DISCORD_CONDUCERE_ROLE))
                );
              };

              const collector = message.createReactionCollector({
                filter: collectorFilter,
                max: 1,
              });

              collector.on("collect", async (reaction, user) => {
                const profile = await pontaj.findOne({
                  messageId: reaction.message.id,
                });
                if (!profile) return;
                profile.estePontajAnulat = true;
                await profile.save();
              });

              pontajProfile = new pontaj({
                _id: new mongoose.Types.ObjectId(),
                userId: interaction.user.id,
                messageId: message.id,
                pontajDeschisLa: rounded,
              });

              await pontajProfile.save().catch(console.error);

              interaction.reply({
                ephemeral: true,
                content: "Ti-ai pornit pontajul!",
              });

              break;
            }
            case "clock_out": {
              // VERIFICA DACA ARE VREUN PONTAJ DESCHIS

              let pontajProfile = await pontaj.findOne({
                userId: interaction.user.id,
                estePontajDeschis: true,
              });

              // NU ARE NICIUN PONTAJ DESCHIS/INCHIS

              if (!pontajProfile)
                return await interaction.reply({
                  content: "Nu ai niciun pontaj deschis!",
                  ephemeral: true,
                });

              // ARE PONTAJ DESCHIS
              let coeff = 1000 * 60 * 5;
              const date = new Date();

              date.setTime(date.getTime() + 3 * 60 * 60 * 1000);

              let rounded = new Date(
                Math.round(date.getTime() / coeff) * coeff,
              );

              let message = await interaction.channel.messages.fetch(
                pontajProfile.messageId,
              );

              let minutes = rounded.getMinutes();
              minutes < 10 ? (minutes = `0${minutes}`) : (minutes = minutes);

              function diff_minutes(dt2, dt1) {
                var diff = (dt2.getTime() - dt1.getTime()) / 1000;
                diff /= 60;
                return Math.abs(Math.round(diff));
              }

              const TOTAL_MIN = diff_minutes(
                rounded,
                pontajProfile.pontajDeschisLa,
              );

              const newEmbed = new EmbedBuilder()
                .setColor(message.embeds[0].data.color)
                .setDescription(
                  message.embeds[0].data.description +
                    ` ${date.getHours()}:${minutes} **(${TOTAL_MIN} min)**`,
                );

              message = await message.edit({
                embeds: [newEmbed],
                content: `${message.content} ${TOTAL_MIN}`,
              });

              await pontaj.updateOne(
                { _id: pontajProfile._id },
                {
                  estePontajDeschis: false,
                  pontajInchisLa: rounded,
                  totalMinute: TOTAL_MIN,
                  estePontajAnulat: false,
                },
              );

              interaction.reply({
                ephemeral: true,
                content: `Ti-ai inchis pontajul!\n ${message.url}`,
              });

              break;
            }

            default:
              interaction.reply({
                content: "There was an error while executing this command!",
                ephemeral: true,
              });
              break;
          }

          timeout.push(interaction.user.id);
          setTimeout(
            () => {
              timeout.shift();
            },
            1000 * 60 * 10,
          );
          break;
        }
        case "moto": {
          const action_type = options.getString("actiune");
          const moto_type = options.getString("tip");

          if (!member.roles.cache.has(process.env.DISCORD_MOTO_ROLE))
            return await interaction.reply({
              content: `Poti folosi aceasta comanda doar daca ai gradul <@&${process.env.DISCORD_MOTO_ROLE}>!`,
              ephemeral: true,
            });

          if (channel.id !== process.env.DISCORD_PONTAJMOTO_CHANNEL)
            return await interaction.reply({
              content: `Poti folosi aceasta comanda doar in canalul de pontaj!`,
              ephemeral: true,
            });

          switch (action_type) {
            case "clock_in": {
              let profiles = await pontajMoto.find({ tipMoto: moto_type });
              if (profiles.length > 3)
                return await interaction.reply({
                  content: `Nu pot fi mai mult de 3 pontaje de moto!`,
                  ephemeral: true,
                });

              let pontajProfile = await pontajMoto.findOne({
                userId: interaction.user.id,
              });

              if (pontajProfile) {
                try {
                  await interaction.channel.messages.delete(
                    pontajProfile.messageId,
                  );
                  await pontajMoto.deleteOne({ _id: pontajProfile._id });
                } catch (error) {
                  await pontajMoto.deleteOne({ _id: pontajProfile._id });
                }
              }

              let coeff = 1000 * 60 * 5;
              const date = new Date();

              date.setTime(date.getTime() + 3 * 60 * 60 * 1000);

              let rounded = new Date(
                Math.round(date.getTime() / coeff) * coeff,
              );
              let minutes = rounded.getMinutes();
              minutes < 10 ? (minutes = `0${minutes}`) : (minutes = minutes);

              const embed = new EmbedBuilder()
                .setColor(`DarkBlue`)
                .setDescription(
                  `Clock in: ${
                    date.getHours() < 10
                      ? `0${date.getHours()}`
                      : date.getHours()
                  }:${minutes} / Clock out:\nTip moto: **${moto_type}**`,
                );

              const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                  .setCustomId("anuleazaPontajButton")
                  .setLabel("Anuleaza Pontaj")
                  .setStyle(ButtonStyle.Danger),
              );

              const message = await interaction.channel.send({
                content: `<@${interaction.user.id}>`,
                embeds: [embed],
                components: [row],
              });

              pontajProfile = new pontajMoto({
                _id: new mongoose.Types.ObjectId(),
                userId: interaction.user.id,
                messageId: message.id,
                pontajDeschisLa: rounded,
                tipMoto: moto_type,
              });

              await pontajProfile.save().catch(console.error);

              interaction.reply({
                ephemeral: true,
                content: "Ti-ai pornit pontajul!",
              });

              break;
            }
            case "clock_out": {
              let pontajProfile = await pontajMoto.findOne({
                userId: interaction.user.id,
              });

              if (!pontajProfile)
                return await interaction.reply({
                  content: "Nu ai niciun pontaj deschis!",
                  ephemeral: true,
                });

              let coeff = 1000 * 60 * 5;
              const date = new Date();

              date.setTime(date.getTime() + 3 * 60 * 60 * 1000);

              let rounded = new Date(
                Math.round(date.getTime() / coeff) * coeff,
              );

              let minutes = rounded.getMinutes();
              minutes < 10 ? (minutes = `0${minutes}`) : (minutes = minutes);

              let message = await interaction.channel.messages.fetch(
                pontajProfile.messageId,
              );

              const date2 = pontajProfile.pontajDeschisLa;
              let rounded2 = new Date(
                Math.round(date2.getTime() / coeff) * coeff,
              );
              let minutes2 = rounded2.getMinutes();
              minutes2 < 10
                ? (minute2s = `0${minutes2}`)
                : (minutes2 = minutes2);

              function diff_minutes(dt2, dt1) {
                var diff = (dt2.getTime() - dt1.getTime()) / 1000;
                diff /= 60;
                return Math.abs(Math.round(diff));
              }

              const TOTAL_MIN = diff_minutes(
                rounded,
                pontajProfile.pontajDeschisLa,
              );

              const newEmbed = new EmbedBuilder()
                .setColor(message.embeds[0].data.color)
                .setDescription(
                  `Clock in: ${date2.getHours()}:${minutes2} / Clock out: ${date.getHours()}:${minutes} **(${TOTAL_MIN} min)**\nTip moto: **${
                    pontajProfile.tipMoto
                  }**`,
                );

              message = await message.edit({
                embeds: [newEmbed],
                content: `${message.content} ${TOTAL_MIN}`,
                components: [],
              });

              await pontajMoto.deleteOne({ _id: pontajProfile._id });

              interaction.reply({
                ephemeral: true,
                content: `Ti-ai inchis pontajul!\n ${message.url}`,
              });

              break;
            }
          }

          break;
        }
        default: {
          await interaction.reply(
            "There was an error while executing this command!",
          );
          throw new Error("Invalid subcommand");
        }
      }
    } catch (error) {
      console.log(error);
    }
  },
};
