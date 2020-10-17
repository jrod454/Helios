const Discord = require("discord.js");
const utils = require('../utils/utils');

module.exports.execute = async (parsedMessage, message, database) => {
    switch (parsedMessage.arguments.length) {
        case 0:
            let currencyAmount = await utils.getUsersCurrency(message.author.id);
            utils.sendMessage(message.channel.id, `${message.author} has ${currencyAmount}`);
            break;
        case 1:
            let userId = parsedMessage.reader.getUserID();
            let userObject = message.guild.members.cache.get(userId);
            if (userId !== null) {
                let currencyAmount = await utils.getUsersCurrency(userId);
                utils.sendMessage(message.channel.id, `${userObject} has ${currencyAmount}`);
            } else {
                utils.sendMessage(message.channel.id, `Unable to read user id`);
            }
            break;
        default:
            utils.sendMessage(message.channel.id, `Invalid currency command`);
            break;
    }
};
