const config = require('../../config.js');
const BaseCommand = require("../../core/Command");
const discord = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

module.exports = class LettersGameCommand extends BaseCommand {
    name = 'letters_game';
    aliases = ['слова'];
    description = 'Игра в "Слова из букв"';
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

        const wordSets = [
            { letters: 'ТЕРАНО', words: ["тонер", "арена", "ранет", "терна", "отрез", "ронет", "торен", "рано", "арте", "нота", "рента"] },
            { letters: 'ЛИМОНА', words: ["малин", "монал", "илона", "ламин", "ломан", "милан", "налом", "омни", "минол", "манил"] },
            { letters: 'ПАРТИН', words: ["парни", "тиран", "пати", "принт", "трина", "рита", "паран", "арин", "напи", "натри", "парин", "рипан"] },
            { letters: 'БУРАНИ', words: ["буран", "набир", "уран", "арбин", "бари", "ранбу", "ранби", "раби", "аруби", "нибур", "нари", "банир"] },
            { letters: 'КОРИНА', words: ["икона", "арко", "кари", "аник", "крон", "конар", "орна", "ронка", "нарко", "акрон", "корн", "крона"] },
            { letters: 'СТРЕЛА', words: ["треса", "салет", "арест", "латер", "релат", "талес", "лесат", "расте", "тралс", "летар", "старе", "алет", "серт"] },
            { letters: 'ГРАНИТ', words: ["триган", "грант", "тинг", "гран", "натри", "тринг", "тангр", "инграт", "тран", "грант", "ганти", "гартин", "артин"] },
            { letters: 'ЛЕНТРА', words: ["лентр", "тарел", "антре", "рента", "ларен", "трен", "рален", "натре", "летар", "лент", "терал", "налет", "нетра"] },
            { letters: 'ФИЛЬМА', words: ["флиам", "ламфи", "лифам", "лифма", "малиф", "афли", "филам", "алиф", "алфи", "мафил", "ифал", "ифма"] },
            { letters: 'ВОДОЛЬ', words: ["волдо", "одоло", "долов", "водло", "ловдо", "длово", "олдво", "ловод", "одлов", "вод", "одлов", "ловод", "воло", "волд"] },
            { letters: 'МИЛТАН', words: ["мали", "литан", "тали", "налти", "алмин", "минал", "тмин", "ланти", "мант", "манил", "тнал", "тиман", "лмин"] },
            { letters: 'КАЛИНА', words: ["канал", "ланка", "акан", "накал", "лика", "лакана", "кала", "анил", "анка", "инал", "кал", "нака", "алик", "лин"] },
            { letters: 'СПИРИТ', words: ["риспи", "типси", "трип", "прит", "сприт", "рипс", "триси", "трис", "ипси", "тисп", "рипти", "тирс"] },
            { letters: 'ТЕРАНД', words: ["дент", "дрет", "ранте", "терд", "нарте", "ранде", "детар", "трена", "тре", "анд", "тране", "редан", "трен", "дар"] },
            { letters: 'РАКУША', words: ["арка", "каур", "урак", "акра", "шура", "кашур", "крау", "акар", "куша", "каша", "крау", "краш", "урак"] },
            { letters: 'БЛИНОК', words: ["киноб", "олик", "облик", "блино", "никоб", "клино", "колин", "конби", "нокли", "нобли", "бикол", "килон", "билок"] },
            { letters: 'ДРОЛИК', words: ["дилок", "докир", "ролик", "лидок", "клидор", "колди", "докли", "родик", "лидор", "кролд", "дрик", "кодил", "колрид"] },
            { letters: 'ПИЛАРТ', words: ["триал", "арит", "латри", "прал", "латир", "тлари", "артил", "тари", "литар", "липат", "раил", "латир", "патри"] },
            { letters: 'НОТЕЛА', words: ["алент", "тлон", "нетол", "лоне", "латен", "алет", "лотан", "отле", "олан", "лонат", "тле", "нолат", "енот"] },
            { letters: 'ГЛАРИМ', words: ["граил", "ларим", "римал", "алгри", "грамил", "лирам", "магил", "агрил", "гали", "алгри", "лирам", "рилма", "гил"] },
            { letters: 'СМИРАТ', words: ["трис", "тирам", "мират", "атис", "арми", "сатир", "тир", "сати", "тарис", "сарми", "тамис", "арти"] },
            { letters: 'КАТЛАН', words: ["натал", "такал", "тал", "нал", "калат", "катал", "атлан", "лат", "ланкат", "така", "лакта", "нта", "катла"] },
            { letters: 'ПАНТИК', words: ["панти", "таник", "питка", "патик", "таник", "капти", "пант", "антик", "кант", "натик", "танпи", "пан", "тикап"] },
            { letters: 'КРАТИЛ', words: ["катир", "рикал", "акрти", "краил", "акрит", "литар", "катир", "тирлак", "алкир", "трикал", "арит", "арилт"] },
            { letters: 'СЕПЛИН', words: ["несп", "плин", "слен", "пелин", "лепин", "синп", "непил", "пенил", "плес", "снип", "ленп", "непси"] },
            { letters: 'ЛОРМАТ', words: ["лотар", "ротал", "молар", "армот", "тарол", "латро", "латор", "млотар", "ларом", "омал", "толар", "матрол"] },
            { letters: 'ТАЛЬМИ', words: ["матли", "тилма", "мали", "миль", "лима", "талим", "мити", "тильма", "латим", "тали", "талим", "тми"] },
            { letters: 'САЛТАН', words: ["танал", "насал", "танас", "алст", "ланта", "санал", "ласт", "алнат", "натал", "талс", "насал", "алстан"] },
            { letters: 'КОРМЕН', words: ["ромен", "корм", "мекон", "нер", "ормен", "мор", "мек", "нер", "ром", "ромен", "кор", "мекн", "рен", "мок"] },
            { letters: 'ДЕЛКАР', words: ["радел", "лера", "дера", "калер", "ледар", "адер", "ладер", "дел", "ракд", "дер", "радел", "кара", "дер", "лка"] },
            { letters: 'ТРАНИК', words: ["рита", "тиран", "карин", "нарт", "канти", "наирт", "натир", "трина", "тарин", "арит", "инат", "кинат"] },
            { letters: 'ЛИМАРТ', words: ["митар", "талар", "ритам", "малит", "латим", "арлим", "трилам", "тирлам", "лимар", "марли", "лартим"] },
            { letters: 'ФИЛАНТ', words: ["линат", "талин", "натил", "тлина", "алтин", "налти", "флинат", "тинал", "натил", "алин", "тина", "линта"] },
            { letters: 'ПАРТЕН', words: ["рент", "тарен", "нарет", "парн", "перт", "таре", "енар", "терп", "пран", "тенар", "терн", "прета", "трепа"] },
            { letters: 'БАЛТИК', words: ["тикла", "катил", "лабит", "ликат", "балик", "блатик", "кат", "тибал", "тали", "катиб", "балит", "ликат"] },
            { letters: 'ТРИПАН', words: ["тиран", "панти", "пати", "тран", "парт", "парти", "арти", "напр", "тирн", "трпан", "нарт", "прат", "патри"] },
            { letters: 'КРОМИН', words: ["микон", "роки", "корни", "мон", "рник", "карин", "римон", "никор", "корм", "нок", "минкор", "ркни", "кон"] },
            { letters: 'ДЕЛИНА', words: ["лент", "ани", "делина", "неда", "лент", "андел", "нател", "адил", "делан", "деан", "танд", "лени", "дни"] },
            { letters: 'ТЕРАНД', words: ["тренд", "дена", "антре", "реда", "натре", "рент", "нарт", "дет", "трена", "ент", "ред", "нард", "тре"] },
            { letters: 'ТАЛМИК', words: ["малик", "тикал", "клат", "тали", "клим", "катли", "тилк", "клат", "калит", "тилам", "алит", "кат"] },
            { letters: 'БЕЛТАН', words: ["нат", "банлет", "бен", "леб", "тален", "лат", "анте", "нал", "летаб", "табен", "балет", "лебан"] },
            { letters: 'ГОРИНТ', words: ["ринг", "трон", "горт", "тронг", "ингор", "трон", "ранг", "орт", "рин", "тинг", "нгор", "тор", "ронт"] },
            { letters: 'КЛИМОН', words: ["микол", "климон", "кол", "лик", "микол", "комил", "комн", "колми", "лим", "кимол", "лик", "лико"] },
            { letters: 'ГЕНАРТ', words: ["ранет", "ген", "тарен", "ран", "трен", "нат", "генра", "тран", "гар", "терг", "нарт", "трена"] },
            { letters: 'НЕКТИР', words: ["нетир", "кинт", "терик", "нтер", "трин", "кир", "рек", "нитр", "тенк", "терк", "нет", "тинр"] },
            { letters: 'СТОЛАР', words: ["старл", "лотар", "трал", "рос", "лост", "арт", "рол", "тола", "сар", "лотар", "солар"] },
            { letters: 'ДАРИТИ', words: ["арти", "арит", "рат", "дитри", "тари", "тари", "ира", "ради", "рат", "итра", "тир", "даир"] },
            { letters: 'КАТАРМ', words: ["такар", "макар", "акрам", "атмак", "кра", "рака", "там", "тарак", "акта", "трак", "карт", "рамк"] }
        ];

        const button = new discord.ButtonBuilder()
            .setCustomId('letters_game_answer')
            .setLabel('Ответить')
            .setStyle(discord.ButtonStyle.Success);
        const otvet = new discord.ActionRowBuilder()
            .addComponents(button);

        const selectedSet = wordSets[Math.floor(Math.random() * wordSets.length)];
        const { letters, words } = selectedSet;

        let guessedWords = [];
        const customTimeMs = 2.5 * 60 * 1000; // 2.5 минуты
        const futureTime = Date.now() + customTimeMs;
        const timeForDiscord = `<t:${Math.floor(futureTime / 1000)}:R>`;

        let embed = new discord.EmbedBuilder()
            .setColor(config.color)
            .setTitle('Игра в слова из букв')
            .setDescription(`Игра началась!` +
                `\nНеобходимо составить слова из букв: \`${letters}\`` +
                `\n**Угаданные слова:**\n${guessedWords.map(g => `\`${g.word}\` ( <@${g.username}> )`).join('\n')}` +
                `\n\nИгра закончится: ${timeForDiscord}`
            );

        try {
            const message = await interaction.reply({ components: [otvet], embeds: [embed], fetchReply: true });

            const collector = message.createMessageComponentCollector({ time: customTimeMs });

            collector.on('collect', async x => {
                if (x.customId === 'letters_game_answer') {
                    if (words.length === 0) {
                        const guessedWordsStr = guessedWords.map(g => `\`${g.word}\` ( <@${g.username}> )`).join('\n');

                        await x.reply({ content: 'Вы угадали все слова!\nИгра завершена.', ephemeral: true });

                        let endEmbed = new discord.EmbedBuilder()
                            .setColor(config.color)
                            .setTitle('Игра окончена')
                            .setDescription(`**Все слова отгаданы!**\nСлова, которые были угаданы:\n${guessedWordsStr}`);

                        await interaction.editReply({ embeds: [endEmbed], components: [] });
                        collector.stop();

                        return;
                    }

                    const modal = new discord.ModalBuilder()
                        .setCustomId('ModalLettersGame')
                        .setTitle('Слова из букв');

                    const name = new discord.TextInputBuilder()
                        .setCustomId('name')
                        .setLabel('Напишите слово, которое угадали')
                        .setPlaceholder(`Необходимо составить слова из букв: ${letters}`)
                        .setMaxLength(18)
                        .setMinLength(2)
                        .setStyle(discord.TextInputStyle.Short)
                        .setRequired(true);

                    const secondActionRow = new discord.ActionRowBuilder().addComponents(name);
                    modal.addComponents(secondActionRow);

                    await x.showModal(modal);

                    const modal_interaction = await x.awaitModalSubmit({ filter: i => i.customId === 'ModalLettersGame', time: 15 * 60 * 1000 });

                    if (!modal_interaction) {
                        await x.reply({ content: 'Время ожидания истекло. Попробуйте снова.', ephemeral: true });
                        return;
                    }

                    const inputWord = modal_interaction.fields.getTextInputValue('name').toLowerCase().trim();

                    if (!words.includes(inputWord) || guessedWords.some(g => g.word === inputWord)) {
                        await modal_interaction.reply({ content: 'Неправильное слово или уже угадано. Попробуйте снова.', ephemeral: true });
                        return;
                    }

                    guessedWords.push({ word: inputWord, username: modal_interaction.user.id });

                    const index = words.indexOf(inputWord);
                    if (index !== -1) {
                        words.splice(index, 1);
                    }

                    const guessedWordsStr = guessedWords.map(g => `\`${g.word}\` ( <@${g.username}> )`).join('\n');

                    embed.setDescription(`Игра началась!` +
                        `\nНеобходимо составить слова из букв: \`${letters}\`` +
                        `\n**Угаданные слова:**\n${guessedWordsStr}` +
                        `\n\nИгра закончится: ${timeForDiscord}`
                    );

                    await interaction.editReply({ embeds: [embed], components: [otvet] });
                    await modal_interaction.deferUpdate();
                }
            });

            collector.on('end', async collected => {
                const guessedWordsStr = guessedWords.length > 0 ? guessedWords.map(g => `\`${g.word}\` ( <@${g.username}> )`).join('\n') : 'Никто не угадал ни одного слова.';

                let endEmbed = new discord.EmbedBuilder()
                    .setColor(config.color)
                    .setTitle('Игра окончена')
                    .setDescription(`**Время вышло!**\nСлова, которые были угаданы:\n${guessedWordsStr}`);

                await interaction.editReply({ embeds: [endEmbed], components: [] }).catch(console.error);

                // Подсчет побед
                if (guessedWords.length > 0) {
                    const userScores = guessedWords.reduce((acc, g) => {
                        if (!acc[g.username]) acc[g.username] = 0;
                        acc[g.username]++;
                        return acc;
                    }, {});

                    const maxScore = Math.max(...Object.values(userScores));
                    const winners = Object.entries(userScores).filter(([user, score]) => score === maxScore).map(([user]) => user);

                    for (const userId of winners) {
                        let currentWins = await db.get(`userWins_${userId}`) || 0;
                        await db.set(`userWins_${userId}`, currentWins + 1);
                    }

                    await interaction.followUp({ content: `Игра завершена! Победители: ${winners.map(id => `<@${id}>`).join(', ')}. Поздравляем!`, ephemeral: true });
                }
            });

        } catch (error) {
            console.error('Произошла ошибка во время выполнения команды letters_game:', error);
            interaction.reply({ content: 'Произошла ошибка во время выполнения команды.', ephemeral: true }).catch(console.error);
        }
    }
};
