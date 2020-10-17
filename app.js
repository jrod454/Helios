const config = require("./config/discordConfig.json");
const utils = require('./utils/utils');
const cmdAliasMap = require('./config/cmdAliasMap.json');
const parse = require("discord-command-parser");

const settings = require('./config/settings');

const awardCmd = require('./commands/award');
const curCmd = require('./commands/currency');
const takeCmd = require('./commands/take');
const permCmd = require('./commands/permissions');
const workCmd = require('./commands/work');
const giveCmd = require('./commands/give');
const lbCmd = require('./commands/leaderboard');
const scheduleCmd = require('./commands/schedule');

settings.client.on("message", async function (message) {
    console.log(message.content);
    let parsedMessage = parse.parse(message, "$");
    let commandMap = new Map();
    commandMap.set("award", awardCmd);
    commandMap.set("currency", curCmd);
    commandMap.set("take", takeCmd);
    commandMap.set("permissions", permCmd);
    commandMap.set("work", workCmd);
    commandMap.set("give", giveCmd);
    commandMap.set("leaderboard", lbCmd);
    commandMap.set("schedule", scheduleCmd);
    commandMap.set("settings", settings);
    try {
        if (parsedMessage.success) {
            let commandParentAlias = utils.getParentAlias(parsedMessage.command);
            if (commandParentAlias !== undefined) {
                await utils.cmdPermissionCheck(parsedMessage.command, message, settings.db);
                await commandMap.get(commandParentAlias).execute(parsedMessage, message, settings.db);
            }
        }
    } catch (e) {
        console.log(e);
        utils.sendMessage(message.channel.id, e);
    }
});

settings.client.on("ready", async () => {
    await settings.init();
});

settings.client.login(config.BOT_TOKEN);
