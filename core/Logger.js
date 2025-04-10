const discord = require("discord.js");
const config = require("../config.js");
module.exports = class Logger {
    isDebug = config.debug
    constructor(name) {
        this.name = name;
    }
    send(message) {
        console.log(`[${this.name} Debug] ${message}`)
    }
    debug(message) {
        if (!this.isDebug) return;
        console.log(`[${this.name} Debug] ${message}`)
    }
    error(error, description = "Описание не указано", sendToChannel = true) {

        console.error(`[${this.name} Error] ${description}\n${error.stack}`)

    }
}