const discord = require('discord.js');
module.exports = {
    prefix: ["."],
    status: "dnd",
    activity: [{
        name: "Мини-Игры",
        type: discord.ActivityType.Custom
    }],
    color: 0x0099ff, // цвет
    premiumchannelID: '1263859202712141979', // 1263859202712141979
    premiumGUILDID: '1245413588760395827',
    RolePremiumID: '1253004248422289408',
    default_permissions: [
        discord.PermissionsBitField.Flags.SendMessages,
        discord.PermissionsBitField.Flags.EmbedLinks,
        discord.PermissionsBitField.Flags.AttachFiles,
        discord.PermissionsBitField.Flags.AddReactions,
        discord.PermissionsBitField.Flags.ReadMessageHistory,
        discord.PermissionsBitField.Flags.ViewChannel
    ],
    intents: [
        discord.GatewayIntentBits.Guilds,
        discord.GatewayIntentBits.GuildMembers,
        discord.GatewayIntentBits.GuildMessages,
        discord.GatewayIntentBits.MessageContent,
        discord.GatewayIntentBits.GuildVoiceStates,
    ],
    partials: [],
}