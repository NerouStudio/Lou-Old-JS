const config = require('../config.js');
const discord = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

module.exports = async (client) => {

    function getOptionValue(option) {
        if (option.type === discord.ApplicationCommandOptionType.String || option.type === discord.ApplicationCommandOptionType.Integer || option.type === discord.ApplicationCommandOptionType.Number || option.type === discord.ApplicationCommandOptionType.Boolean) {
            return option.value
        } else if (option.type === discord.ApplicationCommandOptionType.User) {
            return option.member
        } else if (option.type === discord.ApplicationCommandOptionType.Channel) {
            return option.channel
        } else if (option.type === discord.ApplicationCommandOptionType.Role) {
            return option.role
        } else if (option.type === discord.ApplicationCommandOptionType.Mentionable) {
            return option.member ?? option.role
        } else if (option.type === discord.ApplicationCommandOptionType.Attachment) {
            return option.attachment
        }
    }

    // Проверка премиум-ролей
    /*async function checkPremiumRole(userId, guildId, roleId) {
        try {
            const guild = await client.guilds.fetch(guildId);
            const member = await guild.members.fetch(userId);
            return member.roles.cache.has(roleId);
        } catch (error) {
            return false;
        }
    }*/

    /*// Проверка премиум-статуса через базу данных
    async function checkPremiumStatus(guildId) {
        try {
            return await db.get(`premium_${guildId}`);
        } catch (error) {
            return false;
        }
    }*/

    client.on('interactionCreate', async interaction => {
        client.events.get('interactionCreate')?.forEach(e => e.execute(interaction));

        if (interaction.isChatInputCommand()) {
            if (!interaction.guild) {
                // Обработка команд в ЛС
                let command = client.commands.find(cmd => cmd.name === interaction.commandName && cmd.type.includes(discord.ApplicationCommandType.ChatInput));
                if (!command) return;

                let options = {};
                interaction.options.data.forEach(option => {
                    if (option.type === discord.ApplicationCommandOptionType.Subcommand) {
                        options["subcommand"] = option.name;
                        option.options.forEach(sub_option => options[sub_option.name] = getOptionValue(sub_option));
                    } else if (option.type === discord.ApplicationCommandOptionType.SubcommandGroup) {
                        options["subcommand_group"] = option.name;
                        options["subcommand"] = option.options[0].name;
                        option.options[0].options.forEach(sub_option => options[sub_option.name] = getOptionValue(sub_option));
                    } else {
                        options[option.name] = getOptionValue(option);
                    }
                });
                command.execute(client, interaction, options)
                    .then(() => client.log.debug(`Выполнена слэш-команда ${command.name}`))
                    .catch(e => client.log.error(e, `Ошибка при выполнении слэш-команды ${command.name}`));
            } else {
                // Обработка команд на сервере
                if (!interaction.guild.members.me.permissionsIn(interaction.channel).has(discord.PermissionsBitField.Flags.ViewChannel)) return;

                let command = client.commands.find(cmd => cmd.name === interaction.commandName && cmd.type.includes(discord.ApplicationCommandType.ChatInput));
                if (!command) return;

                //const premiumGuildId = config.premiumGUILDID;
                //const premiumRoleId = config.RolePremiumID;
                //if (!(await checkPremiumStatus(interaction.guild.id)) && !(await checkPremiumRole(interaction.user.id, premiumGuildId, premiumRoleId))) {
                /*if (!(await checkPremiumStatus(interaction.guild.id))) {
                    const embed = new discord.EmbedBuilder()
                        .setColor(config.color)
                        .setTitle('Ошибка')
                        .setDescription('На этом сервере нет Premium-статуса !')
                        .setTimestamp();

                    return interaction.reply({ embeds: [embed], ephemeral: true });
                }*/

                let cooldown = command.checkCooldown(client, interaction);
                if (cooldown > Date.now()) return interaction.reply({ embeds: [client.cooldownErrorMessage(command, cooldown)], ephemeral: true });
                if (!(await command.check(client, interaction))) return;
                let options = {};
                interaction.options.data.forEach(option => {
                    if (option.type === discord.ApplicationCommandOptionType.Subcommand) {
                        options["subcommand"] = option.name;
                        option.options.forEach(sub_option => options[sub_option.name] = getOptionValue(sub_option));
                    } else if (option.type === discord.ApplicationCommandOptionType.SubcommandGroup) {
                        options["subcommand_group"] = option.name;
                        options["subcommand"] = option.options[0].name;
                        option.options[0].options.forEach(sub_option => options[sub_option.name] = getOptionValue(sub_option));
                    } else {
                        options[option.name] = getOptionValue(option);
                    }
                });
                command.execute(client, interaction, options)
                    .then(() => client.log.debug(`Выполнена слэш-команда ${command.name}`))
                    .catch(e => client.log.error(e, `Ошибка при выполнении слэш-команды ${command.name}`));
            }
        } else if (interaction.isUserContextMenuCommand()) {
            let command = client.commands.find(cmd => cmd.name === interaction.commandName && cmd.type.includes(discord.ApplicationCommandType.User));
            if (!command) return;
            let cooldown = command.checkCooldown(client, interaction);
            if (cooldown > Date.now()) return interaction.reply({ embeds: [client.cooldownErrorMessage(command, cooldown)], ephemeral: true });
            if (!(await command.check(client, interaction))) return;
            command.execute(client, interaction, {})
                .then(() => client.log.debug(`Выполнена команда ${command.name} из контекстного меню пользователя`))
                .catch(e => client.log.error(e, `Ошибка при выполнении команды ${command.name} из контекстного меню пользователя`));
        } else if (interaction.isMessageContextMenuCommand()) {
            let command = client.commands.find(cmd => cmd.name === interaction.commandName && cmd.type.includes(discord.ApplicationCommandType.Message));
            if (!command) return;
            let cooldown = command.checkCooldown(client, interaction);
            if (cooldown > Date.now()) return interaction.reply({ embeds: [client.cooldownErrorMessage(command, cooldown)], ephemeral: true });
            if (!(await command.check(client, interaction))) return;
            command.execute(client, interaction, {})
                .then(() => client.log.debug(`Выполнена команда ${command.name} из контекстного меню сообщения`))
                .catch(e => client.log.error(e, `Ошибка при выполнении команды ${command.name} из контекстного меню сообщения`));
        } else if (interaction.type === discord.InteractionType.ApplicationCommandAutocomplete) {
            let command = client.commands.find(cmd => cmd.name === interaction.commandName);
            if (!command) return;
            command.autocomplete(client, interaction)
                .catch(e => client.log.error(e, `Ошибка при выполнении функции autocomplete команды ${command.name}`));
        } else {
            let command = client.commands.find(cmd => cmd.components_ids.includes(interaction.customId));
            if (!command) return;
            command.componentListener(client, interaction)
                .then(() => client.log.debug(`Выполнен компонент ${interaction.customId} команды ${command.name}`))
                .catch(e => client.log.error(e, `Ошибка при выполнении компонента ${interaction.customId} команды ${command.name}`));
        }
    });

    client.on('messageCreate', async message => {
        client.events.get("messageCreate")?.forEach((e) => e.execute(message));
        if (message.author.bot) return;

        let prefix = config.prefix;
        if (!(message.content.startsWith(`<@${client.user.id}>`) || message.content.startsWith(prefix))) return;

        if (message.guild) {

            let options = [...message.content.matchAll(/("(.*?)"|(\\ |[^ ])+|\w+)/g)].map(e => e[2] ?? e[0]);
            let name;
            if (options[0] === `<@${client.user.id}>`) {
                options.shift();
                name = options.shift();
            } else {
                name = options.shift();
                name = name.slice(prefix.length, name.length);
            }

            let command = client.commands.find(cmd => (cmd.name === name || cmd?.aliases?.includes(name)) && cmd.type.includes('text'));
            if (!command) return;
            let cooldown = command.checkCooldown(client, message);
            if (cooldown > Date.now()) return message.reply({ embeds: [client.cooldownErrorMessage(command, cooldown)], ephemeral: true });

            let no_perms = [];
            let me = await message.guild.members.fetchMe();
            command.bot_permissions.concat(config.default_permissions).forEach(perm => { if (!(me.permissions.has(perm) || message.channel.permissionsFor(me).has(perm))) no_perms.push(perm) });
            if (no_perms.length > 0) return message.reply(client.noBotPermissionsErrorMessage(command, no_perms.map(perm => Object.keys(discord.PermissionsBitField.Flags).find(key => discord.PermissionsBitField.Flags[key] === perm))));
            command.user_permissions.forEach(perm => { if (!(message.member.permissions.has(perm) || message.channel.permissionsFor(message.member).has(perm))) no_perms.push(perm) });
            if (no_perms.length > 0) return message.reply(client.noUserPermissionsErrorMessage(command, no_perms.map(perm => Object.keys(discord.PermissionsBitField.Flags).find(key => discord.PermissionsBitField.Flags[key] === perm))));

            if (!(await command.check(client, message))) return;
            let resultOptions = {};
            let command_options = command.options;
            for (let i = 0; i < command_options.length; i++) {
                let option = command_options[i];
                if (!option.required) if (command.options[i + 1]?.required) throw new Error(`\u2757 Обязательные опции команды ${command.name} должны идти до необязательных опций! \u2757`);
                let value = options[i];
                let subcommands = command_options.filter(opt => opt != null).filter(opt => opt.type === discord.ApplicationCommandOptionType.Subcommand);
                let subcommand_groups = command_options.filter(opt => opt != null).filter(opt => opt.type === discord.ApplicationCommandOptionType.SubcommandGroup);
                if (subcommands.length > 0) if (!value) return client.errorMessage(message, 'Укажите подкоманду!');
                if (subcommand_groups.length > 0) if (!value) return client.errorMessage(message, 'Укажите подгруппу подкоманд!');
                if (subcommand_groups.length > 0 && subcommands.length > 0) if (!options[i + 1]) return client.errorMessage(message, 'Укажите подкоманду!');
                if (!value && option.required) return client.errorMessage(message, `Не указана обязательная опция: \`${option.name}\`!`);
                if (option.choices?.find(x => x.name === value)) value = option.choices.find(x => x.name === value).value;
                if (option.choices?.find(x => x.value === value)) value = option.choices.find(x => x.value === value).value;
                resultOptions[option.name] = value;
            }
            command.execute(client, message, resultOptions)
                .then(() => client.log.debug(`Выполнена текстовая команда ${command.name}`))
                .catch(e => client.log.error(e, `Ошибка при выполнении текстовой команды ${command.name}`));
        } else {
            // Обработка команд в ЛС
            let options = [...message.content.matchAll(/("(.*?)"|(\\ |[^ ])+|\w+)/g)].map(e => e[2] ?? e[0]);
            let name;
            if (options[0] === `<@${client.user.id}>`) {
                options.shift();
                name = options.shift();
            } else {
                name = options.shift();
                name = name.slice(prefix.length, name.length);
            }

            let command = client.commands.find(cmd => (cmd.name === name || cmd?.aliases?.includes(name)) && cmd.type.includes('text'));
            if (!command) return;

            let resultOptions = {};
            let command_options = command.options;
            for (let i = 0; i < command_options.length; i++) {
                let option = command_options[i];
                if (!option.required) if (command.options[i + 1]?.required) throw new Error(`\u2757 Обязательные опции команды ${command.name} должны идти до необязательных опций! \u2757`);
                let value = options[i];
                let subcommands = command_options.filter(opt => opt != null).filter(opt => opt.type === discord.ApplicationCommandOptionType.Subcommand);
                let subcommand_groups = command_options.filter(opt => opt != null).filter(opt => opt.type === discord.ApplicationCommandOptionType.SubcommandGroup);
                if (subcommands.length > 0) if (!value) return client.errorMessage(message, 'Укажите подкоманду!');
                if (subcommand_groups.length > 0) if (!value) return client.errorMessage(message, 'Укажите подгруппу подкоманд!');
                if (subcommand_groups.length > 0 && subcommands.length > 0) if (!options[i + 1]) return client.errorMessage(message, 'Укажите подкоманду!');
                if (!value && option.required) return client.errorMessage(message, `Не указана обязательная опция: \`${option.name}\`!`);
                if (option.choices?.find(x => x.name === value)) value = option.choices.find(x => x.name === value).value;
                if (option.choices?.find(x => x.value === value)) value = option.choices.find(x => x.value === value).value;
                resultOptions[option.name] = value;
            }
            command.execute(client, message, resultOptions)
                .then(() => client.log.debug(`Выполнена текстовая команда ${command.name}`))
                .catch(e => client.log.error(e, `Ошибка при выполнении текстовой команды ${command.name}`));
        }
    });
};
