const Firestore = require('@google-cloud/firestore');
const Discord = require("discord.js");
const config = require("../config/discordConfig.json");
const utils = require('../utils/utils');

module.exports.execute = async (parsedMessage, message, database) => {
    switch (parsedMessage.arguments.length) {
        case 2:
            let amount = utils.parseCurrencyAmount(parsedMessage.reader.getString());
            if (amount !== null) {
                let userId = parsedMessage.reader.getUserID(true);
                let roleId = parsedMessage.reader.getRoleID(true);
                if (userId === null && roleId === null) {
                    utils.sendMessage(message.channel.id, `The provided user/role is invalid\nArguments: ${parsedMessage.arguments}`);
                    break;
                }

                if (userId !== null) {
                    let user = message.guild.members.cache.get(userId);
                    utils.addCurrencyToUser(userId, amount, true, message, database).then(() => {
                        utils.sendMessage(message.channel.id, `Awarded ${amount} to ${user}.`);
                    });
                } else if (roleId !== null) {
                    let role = message.guild.roles.cache.get(roleId);
                    utils.addCurrencyToRole(roleId, amount, true, message, database).then(() => {
                        utils.sendMessage(message.channel.id, `Awarded ${amount} to ${role}.`);
                    });
                }
            } else {
                utils.sendMessage(message.channel.id, `Invalid amount provided to award command`);
            }
            break;
        default:
            utils.sendMessage(message.channel.id, `Invalid award command`);
    }
};