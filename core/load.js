const discord = require('discord.js')
const Command = require("./Command");
const config = require('../config.js')
const path = require('path')
const fs = require("fs");
module.exports = async function loadCommandsAndEvents(client) {
    let commands_path = "./commands/";
    let events_path = "./events/";
    let commandFiles = getFiles(path.join(__dirname, '..', commands_path))
    let slashes = [];
    for (let i = 0; i < commandFiles.length; i++) {
        //console.log(commandFiles[i])
        let cmd = new (require(commandFiles[i]))();
        cmd.setCommandData()
        if (!(cmd instanceof Command)) {
            client.log.send(`Класс команды в файле ${commandFiles[i]} не наследуется от класса Command. Команда не будет загружена`); continue;
        }
        if (!cmd.name) {
            client.log.send(`Команда в файле ${commandFiles[i]} не имеет название. Команда не будет загружена`); continue;
        }
        await client.commands.set(cmd.name, cmd);
        if (cmd.type.includes(discord.ApplicationCommandType.ChatInput)) slashes.push(cmd.slash_data);
        if (cmd.type.includes(discord.ApplicationCommandType.Message)) slashes.push(cmd.message_context_data);
        if (cmd.type.includes(discord.ApplicationCommandType.User)) slashes.push(cmd.user_context_data);
    }
    client.log.send(`Команды загружены ! Количество команд: ${commandFiles.length}`);
    await client.application.commands.set(slashes)
        .then(() => client.log.send(`Установлено ${slashes.length} команд приложения.`))
        .catch(e => client.log.error(e, "Ошибка во время установки команд приложения"));

    let eventFiles = getFiles(path.join(__dirname, '..', events_path))
    for (let i = 0; i < eventFiles.length; i++) {
        let event = require(eventFiles[i]);
        if (!event.name) {
            client.log.send(`Ивент в файле ${eventFiles[i]} не имеет название. Ивент не будет загружен`); continue;
        }
        await client.events.set(event.name, (client.events.get(event.name) ?? []).concat([event]))
    }
    for (const event_name of client.events.keys()) {
        let event = client.events.get(event_name)
        if (event_name === 'ready' || event_name === 'messageCreate' || event_name === 'interactionCreate') continue;
        client.on(event_name, async (...args) => { for (let i = 0; i < event.length; i++) await event[i].execute(...args).catch(e => client.log.error(e, `Ошибка при выполнении ивента ${event[i].name}`)) })
    }
    client.log.send(`Ивенты загружены! Количество уникальных ивентов: ${client.events.size}`);
}

function getFiles(pathToDir) {
    let paths = [pathToDir];
    let files = [];
    for (let i = 0; i < paths.length; i++) {
        fs.readdirSync(paths[i]).forEach(file => {
            if (!file.endsWith('.js')) paths.push(`${paths[i]}${file}/`);
            else if (!file.startsWith('_')) files.push(paths[i] + file);
        })
    }
    return files;
}