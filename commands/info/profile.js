const BaseCommand = require("../../core/Command");
const discord = require('discord.js');
const config = require('../../config.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

module.exports = class Example extends BaseCommand {
    name = 'profile';
    description = 'Просмотреть профиль участника';
    type = [discord.ApplicationCommandType.ChatInput];
    bot_permissions = [];
    user_permissions = [];
    options = [
        {
            name: "ник", // Название опции (обязательно)
            description: "Введите ник участника или оставьте поле пустым", // Описание опции (обязательно)
            type: discord.ApplicationCommandOptionType.User,
            required: false
        }
    ];
    components_ids = [];
    cooldown = 5;
    async execute(client, interaction, options) {
        async function checkPremiumStatus(guildId) {
            try {
                return await db.get(`premium_${guildId}`);
            } catch (error) {
                return false;
            }
        }

        if (!(await checkPremiumStatus(interaction.guild.id))) {
            const embed = new discord.EmbedBuilder()
                .setColor(config.color)
                .setTitle('Ошибка')
                .setDescription('На этом сервере нет Premium-статуса!')
                .setTimestamp();

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const target = interaction.options.getMember("ник") || interaction.member;
        let currentPoints = await db.get(`userWins_${target.id}`) || 0;

        const helpEmbed = new discord.EmbedBuilder()
            .setTitle(`Профиль пользователя`)
            .setColor(config.color)
            .setDescription(`Пользователь: **${target.user.username}**
Побед: **${currentPoints}**`)
            .setFooter({ text: "Профиль с информацией", iconURL: client.user.displayAvatarURL() });

        await interaction.reply({ embeds: [helpEmbed], fetchReply: true });
    }
};
