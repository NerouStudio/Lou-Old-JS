const config = require('../../config.js');
const BaseCommand = require("../../core/Command");
const discord = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

module.exports = class WordGameCommand extends BaseCommand {
    name = 'word-game';
    aliases = ['игра-в-слова'];
    description = 'Начать игру "Игра в слова"';
    type = [discord.ApplicationCommandType.ChatInput];
    bot_permissions = [];
    user_permissions = [];
    options = [];
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

        async function getPremiumGiverId(guildId) {
            try {
                return await db.get(`premiumGiver_${guildId}`);
            } catch (error) {
                return null;
            }
        }

        async function isPremiumGiverValid(userId, guildId) {
            const premiumGiverId = await getPremiumGiverId(guildId);
            if (!premiumGiverId) return false;

            const premiumGuildId = config.premiumGUILDID;
            const premiumRoleId = config.RolePremiumID;

            try {
                const guild = await client.guilds.fetch(premiumGuildId);
                const member = await guild.members.fetch(premiumGiverId);
                return member.roles.cache.has(premiumRoleId);
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

        if (!(await isPremiumGiverValid(interaction.user.id, interaction.guild.id))) {
            await db.delete(`premium_${interaction.guild.id}`);
            await db.delete(`premiumGiver_${interaction.guild.id}`);
            const embed = new discord.EmbedBuilder()
                .setColor(config.color)
                .setTitle('Ошибка')
                .setDescription('Премиум статус сервера был удален, так как роль у выдавшего пользователя пропала.')
                .setTimestamp();
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const filter = response => {
            return response.author.id === interaction.user.id && /^[а-яё]+$/i.test(response.content);
        };

        const embed = new discord.EmbedBuilder()
            .setColor(config.color)
            .setTitle('Игра в слова')
            .setDescription('Напишите **первое слово** для начала игры.\nУ вас есть 2 минуты для создания своего лобби.\n\n**Внимание:** слова на буквы \`ь\`, \`ъ\`, \`ы\`, \`й\` не засчитываются при старте игры!')
            .setTimestamp();

        const endButton = new discord.ActionRowBuilder()
            .addComponents(
                new discord.ButtonBuilder()
                    .setCustomId('end_game')
                    .setLabel('Завершить игру')
                    .setStyle(discord.ButtonStyle.Danger)
            );

        await interaction.reply({ embeds: [embed], components: [endButton] });

        const collector = interaction.channel.createMessageCollector({ filter, time: 2 * 60 * 1000, max: 1 });

        collector.on('collect', message => {
            const firstWord = message.content.trim().toLowerCase();
            if (this.isValidWord(firstWord)) {
                this.startGame(client, interaction, firstWord, embed, endButton, message.author.id);
            } else {
                interaction.followUp({ content: 'Первое слово некорректно. Пожалуйста, введите другое слово.\nСлова на буквы \`ь\`, \`ъ\`, \`ы\`, \`й\` не засчитываются!', ephemeral: true });
            }
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                interaction.followUp({ content: 'Время ожидания истекло. Игра не началась.', ephemeral: true });
            }
        });
    }

    getLastLetter(word) {
        const invalidLetters = ['ь', 'ъ', 'ы', 'й'];
        let lastLetter = word.slice(-1);

        while (invalidLetters.includes(lastLetter) && word.length > 1) {
            word = word.slice(0, -1);
            lastLetter = word.slice(-1);
        }

        if (invalidLetters.includes(lastLetter)) {
            return null;
        }

        return lastLetter;
    }

    isValidWord(word) {
        const invalidLetters = ['ь', 'ъ', 'ы', 'й'];
        const validLetters = word.split('').filter(char => !invalidLetters.includes(char));
        return validLetters.length > 0;
    }

    async startGame(client, interaction, firstWord, embed, endButton, firstUserId) {
        let currentWord = firstWord;
        let lastLetter = this.getLastLetter(currentWord);
        if (!lastLetter) {
            interaction.followUp({ content: 'Первое слово некорректно. Игра завершена.', ephemeral: true });
            return;
        }
        let users = {};
        let gameEnded = false;
        let usedWords = new Set();

        users[firstUserId] = { count: 1, name: interaction.user.username };
        usedWords.add(currentWord);

        embed.setDescription(`Первое слово: **${firstWord}**. Следующее слово должно начинаться на букву **${lastLetter.toUpperCase()}**.`);

        await interaction.editReply({ embeds: [embed], components: [endButton] });

        const filter = response => {
            const word = response.content.trim().toLowerCase();
            return /^[а-яё]+$/i.test(word) && word.startsWith(lastLetter) && !usedWords.has(word);
        };

        const collector = interaction.channel.createMessageCollector({ filter, time: 5 * 60 * 1000 });

        collector.on('collect', message => {
            if (gameEnded) return;

            const word = message.content.trim().toLowerCase();
            currentWord = word;
            lastLetter = this.getLastLetter(currentWord);

            if (!lastLetter) {
                gameEnded = true;
                this.endGame(interaction, users, `Слово **${word}** некорректно. Игра завершена.`, embed);
                return;
            }

            if (!users[message.author.id]) {
                users[message.author.id] = { count: 0, name: message.author.username };
            }

            users[message.author.id].count += 1;
            usedWords.add(currentWord);

            embed.setDescription(`Последнее слово: **${currentWord}**. Следующее слово должно начинаться на букву **${lastLetter.toUpperCase()}**.`);
            interaction.editReply({ embeds: [embed] });
        });

        collector.on('end', (collected, reason) => {
            if (!gameEnded && reason === 'time') {
                this.endGame(interaction, users, 'Время игры истекло.', embed);
            }
        });

        client.on('interactionCreate', async i => {
            if (!i.isButton()) return;
            if (i.customId === 'end_game') {
                if (i.user.id !== interaction.user.id) {
                    await i.reply({ content: 'Вы не можете завершить эту игру.', ephemeral: true });
                    return;
                }
                gameEnded = true;
                collector.stop('ended_by_user');
                this.endGame(interaction, users, 'Игра завершена пользователем.', embed);
            }
        });

    }

    async endGame(interaction, users, reason, embed) {
        let leaderboard = 'Результаты игры:\n\n';
        let maxCount = 0;
        let winnerId = null;

        for (const userId in users) {
            leaderboard += `${users[userId].name}: \`${users[userId].count}\` слов\n`;
            if (users[userId].count > maxCount) {
                maxCount = users[userId].count;
                winnerId = userId;
            } else if (users[userId].count === maxCount) {
                winnerId = null;
            }
        }

        // Засчитываем победу только победителю
        if (Object.keys(users).length > 1 && winnerId) {
            let userWins = await db.get(`userWins_${winnerId}`) || 0;
            await db.set(`userWins_${winnerId}`, userWins + 1);
        }

        embed
            .setTitle('Игра в слова завершена')
            .setDescription(reason)
            .setFields({ name: 'Лидеры', value: leaderboard });  // Используем setFields вместо addFields

        // Удаление кнопки из старого сообщения
        try {
            await interaction.deleteReply();
        } catch (error) {
            if (error.code !== 10008) { // Код 10008 означает, что сообщение неизвестно (удалено)
                console.error('Ошибка при удалении сообщения:', error);
            }
        }

        // Отправка нового сообщения с результатами
        await interaction.followUp({ embeds: [embed], components: [] });
    }

}
