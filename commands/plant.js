const Discord = require("discord.js");
const settings = require('../config/settings');
const utils = require('../utils/utils');
const { uniqueNamesGenerator, adjectives, colors, animals } = require('unique-names-generator');

module.exports.execute = async (parsedMessage, message) => {
    const nameConfig = {
        dictionaries: [adjectives, colors, animals],
        separator: "",
        style: 'capital'
    }
    if (parsedMessage.arguments.length === 1) {
        let amount = utils.parseCurrencyAmount(parsedMessage.arguments[0]);
        if (amount !== null) {
            if (amount > settings.getMaxCurrency()) {
                throw `Plant: Plant cannot be greater than ${settings.getMaxCurrency()}`;
            }
            const userDoc = settings.db.collection('users').doc(message.author.id);
            await userDoc.set({}, {merge: true});
            await settings.db.runTransaction(async (t) => {
                let doc = await t.get(userDoc);
                let currentCurrency = doc.data().currency;
                if (currentCurrency === undefined || currentCurrency < amount) {
                    throw `Plant: You do not have enough currency to plant that much`;
                } else {
                    let password = uniqueNamesGenerator(nameConfig);
                    let newCurrency = currentCurrency - amount;
                    await t.update(userDoc, {currency: newCurrency});
                    let plantDoc = settings.db.collection('garden').add({channelId: message.channel.id, amount: amount, userId: message.author.id, password: password});
                    plantDoc.then((plantDoc) => {
                        utils.sendEmbed(message.channel.id, createPlantEmbed(message.author, amount, password, plantDoc.id));
                    });
                    message.delete();
                }
            });
        } else {
            throw `Plant: Invalid number`;
        }
    } else if (parsedMessage.arguments.length === 2) {
        let amount = utils.parseCurrencyAmount(parsedMessage.arguments[0]);
        if (amount !== null) {
            if (amount > settings.getMaxCurrency()) {
                throw `Plant: Plant cannot be greater than ${settings.getMaxCurrency()}`;
            }
            const userDoc = settings.db.collection('users').doc(message.author.id);
            await userDoc.set({}, {merge: true});
            await settings.db.runTransaction(async (t) => {
                let doc = await t.get(userDoc);
                let currentCurrency = doc.data().currency;
                if (currentCurrency === undefined || currentCurrency < amount) {
                    throw `Plant: You do not have enough currency to plant that much`;
                } else {
                    let secretPassword = parsedMessage.arguments[1];
                    let publicPassword = "\"your passphrase guess in quotes\"";
                    let newCurrency = currentCurrency - amount;
                    await t.update(userDoc, {currency: newCurrency});
                    let plantDoc = settings.db.collection('garden').add({channelId: message.channel.id, amount: amount, userId: message.author.id, password: secretPassword});
                    plantDoc.then((doc) => {
                        utils.sendEmbed(message.channel.id, createPlantEmbed(message.author, amount, publicPassword, doc.id));
                    });
                    message.delete();
                }
            });
        } else {
            throw `Plant: Invalid number`;
        }
    } else {
        throw `Plant: Wrong number of arguments`;
    }
};

createPlantEmbed = (user, amount, pickText, databaseId) => {
    let embed = new Discord.EmbedBuilder()
        .setAuthor({name: `${amount} has been planted!`, iconURL: "https://cdn.discordapp.com/emojis/664188522328227880.png"})
        .setDescription(`Use this command to pick it up!\n\`\`\`.pick ${pickText}\`\`\`\nPlanted by ${user}, PlantId: ${databaseId}\n`)
        .setThumbnail("https://imgur.com/cpV5wcH.png");
    return embed;
};
