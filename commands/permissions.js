const utils = require('../utils/utils');
const cmdAliasMap = require('../config/cmdAliasMap.json');
const settings = require('../config/settings');

module.exports.execute = async (parsedMessage, message, database) => {
    switch (parsedMessage.arguments.length) {
        case 2:
            let subCmd2 = parsedMessage.reader.getString();
            let targetCmd2 = parsedMessage.reader.getString();
            if (subCmd2 === "list") {
                await listPermissions(message.guild.id, targetCmd2, message.channel.id);
            } else {
                throw `Permissions: Unknown sub command`;
            }
            break;
        case 3:
            let subCmd3 = parsedMessage.reader.getString();
            let targetCmd3 = parsedMessage.reader.getString();
            let userId = parsedMessage.reader.getUserID(true);
            let roleId = parsedMessage.reader.getRoleID(true);
            if (subCmd3 === "add") {
                await addPermission(userId, roleId, message.guild.id, targetCmd3, message.channel.id);
            } else if (subCmd3 === "remove") {
                await removePermission(userId, roleId, message.guild.id, targetCmd3, message.channel.id);
            } else {
                throw `Permissions: Unknown sub command`;
            }
            break;
        case 4:
            let subCmd4 = parsedMessage.reader.getString();
            let targetCmd4 = parsedMessage.reader.getString();
            let userId4 = parsedMessage.reader.getUserID(true);
            let roleId4 = parsedMessage.reader.getRoleID(true);
            parsedMessage.reader.seek();
            let targetChannel = parsedMessage.reader.getChannelID(true);
            if (subCmd4 === "add") {
                await addPermission(userId4, roleId4, message.guild.id, targetCmd4, targetChannel);
            } else if (subCmd4 === "remove") {
                await removePermission(userId4, roleId4, message.guild.id, targetCmd4, targetChannel);
            } else {
                throw `Permissions: Unknown sub command`;
            }
            break;
        default:
            throw `Permissions: Wrong number of arguments for a permissions command`;
    }
};

listPermissions = async (guildId, commandName, channelId) => {
    let targetParentAlias = utils.getParentAlias(commandName);
    if (targetParentAlias === undefined) {
        throw `Permissions: Unknown command ${commandName}`;
    }
    const channelPermissionsDoc = settings.db.collection('permissions').doc('channels').collection(channelId).doc(targetParentAlias);
    await channelPermissionsDoc.set({}, {merge: true});
    let data = (await channelPermissionsDoc.get()).data();
    let output = `Users:\n`;
    if (data.users !== undefined) {
        data.users.forEach(userId => {
            let user = settings.client.users.cache.get(userId);
            if (user !== undefined) {
                output += `${user}\n`;
            }
        });
    }
    output += `Roles:\n`;
    if (data.roles !== undefined) {
        data.roles.forEach(roleId => {
            let role = settings.client.guilds.cache.get(guildId).roles.cache.get(roleId);
            if (role !== undefined) {
                output += `${role}\n`;
            }
        });
    }
    utils.sendMessage(channelId, output);
};

addPermission = async (userId, roleId, guildId, commandName, channelId) => {
    let targetParentAlias = utils.getParentAlias(commandName);
    if (targetParentAlias === undefined) {
        throw `Permissions: Unknown command ${commandName}`;
    }
    if (userId === null && roleId === null) {
        throw `Permissions: The provided user/role is invalid`;
    }
    let user = settings.client.users.cache.get(userId);
    let role = settings.client.guilds.cache.get(guildId).roles.cache.get(roleId);
    const channelPermissionsDoc = settings.db.collection('permissions').doc('channels').collection(channelId).doc(targetParentAlias);
    await channelPermissionsDoc.set({}, {merge: true});
    if (user !== undefined) {
        await settings.db.runTransaction(async (t) => {
            let doc = await t.get(channelPermissionsDoc);
            let users = doc.data().users;
            let allUniqueUsers = users !== undefined ? users.concat(user.id) : [user.id];
            allUniqueUsers = allUniqueUsers.filter((item, index) => {
                return allUniqueUsers.indexOf(item) === index;
            });
            t.update(channelPermissionsDoc, {users: allUniqueUsers});
        });
        utils.sendMessage(channelId, `Adjusted permissions of ${user} to the the ${targetParentAlias} command.`);
    } else if (role !== undefined) {
        await settings.db.runTransaction(async (t) => {
            let doc = await t.get(channelPermissionsDoc);
            let roles = doc.data().roles;
            let allUniqueRoles = roles !== undefined ? roles.concat(role.id) : [role.id];
            allUniqueRoles = allUniqueRoles.filter((item, index) => {
                return allUniqueRoles.indexOf(item) === index;
            });
            t.update(channelPermissionsDoc, {roles: allUniqueRoles});
        });
        utils.sendMessage(channelId, `Adjusted permissions of ${role} to the the ${targetParentAlias} command.`);
    } else {
        throw `Permissions: Something went really wrong`;
    }
};

removePermission = async (userId, roleId, guildId, commandName, channelId) => {
    let targetParentAlias = utils.getParentAlias(commandName);
    if (targetParentAlias === undefined) {
        throw `Permissions: Unknown command ${commandName}`;
    }
    if (userId === null && roleId === null) {
        throw `Permissions: The provided user/role is invalid`;
    }
    let user = settings.client.users.cache.get(userId);
    let role = settings.client.guilds.cache.get(guildId).roles.cache.get(roleId);
    const channelPermissionsDoc = settings.db.collection('permissions').doc('channels').collection(channelId).doc(targetParentAlias);
    await channelPermissionsDoc.set({}, {merge: true});
    if (user !== undefined) {
        await settings.db.runTransaction(async (t) => {
            let doc = await t.get(channelPermissionsDoc);
            let users = doc.data().users !== undefined ? doc.data().users : [];
            t.update(channelPermissionsDoc, {users: users.filter(value => value !== user.id)});
        });
        utils.sendMessage(channelId, `Adjusted permissions of ${user} to the the ${targetParentAlias} command.`);
    } else if (role !== undefined) {
        await settings.db.runTransaction(async (t) => {
            let doc = await t.get(channelPermissionsDoc);
            let roles = doc.data().roles !== undefined ? doc.data().roles : [];
            t.update(channelPermissionsDoc, {roles: roles.filter(value => value !== role.id)});
        });
        utils.sendMessage(channelId, `Adjusted permissions of ${role} to the the ${targetParentAlias} command.`);
    } else {
        throw `Permissions: Something went really wrong`;
    }
};