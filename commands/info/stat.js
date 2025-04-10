const config = require('../../config.js')
const BaseCommand = require("../../core/Command");
const discord = require('discord.js')
const { QuickDB } = require('quick.db');
const db = new QuickDB();

module.exports = class Example extends BaseCommand {
    name = 'stat';
    aliases = ['Bot', 'Stat', 'bot', 'state', 'statistic', 'стата', 'бот', 'статистика'];
    description = 'Информация о боте';
    type = [discord.ApplicationCommandType.ChatInput, 'text'];
    bot_permissions = [];
    user_permissions = [];
    options = [];
    components_ids = [];
    cooldown = 5;
    async execute(client, interaction, options) {

        const totalGuilds = client.guilds.cache.size;
        const totalUsers = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
        const ping = client.ws.ping;

        const button = new discord.ButtonBuilder()
            .setURL('https://discord.com/invite/G686uM7KWQ')
            .setLabel('Поддержка')
            .setEmoji(`🛡`)
            .setStyle(discord.ButtonStyle.Link);
        const button1 = new discord.ButtonBuilder()
            .setURL('https://neroustudio.ru/')
            .setLabel('Сайт')
            .setEmoji(`📗`)
            .setStyle(discord.ButtonStyle.Link);
        const buttons = new discord.ActionRowBuilder()
            .addComponents(button)
            .addComponents(button1);

        const embed = new discord.EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('Статистика бота')
            .setThumbnail(client.user.displayAvatarURL())
            .addFields(
                { name: 'Серверов', value: `${totalGuilds}`, inline: true },
                { name: 'Пользователей', value: `${totalUsers}`, inline: true },
                { name: 'Пинг', value: `${ping}ms`, inline: true },
            )
            .setTimestamp()
            .setFooter({ text: 'Статистика обновлена' });

        await interaction.reply({ embeds: [embed], components: [buttons] })

    }
}