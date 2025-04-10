const config = require('../../config.js')
const BaseCommand = require("../../core/Command");
const fs = require("fs");
const { statSync, readdirSync } = require("fs");
const discord = require('discord.js')
const { QuickDB } = require('quick.db');
const db = new QuickDB();

module.exports = class Example extends BaseCommand {
    name = 'help';
    aliases = ['хелп', 'Help', 'Хелп', 'Помощь', 'помощь', 'команды', 'Команды', 'Commands', 'commands'];
    description = 'Информация о боте';
    type = [discord.ApplicationCommandType.ChatInput, 'text'];
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

        if (!(await checkPremiumStatus(interaction.guild.id))) {
            const embed = new discord.EmbedBuilder()
                .setColor(config.color)
                .setTitle('Ошибка')
                .setDescription('На этом сервере нет Premium-статуса!')
                .setTimestamp();

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        let categoriesNames = [
            { emoji: `👾`, name: "Мини-Игры", desc: `Наши мини-игры!`, dir: "games" },
            { emoji: `👑`, name: "Premium", desc: `Команды, доступные с Premium`, dir: "premium" },
        ]

        let commands = [];
        fs.readdirSync(`./commands/`).forEach(dir => {
            fs.readdirSync(`./commands/${dir}`).filter(c => c.endsWith('.js')).forEach(command => {
                let cmd = new (require(`../../commands/${dir}/${command}`))();
                commands.push({
                    name: cmd.name || command.split(".")[0],
                    description: cmd.description || "Описания команды нет",
                    premium: cmd.premium,
                    category: categoriesNames.find(cat => cat.dir == dir),
                })
            })
        })

        const row = new discord.ActionRowBuilder()
            .addComponents(
                new discord.StringSelectMenuBuilder()
                    .setCustomId('select')
                    .setPlaceholder('Выберите категорию')
                    .setMinValues(1)
                    .setMaxValues(1)
                    .addOptions(categoriesNames.map(c => { return { label: c.name, emoji: c.emoji, description: c.desc, value: c.dir } })),
            );

        const makeEmbed = (allCommands, categoryId, categories) => {
            const category = categories.find(c => c.dir == categoryId)
            const commands = allCommands.filter(c => c.category?.dir == category.dir);
            return new discord.EmbedBuilder()
                .setColor(config.color)
                .setTitle(`${category.name} ${category.emoji}`)
                .setDescription(commands.map(command => `» \`/${command.name}\` - ${command.description}`).join("\n"))
                .addFields(
                    { name: 'Сервер поддержки', value: `[Перейти](https://discord.com/invite/G686uM7KWQ)`, inline: true },
                    { name: 'Наш сайт', value: `[Перейти](https://neroustudio.ru/)`, inline: true },
                )
        }

        const helpEmbed = new discord.EmbedBuilder()
            .setAuthor({ name: `Список команд ${client.user.username}`, iconURL: interaction.client.user.displayAvatarURL() })
            .setColor(config.color)
            .setDescription(`>>> **${client.user.username}** - дискорд бот, разработанный по заказу **NerouStudio** 
у разработчика \`@isvior\`, наделённый на улучшение вашего сервера в развлекательном контенте !

**О нас:**
[Сервер поддержки](https://discord.com/invite/G686uM7KWQ) ・ [Наш сайт](https://neroustudio.ru/)`)
            .setFooter({ text: "NerouStudio" })
            .setTimestamp();

        const msg = interaction.reply({ embeds: [helpEmbed], components: [row], fetchReply: true }).then(async m => {

            const filter = (i) => !i.user.bot
            const collector = m.createMessageComponentCollector({ time: 600000, componentType: discord.ComponentType.StringSelectMenuBuilder })
            collector.on("collect", (interaction) => {
                interaction.reply({ embeds: [makeEmbed(commands, interaction.values[0], categoriesNames)], ephemeral: true });
            });
        })
    }
}