const settings = require('../config/settings');
const utils = require('../utils/utils');

module.exports.execute = async (parsedMessage, message) => {
    if (parsedMessage.arguments.length === 1) {
        let amount = utils.parseCurrencyAmount(parsedMessage.arguments[0]);
        if (amount !== null) {
            const userDoc = settings.db.collection('users').doc(message.author.id);
            await userDoc.set({}, {merge: true});
            await settings.db.runTransaction(async (t) => {
                let doc = await t.get(userDoc);
                let currentCurrency = doc.data().currency;
                if (currentCurrency === undefined || currentCurrency < amount) {
                    throw `BetRoll: You do not have enough currency to bet that much`;
                }
                let betMultiplier = getBetMultiplier();
                let newCurrency = 0;
                if (betMultiplier === 0) {
                    newCurrency = currentCurrency - amount;
                } else {
                    newCurrency = currentCurrency + (amount * betMultiplier);
                }
                if (newCurrency > settings.getMaxCurrency()) {
                    newCurrency = settings.getMaxCurrency();
                }
                await t.update(userDoc, {currency: newCurrency});
                if (betMultiplier !== 0) {
                    utils.sendMessage(message.channel.id, `BetRoll: Congratulations ${message.author}! You won ${amount * betMultiplier}!\nNew total: ${newCurrency}`);
                } else {
                    utils.sendMessage(message.channel.id, `BetRoll: You lost ${message.author}.\nNew total: ${newCurrency}`);
                }
            });
        } else {
            throw `BetRoll: Invalid number`;
        }
    } else {
        throw `BetRoll: Wrong number of arguments`;
    }
};

getBetMultiplier = () => {
    let roll = Math.floor((Math.random() * 100) + 1);
    if (roll === 100) {
        return 10;
    } else if (roll >= 90) {
        return 4;
    } else if (roll >= 66) {
        return 2;
    } else {
        return 0;
    }
};
