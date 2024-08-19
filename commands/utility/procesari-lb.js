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
    .setName("procesari-lb")
    .setDescription("Verifica leaderboard-ul procesarilor"),
  conducere: true,
  async execute(interaction, client) {
    try {
      await interaction.deferReply();
  
      let data = await insigne.find({});
      let members = [];
  
      for (let obj of data) {
        if (interaction.guild.members.cache.map((member) => member.id).includes(obj.userId)) members.push(obj);
      }
  
      const embed = new EmbedBuilder().setTitle('Procesari Leaderboard').setColor('Orange')
  
      members = members.sort(function (b,a) {
        return a.procesari - b.procesari
      })
  
      members = members.filter(function (value) {
        return value.procesari > 0
      })
  
      let pos = 0;
  
      members = members.slice(0,10)
      let desc = '';
  
      for (let i = 0; i < members.length; i++) {
        let user = interaction.guild.members.cache.get(members[i].userId);
        if (!user) return;
        let bal = members[i].procesari
        desc += `${i+1}. ${user} - ${bal} ${bal === 1 ? 'procesare' : 'procesari'}\n`
      }

      desc = desc ? desc : 'Nu s-a facut nicio procesare recenta!'
  
      embed.setDescription(desc)
        
      await interaction.editReply({ embeds: [embed] })
      
    } catch (error) {
      console.log(`[PROCESARI_LB_ERROR]:\n${error}`);
    }
  },
};
