const settings = require('../config/settings');
const utils = require('../utils/utils');

module.exports.handle = async (message) => {
    if (settings.getDmCategoryId() === undefined) {
        message.reply(`The server does not have a dm category set.  Message an admin.`);
    } else {
        let guild = settings.client.guilds.cache.first();
        if (guild !== undefined) {
            let channel = guild.channels.cache.find((value, key) => value.name === message.author.id);
            if (channel === undefined) {
                channel = await guild.channels.create(message.author.id, {reason: `bot direct message ${message.author.id}`});
                await channel.setParent(settings.getDmCategoryId());
                utils.sendMessage(channel.id, `${message.author}:\n${message.content}`, Array.from(message.attachments.values()));
            } else {
                utils.sendMessage(channel.id, `${message.author}:\n${message.content}`, Array.from(message.attachments.values()));
            }
        } else {
            throw `Guild cannot be found for some reason`;
        }
    }
};

module.exports.send = async (message) => {
    let user = settings.client.users.cache.get(message.channel.name);
    if (user !== undefined) {
        await user.send(message.content, {files: Array.from(message.attachments.values())});
    } else {
        throw `Cannot find user to direct message`;
    }
};