const discord = require('discord.js')
const config = require('./config.js')
const tokeg = require("./token.js")
const Logger = require("./core/Logger");
let client = new discord.Client({ intents: config.intents, partials: config.partials });
client.commands = new discord.Collection()
client.events = new discord.Collection()
client.cooldowns = new discord.Collection()
client.log = new Logger("BOT");

client.noRequiredOptionErrorMessage = (command, error_option) => ({
    embeds: [
        new discord.EmbedBuilder({
            color: config?.color,
            title: "Ошибка",
            description: `Вы не указали обязательный аргумент **${error_option.name}**!\n\`\`\`xml\n+${command.name} ${command.options.map(option => (option.required ? '<' : '[') + option.name + (option.required ? '>' : ']')).join(' ')}\n\`\`\`\n${command.options.map(option => (option.required ? '' : '(Не обязательно) ') + '**' + option.name + '** - ' + option.description).join('\n')}`
        })
    ]
})
client.incorrectOptionErrorMessage = (command, error_option, type) => ({
    embeds: [
        new discord.EmbedBuilder({
            color: config?.color,
            title: "Ошибка",
            description: `Вы указали аргумент **${error_option.name}** не правильно! Тип аргумента - ${type}\n\`\`\`xml\n+${command.name} ${command.options.map(option => (option.required ? '<' : '[') + option.name + (option.required ? '>' : ']')).join(' ')}\n\`\`\`\n${command.options.map(option => (option.required ? '' : '(Не обязательно) ') + '**' + option.name + '** - ' + option.description).join('\n')}`
        })
    ]
})
client.cooldownErrorMessage = (command, time) => new discord.EmbedBuilder({
    color: config?.color,
    title: "Ошибка",
    description: `Вы сможете использовать команду \`${command.name}\` <t:${Math.floor(time / 1000)}:R>`
})
client.noBotPermissionsErrorMessage = (command, permissions) => ({
    embeds: [
        new discord.EmbedBuilder({
            color: config?.color,
            title: "Ошибка",
            description: `Без прав \`${permissions.join('`, `')}\` я не смогу использовать команду ${command.name}`
        })
    ]
})
client.noUserPermissionsErrorMessage = (command, permissions) => ({
    embeds: [
        new discord.EmbedBuilder({
            color: config?.color,
            title: "Ошибка",
            description: `Вам не хватает прав для использования команды **${command.name}** !\nНеобходимые права: \`${permissions.join('`, `')}\``
        })
    ]
})

client.login(tokeg.token)
    .then(async () => {
        if (config.status) client.user.setStatus(config.status);
        if (!Array.isArray(config.activity)) client.user.setActivity(config.activity.name ? config.activity : undefined);
        else {
            let i = 0;
            setInterval(() => {
                client.user.setActivity(config.activity[i]);
                i++;
                if (i === config.activity.length) i = 0;
            }, 10000);
        }
        await require('./core/load')(client);
        require('./core/commandHandler.js')(client)
            .catch(e => client.log.error(e, "Ошибка при загрузке обработчика команд"));
        client.log.send('Обработчик команд загружен!');
        client.log.send(`${client.user.tag} запущен!`);
        client.events.get("ready")?.forEach((e) => e.execute(client))
    })
    .catch(e => client.log.error(e, "Ошибка", false));

process.on("uncaughtException", client.log.error);
process.on("unhandledRejection", client.log.error);