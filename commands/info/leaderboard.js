const config = require('../../config.js');
const BaseCommand = require("../../core/Command");
const discord = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

module.exports = class LeaderboardCommand extends BaseCommand {
    name = 'leaderboard';
    aliases = ['топ', 'лидеры'];
    description = 'Показать таблицу лидеров по количеству побед';
    type = [discord.ApplicationCommandType.ChatInput];
    bot_permissions = [];
    user_permissions = [];
    options = [];
    components_ids = [];
    cooldown = 5;

    async execute(client, interaction) {
        // Получаем всех пользователей и их победы из базы данных
        let leaderboard = await this.getLeaderboard();

        // Формируем описание таблицы лидеров
        let description = '';
        if (leaderboard.length === 0) {
            description = 'К сожалению, лидеров сейчас нет.';
        } else {
            for (let i = 0; i < leaderboard.length; i++) {
                const user = leaderboard[i];
                const place = i + 1;
                const emoji = this.getEmojiForPlace(place);
                description += `${emoji} **${place}.** ${user.name}: \`${user.wins}\` побед\n`;
            }
            if (leaderboard.length < 12) {
                description += `\nВсего лидеров: ${leaderboard.length}`;
            }
        }

        const embed = new discord.EmbedBuilder()
            .setColor(config.color)
            .setTitle('Таблица лидеров')
            .setDescription(description)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }

    async getLeaderboard() {
        const userKeys = await db.all(); // Получаем все ключи из базы данных
        const users = userKeys
            .filter(key => key.id.startsWith('userWins_')) // Фильтруем ключи, относящиеся к победам пользователей
            .map(key => {
                return db.get(key.id).then(wins => ({
                    id: key.id.replace('userWins_', ''),
                    wins: wins
                }));
            });

        const results = await Promise.all(users); // Ожидаем выполнения всех запросов

        // Сортируем пользователей по количеству побед в порядке убывания
        const sortedUsers = results
            .map(user => ({
                name: `<@${user.id}>`,
                wins: user.wins
            }))
            .sort((a, b) => b.wins - a.wins)
            .slice(0, 12); // Берем топ 12 пользователей

        return sortedUsers;
    }

    getEmojiForPlace(place) {
        switch (place) {
            case 1: return '🥇 ';
            case 2: return '🥈 ';
            case 3: return '🥉 ';
            default: return `${place}. `;
        }
    }
};
