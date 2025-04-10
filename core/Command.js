const { ApplicationCommandType } = require('discord.js');
const discord = require("discord.js");

module.exports = class Command {
    check(client, interaction) {
        // Проверки при срабатывании команды
        return true;
    }
    name = undefined;
    description = undefined;
    nameLocalizations = undefined;
    descriptionLocalizations = undefined;
    type = [];
    bot_permissions = [];
    user_permissions = [];
    options = [];
    components_ids = [];
    cooldown = 0.5;
    dm = false;
    constructor() { }
    async execute(client, interaction, options) { }
    async componentListener(client, interaction) { }
    async autocomplete(client, interaction) { }
    setCommandData() {
        this.slash_data = {
            name: this.name,
            description: this.description,
            type: ApplicationCommandType.ChatInput,
            options: this.options,
            nameLocalizations: this.nameLocalizations,
            descriptionLocalizations: this.descriptionLocalizations,
            dmPermission: this.dm
        };

        this.message_context_data = {
            name: this.name,
            type: ApplicationCommandType.Message,
            nameLocalizations: this.nameLocalizations,
            dmPermission: this.dm
        };
        this.user_context_data = {
            name: this.name,
            type: ApplicationCommandType.User,
            nameLocalizations: this.nameLocalizations,
            dmPermission: this.dm
        };
        if (this.user_permissions.length > 0) {
            this.slash_data.defaultMemberPermissions = (new discord.PermissionsBitField()).add(...this.user_permissions);
            this.message_context_data.defaultMemberPermissions = (new discord.PermissionsBitField()).add(...this.user_permissions);
            this.user_context_data.defaultMemberPermissions = (new discord.PermissionsBitField()).add(...this.user_permissions);
        }
    }
    checkCooldown(client, interaction) {
        let user_id = interaction?.user?.id || interaction?.author?.id
        let user_cooldown_time = client.cooldowns.get(this.name)?.get(user_id)
        let cooldown_end_time = (user_cooldown_time ?? Date.now()) + this.cooldown * 1000;
        if (!user_cooldown_time || cooldown_end_time < Date.now()) {
            client.cooldowns.set(this.name, (client.cooldowns.get(this.name) ?? new discord.Collection()).set(user_id, Date.now()))
            return 0;
        }
        return cooldown_end_time
    }
}