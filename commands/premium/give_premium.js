const BaseCommand = require("../../core/Command.js");
const discord = require('discord.js');
const config = require('../../config.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

module.exports = class GivePremiumCommand extends BaseCommand {
    name = 'give_premium';
    description = 'Выдать Premium одному из серверов';
    type = [discord.ApplicationCommandType.ChatInput];
    bot_permissions = [];
    user_permissions = [];
    options = [
        {
            name: "id",
            description: "ID сервера, которому выдать премиум",
            type: discord.ApplicationCommandOptionType.String,
            required: true
        }
    ];
    components_ids = [];
    cooldown = 5;

    async execute(client, interaction) {
        const serverId = interaction.options.getString('id');
        const user = interaction.user;

        async function checkPremiumRole(userId, guildId, roleId) {
            try {
                const guild = await client.guilds.fetch(guildId);
                const member = await guild.members.fetch(userId);
                return member.roles.cache.has(roleId);
            } catch (error) {
                return false;
            }
        }

        const premiumGuildId = config.premiumGUILDID;
        const premiumRoleId = config.RolePremiumID;
        if (!(await checkPremiumRole(user.id, premiumGuildId, premiumRoleId))) {
            const embed = new discord.EmbedBuilder()
                .setColor(config.color)
                .setTitle('Ошибка')
                .setDescription('У вас нет Premium-роли, вы не можете выдать Premium серверу.')
                .setTimestamp();

            // Отправляем сообщение только пользователю, вызвавшему команду
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        let guild;
        try {
            guild = await client.guilds.fetch(serverId);
        } catch (error) {
            const embed = new discord.EmbedBuilder()
                .setColor(config.color)
                .setTitle('Ошибка')
                .setDescription(`ID ${serverId} не является валидным ID сервера.`)
                .setTimestamp();

            // Отправляем сообщение только пользователю, вызвавшему команду
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        let checker = await db.get(`givedPremServer_${user.id}`);
        if (checker == 1) {
            const embed = new discord.EmbedBuilder()
                .setColor(config.color)
                .setTitle('Ошибка')
                .setDescription('Ранее вы уже выдавали Premium. Используйте `/remove-premium`, чтобы воспользоваться этой командой снова!')
                .setTimestamp();

            // Отправляем сообщение только пользователю, вызвавшему команду
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        await db.set(`premium_${serverId}`, true);
        await db.set(`givedPremServer_${user.id}`, 1);
        await db.set(`premiumGiver_${serverId}`, user.id);

        // Создаем сообщение для отправки в канал
        const embed1 = new discord.EmbedBuilder()
            .setTitle('Успех')
            .setColor(config.color)
            .setDescription(`Сервер с ID ${serverId} теперь имеет премиум статус!`);

        // Отправляем сообщение только пользователю, вызвавшему команду
        await interaction.reply({ embeds: [embed1], ephemeral: true });

        const embedChannel = new discord.EmbedBuilder()
            .setTitle('NerouStudio | PREMIUM')
            .setColor(config.color)
            .setDescription(`Поздравляем, теперь на этом сервере имеется **PREMIUM** буст :tada:\nБуст выдал - ${user} !`);

        // Отправляем сообщение в канал
        await interaction.channel.send({ embeds: [embedChannel] });

        // Отправляем личное сообщение пользователю
        const embedDM = new discord.EmbedBuilder()
            .setTitle('Вы выдали Premium статус')
            .setColor(config.color)
            .setDescription(`Вы успешно выдали Premium статус серверу **${guild.name}** с ID **${serverId}**.`);

        return user.send({ embeds: [embedDM] });
    }
};
