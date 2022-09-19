const Discord = require("discord.js");
const cmdAliasMap = require('../config/cmdAliasMap.json');
const settings = require('../config/settings');

module.exports.getUser = (possibleUserString, message) => {
    let isUserIdString = /<@\d+>/.test(possibleUserString);
    let isUserIdStringWithBang = /<@!\d+>/.test(possibleUserString);
    let isPlainId = /^\d+$/.test(possibleUserString);
    let finalId = undefined;
    if (isUserIdString) {
        finalId = possibleUserString.match(/<@(\d+)>/)[1];
    } else if (isUserIdStringWithBang) {
        finalId = possibleUserString.match(/<@!(\d+)>/)[1];
    } else if (isPlainId) {
        finalId = possibleUserString.match(/^(\d+)$/)[1];
    }

    return message.guild.members.cache.get(finalId);
};

module.exports.getRole = (possibleRoleString, message) => {
    let isRoleIdString = /<@&\d+>/.test(possibleRoleString);
    let isPlainId = /^\d+$/.test(possibleRoleString);
    let finalId = undefined;
    if (isRoleIdString) {
        finalId = possibleRoleString.match(/<@&(\d+)>/)[1];
    } else if (isPlainId) {
        finalId = possibleRoleString.match(/^(\d+)$/)[1];
    }

    return message.guild.roles.cache.get(finalId);
};

module.exports.createErrorEmbed = (text) => {
    return new Discord.EmbedBuilder()
        .setTitle('Invalid Command')
        .setDescription(text);
}

module.exports.createSuccessEmbed = (text) => {
    return new Discord.EmbedBuilder()
        .setTitle('Success!')
        .setDescription(text);
};

module.exports.addCurrencyToUser = async (userId, amount, shouldReplyTo, channelId, guildId) => {
    const userDoc = settings.db.collection('users').doc(userId);
    await userDoc.set({}, {merge: true});
    await settings.db.runTransaction(async (t) => {
        let doc = await t.get(userDoc);
        let currentCurrency = doc.data().currency;
        let newCurrencyValue = amount;
        if (currentCurrency !== undefined) {
            newCurrencyValue = currentCurrency + amount;
        }
        if (newCurrencyValue > 1000000000000) {
            let errorText = `Total currency for ${settings.client.users.cache.get(userId)} cannot exceed 1,000,000,000,000\nArguments: ${arguments}`;
            if (shouldReplyTo) {
                this.sendMessage(errorText, channelId)
            }
            this.logMessage(guildId, errorText);
        } else {
            t.update(userDoc, {currency: newCurrencyValue});
        }
    });
};

module.exports.addCurrencyToRole = async (roleId, amount, shouldReplyTo, channelId, guildId) => {
    let role = settings.client.guilds.cache.get(guildId).roles.cache.get(roleId);
    if (role !== undefined) {
        role.members.forEach((value) => {
            this.addCurrencyToUser(value.id, amount, shouldReplyTo, channelId, guildId);
        });
    } else {
        this.logMessage(guildId, `Unable to find role: ${roleId}`);
    }
};

module.exports.subtractCurrencyFromUser = async (userId, amount, shouldReplyTo, message, database) => {
    const userDoc = database.collection('users').doc(userId);
    await userDoc.set({}, {merge: true});
    await database.runTransaction(async (t) => {
        let doc = await t.get(userDoc);
        let currentCurrency = doc.data().currency;
        if (currentCurrency === undefined) {
            currentCurrency = 0;
        }

        let newCurrencyValue = currentCurrency - amount;
        if (newCurrencyValue < 0) {
            let errorText = `User does not have enough currency\nUser has: ${currentCurrency}`;
            if (shouldReplyTo) {
                throw errorText;
            }
            this.logMessage(message.guild.id, errorText);
        } else {
            t.update(userDoc, {currency: newCurrencyValue});
        }
    });
};

module.exports.subtractCurrencyFromRole = async (roleId, amount, shouldReplyTo, message, database) => {
    let role = message.guild.roles.cache.get(roleId);
    if (role !== undefined) {
        role.members.forEach((value) => {
            this.subtractCurrencyFromUser(value.id, amount, shouldReplyTo, message, database);
        });
    } else {
        throw `Unable to find role: ${roleId}`;
    }
};

module.exports.cmdPermissionCheck = async (command, message, database) => {
    let parentAlias = this.getParentAlias(command);

    if (parentAlias === undefined) {
        throw `Unknown command`;
    }

    const channelPermissionsDoc = database.collection('permissions').doc('channels').collection(message.channel.id).doc(parentAlias);
    await channelPermissionsDoc.set({}, {merge: true});
    let validUsers = (await channelPermissionsDoc.get()).data().users;
    let validRoles = (await channelPermissionsDoc.get()).data().roles;
    let isUserValidated = validUsers !== undefined && validUsers.includes(message.author.id);
    let isRoleValidated = validRoles !== undefined && validRoles.some(value => message.member.roles.cache.some(r => r.id === value));
    if (isUserValidated || isRoleValidated) {
        return true;
    } else {
        throw `You do not have sufficient permissions to run this command`;
    }
};

module.exports.getParentAlias = (command) => {
    let mainCmdAlias = undefined;
    for (let [key, value] of Object.entries(cmdAliasMap)) {
        if (value.aliases.includes(command)) {
            mainCmdAlias = key;
            break;
        }
    }
    return mainCmdAlias;
};

module.exports.parseCurrencyAmount = (amountString) => {
    let isArgNumber = /^\d+$/.test(amountString);
    if (!isArgNumber) {
        return null;
    }

    let number = Number.parseInt(amountString);
    if (number > 1000000000000) {
        return null;
    }

    return number;
};

module.exports.logMessage = (guildId, text) => {
    let logChannelId = settings.getLogChannelId(guildId);
    if (logChannelId !== undefined) {
        settings.client.channels.cache.get(logChannelId).send({embeds: [new Discord.EmbedBuilder().setDescription(text)]});
    }
};

module.exports.sendMessage = (channelId, text) => {
    settings.client.channels.cache.get(channelId).send({embeds: [new Discord.EmbedBuilder().setDescription(text)]});
};

module.exports.sendMessage = (channelId, text, attachments) => {
    settings.client.channels.cache.get(channelId).send({embeds: [new Discord.EmbedBuilder().setDescription(text)], files: attachments});
};

module.exports.sendEmbed = (channelId, embed) => {
    settings.client.channels.cache.get(channelId).send(embed);
};

module.exports.getUsersCurrency = async (userId) => {
    const userDoc = settings.db.collection('users').doc(userId);
    await userDoc.set({}, {merge: true});
    let currencyValue = (await userDoc.get()).data().currency;
    if (currencyValue !== undefined) {
        return currencyValue;
    } else {
        return 0;
    }
};
