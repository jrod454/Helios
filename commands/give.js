const utils = require('../utils/utils');

module.exports.execute = async (parsedMessage, message, database) => {
    switch (parsedMessage.arguments.length) {
        case 2:
            let amount = utils.parseCurrencyAmount(parsedMessage.reader.getString());
            if (amount !== null) {
                let userId = parsedMessage.reader.getUserID(true);
                if (userId !== null) {
                    let user = message.guild.members.cache.get(userId);
                    const targetUserDoc = database.collection('users').doc(user.id);
                    await targetUserDoc.set({}, {merge: true});
                    const sourceUserDoc = database.collection('users').doc(message.author.id);
                    await sourceUserDoc.set({}, {merge: true});
                    await database.runTransaction(async (t) => {
                        let targetUserCurrency = (await t.get(targetUserDoc)).data().currency;
                        let sourceUserCurrency = (await t.get(sourceUserDoc)).data().currency;
                        if (targetUserCurrency === undefined) {
                            t.update(targetUserDoc, {currency: 0});
                            targetUserCurrency = 0;
                        }
                        if (sourceUserCurrency === undefined) {
                            t.update(sourceUserDoc, {currency: 0});
                            sourceUserCurrency = 0;
                        }

                        if (sourceUserCurrency - amount < 0) {
                            throw `You do not have enough currency to give this much`;
                        } else if (targetUserCurrency + amount > 1000000000000) {
                            throw `You cannot give this much to ${user}, it would put them over the max currency`
                        } else {
                            t.update(targetUserDoc, {currency: targetUserCurrency + amount});
                            t.update(sourceUserDoc, {currency: sourceUserCurrency - amount});
                            utils.sendMessage(message.channel.id, `Gave ${amount} to ${user}`)
                        }
                    });
                } else {
                    utils.sendMessage(message.channel.id, `Cannot find user`);
                }
            } else {
                utils.sendMessage(message.channel.id, `Invalid amount`);
            }
            break;
        default:
            utils.sendMessage(message.channel.id, `Invalid give command`);
    }
};