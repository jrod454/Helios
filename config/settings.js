const Firestore = require('@google-cloud/firestore');
const db = new Firestore({
    projectId: 'sofia-1b7ee',
    keyFilename: 'sofia-1b7ee.json',
});

//Used for testing
// const db = new Firestore({
//     projectId: 'helios-6fbe5',
//     keyFilename: 'helios-6fbe5.json',
// });

module.exports.db = db;

const Discord = require("discord.js");
const client = new Discord.Client();
module.exports.client = client;

const defaults = require('./serverDefaultSettings.json');
const utils = require('../utils/utils');

let serverSettings = {};

module.exports.init = async () => {
    const serverSettingsDoc = this.db.collection('server').doc('settings');
    serverSettings = (await serverSettingsDoc.get()).data();
    if (serverSettings === undefined) {
        await serverSettingsDoc.set({}, {merge: true})
        serverSettings = {};
    }
    console.log(serverSettings);
};

module.exports.execute = async (parsedMessage, message, database) => {
    switch (parsedMessage.arguments.length) {
        case 1:
            if (parsedMessage.arguments[0] === "refresh") {
                await this.init();
                utils.sendMessage(message.channel.id, `Refreshed settings`);
            } else if (parsedMessage.arguments[0] === "list") {
                listSettings(message.channel.id);
            } else {
                throw `Invalid settings command`;
            }
            break;
        case 3:
            let subCommand = parsedMessage.reader.getString();
            if (subCommand === "set") {
                let variableName = parsedMessage.reader.getString();
                if (variableName === "logChannelId") {
                    let parsedChannelId = parsedMessage.reader.getChannelID();
                    if (parsedChannelId !== null) {
                        await this.db.collection('servers').doc(message.guildID).update({logChannelId: parsedChannelId});
                        await this.init();
                    } else {
                        throw `Unable to read channel id`;
                    }
                } else if (variableName === "botDmCategoryId") {
                    let parsedChannelId = parsedMessage.reader.getChannelID();
                    if (parsedChannelId !== null) {
                        await this.setDmCategoryId(parsedChannelId);
                    } else {
                        throw `Unable to read channel id`;
                    }
                } else {
                    throw `Unknown settings sub command`;
                }
            } else {
                throw `Unknown settings command`;
            }
            break;
        default:
            throw `Unknown settings command`
    }
};

listSettings = (channelId) => {
    let output = `Settings:\n`;
    let totalSettings = new Map();
    for (let [key, value] of Object.entries(defaults)) {
        totalSettings.set(key, value);
    }
    for (let [key, value] of Object.entries(serverSettings)) {
        totalSettings.set(key, value);
    }
    totalSettings.forEach((value, key) => {
        output += `${key}: ${value}\n`;
    });
    utils.sendMessage(channelId, output);
};

module.exports.getWorkPayout = () => {
    if (serverSettings.workPayout === undefined) {
        return defaults.workPayout;
    } else {
        return serverSettings.workPayout;
    }
};

module.exports.getWorkInterval = () => {
    if (serverSettings.workInterval === undefined) {
        return defaults.workInterval;
    } else {
        return serverSettings.workInterval;
    }
};

module.exports.hasLogChannel = () => {
    return serverSettings.logChannelId !== undefined;
};

module.exports.getLogChannel = () => {
    return serverSettings.logChannelId;
};

module.exports.getDmCategoryId = () => {
    return serverSettings.botDmCategoryId;
};

module.exports.setDmCategoryId = async (categoryId) => {
    const serverSettingsDoc = this.db.collection('server').doc('settings');
    await serverSettingsDoc.update({botDmCategoryId: categoryId});
    serverSettings.botDmCategoryId = categoryId;
};

module.exports.getMaxCurrency = () => {
    if (serverSettings.maxCurrency === undefined) {
        return defaults.maxCurrency;
    } else {
        return serverSettings.maxCurrency;
    }
};

module.exports.getMaxBet = () => {
    if (serverSettings.maxBet === undefined) {
        return defaults.maxBet;
    } else {
        return serverSettings.maxBet;
    }
};