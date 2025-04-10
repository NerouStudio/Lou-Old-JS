const BaseCommand = require("../../core/Command.js");
const discord = require('discord.js');
const config = require('../../config.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

module.exports = class Example extends BaseCommand {
    name = 'remove_premium';
    description = 'Убрать премиум статус у сервера';
    type = [discord.ApplicationCommandType.ChatInput];
    bot_permissions = [];
    user_permissions = [discord.PermissionsBitField.Flags.Administrator];
    options = [
        {
            name: "id",
            description: "ID сервера",
            type: discord.ApplicationCommandOptionType.String,
            required: true
        }
    ];
    components_ids = [];
    cooldown = 5;

    async execute(client, interaction) {
        let user = interaction.member.user;
        const serverId = interaction.options.getString('id');

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
        if (!(await checkPremiumRole(interaction.user.id, premiumGuildId, premiumRoleId))) {
            const embed = new discord.EmbedBuilder()
                .setColor(config.color)
                .setTitle('Ошибка')
                .setDescription('У вас нет Premium-роли, вы не можете выдать Premium серверу.')
                .setTimestamp();

            return interaction.reply({ embeds: [embed], ephemeral: true });
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

        const isPremium = await db.get(`premium_${serverId}`);
        const premiumGiver = await db.get(`premiumGiver_${serverId}`);

        if (!isPremium) {
            const embed = new discord.EmbedBuilder()
                .setColor(config.color)
                .setTitle('Ошибка')
                .setDescription(`Сервер с ID ${serverId} не имеет премиум-статуса.`)
                .setTimestamp();

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (premiumGiver !== user.id) {
            const embed = new discord.EmbedBuilder()
                .setColor(config.color)
                .setTitle('Ошибка')
                .setDescription(`Вы не являетесь пользователем, который выдал премиум-статус этому серверу.`)
                .setTimestamp();

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        await db.delete(`premium_${serverId}`);
        await db.delete(`givedPremServer_${user.id}`);
        await db.delete(`premiumGiver_${serverId}`);

        let embed = new discord.EmbedBuilder()
            .setTitle('Успех')
            .setColor(config.color)
            .setDescription(`Сервер с ID ${serverId} теперь **не имеет** премиум-статуса!`);
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
