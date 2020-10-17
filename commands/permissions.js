const utils = require('../utils/utils');
const cmdAliasMap = require('../config/cmdAliasMap.json');

module.exports.execute = async (parsedMessage, message, database) => {
    switch (parsedMessage.arguments.length) {
        case 3:
            let subCmd = parsedMessage.reader.getString();
            if (!cmdAliasMap.permissions.subCommands.includes(subCmd)) {
                throw `${subCmd} is not a valid sub command`;
            }
            let targetCmd = parsedMessage.reader.getString();
            let targetParentAlias = utils.getParentAlias(targetCmd);
            if (targetParentAlias === undefined) {
                throw `${targetCmd} is not a known command`;
            }
            let userId = parsedMessage.reader.getUserID(true);
            let roleId = parsedMessage.reader.getRoleID(true);
            if (userId === null && roleId === null) {
                utils.sendMessage(message.channel.id, `The provided user/role is invalid\nArguments: ${parsedMessage.arguments}`);
                break;
            }

            const channelPermissionsDoc = database.collection('permissions').doc('channels').collection(message.channel.id).doc(targetParentAlias);
            await channelPermissionsDoc.set({}, {merge: true});
            if (userId !== null) {
                let user = message.guild.members.cache.get(userId);
                await database.runTransaction(async (t) => {
                    let doc = await t.get(channelPermissionsDoc);
                    let users = doc.data().users;
                    if (users === undefined) {
                        if (subCmd === "add") {
                            t.update(channelPermissionsDoc, {users: [user.id]});
                        } else if (subCmd === "remove") {
                            t.update(channelPermissionsDoc, {users: []});
                        }
                    } else {
                        if (subCmd === "add") {
                            let allUniqueUsers = users.concat(user.id);
                            allUniqueUsers = allUniqueUsers.filter((item, index) => {
                                return allUniqueUsers.indexOf(item) === index;
                            });
                            t.update(channelPermissionsDoc, {users: allUniqueUsers});
                        } else if (subCmd === "remove") {
                            t.update(channelPermissionsDoc, {users: users.filter(value => value !== user.id)});
                        }
                    }
                });
                message.channel.send(utils.createSuccessEmbed(`Adjusted permissions of ${user} to the the ${targetParentAlias} command.`));
            } else if (roleId !== null) {
                let role = message.guild.roles.cache.get(roleId);
                await database.runTransaction(async (t) => {
                    let doc = await t.get(channelPermissionsDoc);
                    let roles = doc.data().roles;
                    if (roles === undefined) {
                        if (subCmd === "add") {
                            t.update(channelPermissionsDoc, {roles: [role.id]});
                        } else if (subCmd === "remove") {
                            t.update(channelPermissionsDoc, {roles: []});
                        }
                    } else {
                        if (subCmd === "add") {
                            let allUniqueRoles = roles.concat(role.id);
                            allUniqueRoles = allUniqueRoles.filter((item, index) => {
                                return allUniqueRoles.indexOf(item) === index;
                            });
                            t.update(channelPermissionsDoc, {roles: allUniqueRoles});
                        } else if (subCmd === "remove") {
                            t.update(channelPermissionsDoc, {roles: roles.filter(value => value !== role.id)});
                        }
                    }
                });
                utils.sendMessage(message.channel.id, `Adjusted permissions of ${role} to the the ${targetParentAlias} command.`);
            }
            break;
        default:
            utils.sendMessage(message.channel.id, `Invalid permissions command`);
    }
};