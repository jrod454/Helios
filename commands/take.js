const utils = require('../utils/utils');

module.exports.execute = async (parsedMessage, message, database) => {
    switch (parsedMessage.arguments.length) {
        case 2:
            let amount = utils.parseCurrencyAmount(parsedMessage.reader.getString());
            if (amount !== null) {
                let userId = parsedMessage.reader.getUserID(true);
                let roleId = parsedMessage.reader.getRoleID(true);
                if (userId === null && roleId === null) {
                    throw `The provided user/role is invalid\nArguments: ${parsedMessage.arguments}`;
                }

                if (userId !== null) {
                    let user = message.guild.members.cache.get(userId);
                    utils.subtractCurrencyFromUser(userId, amount, true, message, database).then(() => {
                        utils.sendMessage(message.channel.id, `Took ${amount} from ${user}.`);
                    });
                } else if (roleId !== null) {
                    let role = message.guild.roles.cache.get(roleId);
                    utils.subtractCurrencyFromRole(roleId, amount, true, message, database).then(() => {
                        utils.sendMessage(message.channel.id, `Took ${amount} from ${role}.`);
                    });
                }
            } else {
                throw `Invalid amount provided to take command`;
            }
            break;
        default:
            throw `Invalid take command`;
    }
};