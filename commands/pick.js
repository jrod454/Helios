const Discord = require("discord.js");
const settings = require('../config/settings');
const utils = require('../utils/utils');

module.exports.execute = async (parsedMessage, message) => {
    if (parsedMessage.arguments.length === 1) {
        let password = parsedMessage.arguments[0];
        message.delete();
        let possiblePlants = settings.db.collection('garden').where("channelId", "==", message.channel.id);
        let plants = await possiblePlants.get();
        console.log(plants);
        if (plants.size > 0) {
            for (let plant of plants.docs) {
                if (plant.data().password === password) {
                    const userDoc = settings.db.collection('users').doc(message.author.id);
                    await userDoc.set({}, {merge: true});
                    await settings.db.runTransaction(async (t) => {
                        let doc = await t.get(userDoc);
                        let currentCurrency = doc.data().currency;
                        if (currentCurrency === undefined) {
                            currentCurrency = 0;
                        }
                        let newCurrency = currentCurrency + plant.data().amount;
                        if (newCurrency > settings.getMaxCurrency()) {
                            newCurrency = settings.getMaxCurrency();
                        }
                        await t.update(userDoc, {currency: newCurrency});
                        utils.sendEmbed(message.channel.id, createPickSuccessEmbed(message.author, plant.data().amount, newCurrency, password, plant.id));
                        await plant.ref.delete();
                    });
                }
            }
        } else {
            throw `Pick: there are no plants to pick in this channel!`;
        }
    } else {
        throw `Pick: Wrong number of arguments`;
    }
};

createPickSuccessEmbed = (user, amount, userTotalCurrency, passphrase, databaseId) => {
    let embed = new Discord.MessageEmbed();
    embed.setDescription(`${user} has successfully picked **${amount}**!\nTheir new currency total is **${userTotalCurrency}**.\nThe passphrase was: **${passphrase}**\nPlantId: ${databaseId}\n`);
    embed.setThumbnail("https://imgur.com/cpV5wcH.png");
    return embed;
};
