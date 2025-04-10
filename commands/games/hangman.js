const config = require('../../config.js');
const BaseCommand = require("../../core/Command");
const discord = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

module.exports = class HangmanCommand extends BaseCommand {
    name = 'hangman';
    aliases = ['виселица'];
    description = 'Начать игру "Виселица"';
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

        const wordList = [
            "дом", "машина", "дерево", "река", "компьютер", "собака", "кошка", "книга",
            "учеба", "работа", "музыка", "фильм", "город", "деревня", "школа", "университет",
            "мост", "дорога", "магазин", "парк", "лес", "море", "озеро", "река",
            "горы", "пустыня", "остров", "птица", "рыба", "звезда", "луна", "солнце",
            "планета", "галактика", "вселенная", "атом", "молекула", "химия", "физика", "математика",
            "биология", "история", "география", "литература", "искусство", "музей", "театр", "библиотека",
            "концерт", "спорт", "футбол", "баскетбол", "теннис", "волейбол", "плавание", "бег",
            "велоспорт", "гимнастика", "лыжи", "сноуборд", "коньки", "шахматы", "пазлы", "кроссворд",
            "путешествие", "отпуск", "каникулы", "праздник", "день рождения", "Новый год", "Рождество", "Пасха",
            "хобби", "увлечение", "фотография", "рисование", "музыка", "игры", "видеоигры", "телефон",
            "интернет", "сайт", "социальные сети", "компания", "бизнес", "финансы", "банк", "экономика",
            "политика", "правительство", "закон", "суд", "полиция", "армия", "медицина", "здоровье",
            "болезнь", "лечение", "лекарство", "врач", "медсестра", "больница", "аптека", "спортзал",
            "тренировка", "диета", "питание", "еда", "напитки", "рецепт", "кухня", "ресторан",
            "кафе", "бар", "пицца", "салат", "суп", "мясо", "рыба", "овощи",
            "фрукты", "ягоды", "сладости", "шоколад", "конфеты", "пирог", "торт", "печенье",
            "мороженое", "напитки", "вода", "сок", "чай", "кофе", "молоко", "газировка",
            "вино", "пиво", "коктейль", "напиток", "пейзаж", "портрет", "натюрморт", "архитектура",
            "дизайн", "фотография", "кино", "театр", "музыка", "концерт", "выставка", "галерея",
            "путешествие", "туризм", "отель", "гостиница", "квартира", "дом", "комната", "офис",
            "работа", "карьера", "профессия", "должность", "зарплата", "бонус", "отпуск", "каникулы",
            "образование", "учеба", "школа", "университет", "колледж", "курс", "тренинг", "семинар",
            "книга", "журнал", "газета", "статья", "публикация", "блог", "форум", "социальная сеть",
            "интернет", "сайт", "страница", "блог", "видео", "фото", "изображение", "картинка"
        ];
        const selectedWord = wordList[Math.floor(Math.random() * wordList.length)].toLowerCase();
        let hiddenWord = Array(selectedWord.length).fill('_');
        let incorrectAttempts = 0;
        let guessedLetters = [];
        let currentPage = 0;
        let gameEnded = false;

        const hangmanImages = [
            '```\n\n\n\n\n\n\n```',
            '```\n |\n |\n |\n |\n |\n_|___\n```',
            '```\n  _______\n |\n |\n |\n |\n |\n_|___\n```',
            '```\n  _______\n |/\n |\n |\n |\n |\n_|___\n```',
            '```\n  _______\n |/   |\n |\n |\n |\n |\n_|___\n```',
            '```\n  _______\n |/   |\n |    o\n |\n |\n |\n_|___\n```',
            '```\n  _______\n |/   |\n |    o\n |    |\n |\n |\n_|___\n```',
            '```\n  _______\n |/   |\n |    o\n |   /|\n |\n |\n_|___\n```',
            '```\n  _______\n |/   |\n |    o\n |   /|\\\n |\n |\n_|___\n```',
            '```\n  _______\n |/   |\n |    o\n |   /|\\\n |   /\n |\n_|___\n```',
            '```\n  _______\n |/   |\n |    o\n |   /|\\\n |   / \\\n |\n_|___\n```'
        ];

        const letters = 'абвгдеёжзийклмнопрстуфхцчшщъыьэюя'.split('');

        const getHangmanEmbed = (wordState, attempts) => {
            const hangmanIndex = Math.min(attempts, hangmanImages.length - 1);
            const hangmanImage = hangmanImages[hangmanIndex];
            const displayedWord = wordState.map(char => `\`${char}\``).join(' ');

            return new discord.EmbedBuilder()
                .setColor(config.color)
                .setTitle(`Игра "Виселица"`)
                .setDescription(`**Слово:** ${displayedWord}\n**Неправильные попытки:** ${attempts}`)
                .addFields({ name: 'Виселеца', value: hangmanImage })
                .setFooter({ text: `Используйте кнопки для угадывания букв` })
                .setTimestamp();
        };

        const getButtons = (page) => {
            const rows = [];
            const start = page * 10;
            const end = Math.min(start + 10, letters.length);

            let currentRow = new discord.ActionRowBuilder();
            for (let i = start; i < end; i++) {
                const char = letters[i];
                currentRow.addComponents(
                    new discord.ButtonBuilder()
                        .setCustomId(char)
                        .setLabel(char)
                        .setStyle(discord.ButtonStyle.Secondary)
                );

                if ((i - start + 1) % 5 === 0) {
                    rows.push(currentRow);
                    currentRow = new discord.ActionRowBuilder();
                }
            }

            if (currentRow.components.length > 0) {
                rows.push(currentRow);
            }

            const navRow = new discord.ActionRowBuilder();
            if (page > 0) {
                navRow.addComponents(
                    new discord.ButtonBuilder()
                        .setCustomId('prev_page')
                        .setLabel('⏪')
                        .setStyle(discord.ButtonStyle.Primary)
                );
            }
            if (end < letters.length) {
                navRow.addComponents(
                    new discord.ButtonBuilder()
                        .setCustomId('next_page')
                        .setLabel('⏩')
                        .setStyle(discord.ButtonStyle.Primary)
                );
            }
            rows.push(navRow);

            return rows;
        };


        const initialEmbed = getHangmanEmbed(hiddenWord, incorrectAttempts);

        await interaction.reply({ embeds: [initialEmbed], components: getButtons(currentPage) });

        const filter = (i) => {
            if (i.user.id !== interaction.user.id) {
                let embed2 = new discord.EmbedBuilder()
                    .setTitle('Ошибка')
                    .setColor(config.color)
                    .setDescription('У вас нет доступа к управлению этой игрой.\nИспользуйте: `/hangman`');
                i.reply({ embeds: [embed2], ephemeral: true });
                return false;
            }
            return true;
        };


        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 5 * 60 * 1000 });

        collector.on('collect', async (i) => {
            if (i.customId === 'prev_page') {
                currentPage--;
                await i.update({ components: getButtons(currentPage) });
                return;
            }
            if (i.customId === 'next_page') {
                currentPage++;
                await i.update({ components: getButtons(currentPage) });
                return;
            }

            const guessedLetter = i.customId.toLowerCase();
            if (guessedLetters.includes(guessedLetter)) {
                await i.reply({ content: `Вы уже угадывали букву ${guessedLetter}. Выберите другую.`, ephemeral: true });
                return;
            }

            guessedLetters.push(guessedLetter);
            if (selectedWord.includes(guessedLetter)) {
                for (let j = 0; j < selectedWord.length; j++) {
                    if (selectedWord[j] === guessedLetter) {
                        hiddenWord[j] = guessedLetter;
                    }
                }
            } else {
                incorrectAttempts++;
            }

            const gameEmbed = getHangmanEmbed(hiddenWord, incorrectAttempts);

            if (hiddenWord.join('') === selectedWord) {
                gameEnded = true;
                await i.update({ embeds: [gameEmbed], components: [] });
                collector.stop();

                // Обновление побед для пользователя
                const userId = interaction.user.id;
                let currentWins = await db.get(`userWins_${userId}`) || 0;
                await db.set(`userWins_${userId}`, currentWins + 1);

                await interaction.followUp({ content: `Поздравляем! Вы угадали слово "${selectedWord}" и победили! Игра окончена.`, ephemeral: true });
                return;
            }

            if (incorrectAttempts >= hangmanImages.length - 1) {
                gameEnded = true;
                await i.update({ embeds: [gameEmbed], components: [] });
                collector.stop();
                await interaction.followUp({ content: `Игра окончена. Вы не угадали слово "${selectedWord}".`, ephemeral: true });
                return;
            }

            await i.update({ embeds: [gameEmbed], components: getButtons(currentPage) });
        });

        collector.on('end', (collected, reason) => {
            if (!gameEnded) {
                interaction.followUp({ content: `Игра завершена из-за отсутствия активности. Попробуйте снова.`, ephemeral: true });
            }
        });
    }
};
