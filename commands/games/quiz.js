const config = require('../../config.js');
const BaseCommand = require("../../core/Command");
const fs = require('fs');
const path = require('path');
const discord = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

module.exports = class QuizCommand extends BaseCommand {
    name = 'quiz';
    aliases = ['квиз', 'викторина'];
    description = 'Начать викторину';
    type = [discord.ApplicationCommandType.ChatInput];
    bot_permissions = [];
    user_permissions = [];
    options = [];
    components_ids = [];
    cooldown = 3;

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

        await interaction.deferReply();

        const questionsPath = path.join(__dirname, '../../questions.json');

        let questions;
        try {
            const data = fs.readFileSync(questionsPath, 'utf-8');
            questions = JSON.parse(data);
        } catch (error) {
            console.error('Ошибка при чтении или парсинге файла с вопросами:', error);
            await interaction.editReply({ content: 'Произошла ошибка при загрузке вопросов. Пожалуйста, попробуйте позже.', ephemeral: true });
            return;
        }

        if (!Array.isArray(questions) || questions.length === 0) {
            await interaction.editReply({ content: 'Нет доступных вопросов для викторины.', ephemeral: true });
            return;
        }

        const shuffledQuestions = questions.sort(() => Math.random() - 0.5);
        const selectedQuestions = shuffledQuestions.slice(0, 5);

        let currentQuestionIndex = 0;
        const userScores = new Map();

        const sendQuestion = async (question) => {
            const embed = new discord.EmbedBuilder()
                .setColor(config.color)
                .setTitle('Викторина')
                .setDescription(question.question);

            const button = new discord.ButtonBuilder()
                .setCustomId('answer')
                .setLabel('Ответить')
                .setStyle(discord.ButtonStyle.Primary);

            const row = new discord.ActionRowBuilder().addComponents(button);

            await interaction.editReply({ embeds: [embed], components: [row] });
        };

        const checkAnswer = async (modalInteraction) => {
            const userAnswer = modalInteraction.fields.getTextInputValue('answer').toLowerCase().trim();
            const question = selectedQuestions[currentQuestionIndex];

            if (!question) {
                await modalInteraction.reply({ content: 'Произошла ошибка с вопросами. Пожалуйста, попробуйте позже.', ephemeral: true });
                return;
            }

            if (question.answers.some(answer => userAnswer === answer.toLowerCase())) {
                if (!userScores.has(modalInteraction.user.id)) {
                    userScores.set(modalInteraction.user.id, 0);
                }
                userScores.set(modalInteraction.user.id, userScores.get(modalInteraction.user.id) + 1);
            } else {
                await modalInteraction.reply({ content: 'Неправильный ответ.', ephemeral: true });
                return;
            }

            currentQuestionIndex++;
            if (currentQuestionIndex < selectedQuestions.length) {
                await modalInteraction.deferUpdate();
                await sendQuestion(selectedQuestions[currentQuestionIndex]);
            } else {
                await modalInteraction.deferUpdate();
                await endQuiz(interaction, userScores);
            }
        };

        const endQuiz = async (interaction, userScores) => {
            const embed = new discord.EmbedBuilder()
                .setColor(config.color)
                .setTitle('Викторина завершена');

            let leaderboard = 'Результаты викторины:\n\n';
            const sortedScores = [...userScores.entries()].sort((a, b) => b[1] - a[1]);

            if (sortedScores.length > 0) {
                const highestScore = sortedScores[0][1];
                const winners = sortedScores.filter(([userId, score]) => score === highestScore).map(([userId]) => `<@${userId}>`);
                leaderboard += `Победители: ${winners.join(', ')} с ${highestScore} баллами\n`;

                for (const [userId, score] of sortedScores) {
                    if (score === highestScore) {
                        let currentWins = await db.get(`userWins_${userId}`) || 0;
                        await db.set(`userWins_${userId}`, currentWins + 1);
                    }
                }
            } else {
                leaderboard += 'К сожалению, никто не ответил на вопросы.\n';
            }

            embed.setDescription(leaderboard);

            await interaction.editReply({ embeds: [embed], components: [] });
        };

        client.on('interactionCreate', async (modalInteraction) => {
            if (!modalInteraction.isModalSubmit()) return;
            if (modalInteraction.customId === 'quizModal') {
                await checkAnswer(modalInteraction);
            }
        });

        client.on('interactionCreate', async (buttonInteraction) => {
            if (!buttonInteraction.isButton()) return;
            if (buttonInteraction.customId === 'answer') {
                const modal = new discord.ModalBuilder()
                    .setCustomId('quizModal')
                    .setTitle('Ответ на вопрос');

                const answerInput = new discord.TextInputBuilder()
                    .setCustomId('answer')
                    .setLabel('Ваш ответ')
                    .setStyle(discord.TextInputStyle.Short);

                const firstActionRow = new discord.ActionRowBuilder().addComponents(answerInput);
                modal.addComponents(firstActionRow);

                await buttonInteraction.showModal(modal);
            }
        });

        await sendQuestion(selectedQuestions[currentQuestionIndex]);
    }
};
