const Firestore = require('@google-cloud/firestore');
const db = new Firestore({
    projectId: 'sofia-1b7ee',
    keyFilename: 'sofia-1b7ee.json',
});
module.exports.db = db;

const Discord = require("discord.js");
const client = new Discord.Client();
module.exports.client = client;

const defaults = require('./serverDefaultSettings.json');
const utils = require('../utils/utils');

let serverSettings = new Map();

module.exports.init = async () => {
    const serverDocs = await this.db.collection('servers').get();
    serverSettings = new Map();
    serverDocs.docs.forEach(doc => {
        serverSettings.set(doc.id, doc.data());
    });
    console.log(serverSettings);
};

module.exports.execute = async (parsedMessage, message, database) => {
    switch (parsedMessage.arguments.length) {
        case 1:
            if (parsedMessage.arguments[0] === "refresh") {
                await this.init();
                utils.sendMessage(message.channel.id, `Refreshed settings`);
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

module.exports.getWorkPayout = async (message) => {
    const serverDoc = this.db.collection('servers').doc(message.guild.id);
    if (serverSettings.has(message.guild.id)) {
        let guildInfo = serverSettings.get(message.guild.id);
        if (guildInfo.workPayout !== undefined) {
            return guildInfo.workPayout;
        } else {
            await serverDoc.update({workPayout: defaults.workPayout});
            await this.init();
            return defaults.workPayout;
        }
    } else {
        await serverDoc.set({workPayout: defaults.workPayout}, {merge: true});
        await this.init();
        return defaults.workPayout;
    }
};

module.exports.getWorkInterval = async (message) => {
    const serverDoc = this.db.collection('servers').doc(message.guild.id);
    if (serverSettings.has(message.guild.id)) {
        let guildInfo = serverSettings.get(message.guild.id);
        if (guildInfo.workInterval !== undefined) {
            return guildInfo.workInterval;
        } else {
            await serverDoc.update({workInterval: defaults.workInterval});
            await this.init();
            return defaults.workInterval;
        }
    } else {
        await serverDoc.set({workInterval: defaults.workInterval}, {merge: true});
        await this.init();
        return defaults.workInterval;
    }
};

module.exports.hasLogChannel = (guildId) => {
    if (serverSettings.has(guildId)) {
        return serverSettings.get(guildId).logChannelId !== undefined;
    } else {
        return false;
    }
};

module.exports.getLogChannel = (guildId) => {
    return serverSettings.get(guildId).logChannelId;
};