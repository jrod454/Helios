const config = require("./discordConfig.json");
//Used for testing
// const config = require("./discordConfigHelios.json");
const utils = require('./utils/utils');
const cmdAliasMap = require('./config/cmdAliasMap.json');
const parse = require("discord-command-parser");

const settings = require('./config/settings');
const defaults = require('./config/serverDefaultSettings.json');

const directMessage = require('./handlers/directMessage');

const awardCmd = require('./commands/award');
const curCmd = require('./commands/currency');
const takeCmd = require('./commands/take');
const permCmd = require('./commands/permissions');
const workCmd = require('./commands/work');
const giveCmd = require('./commands/give');
const lbCmd = require('./commands/leaderboard');
const scheduleCmd = require('./commands/schedule');

settings.client.on("message", async function (message) {
    try {
        if (message.author.id === settings.client.user.id) {
            //We ignore messages from the bot
        } else if (message.guild === null) {
            await directMessage.handle(message);
        } else if (message.channel.parentID === settings.getDmCategoryId()) {
            await directMessage.send(message);
        } else {
            if (message.embeds.length === 0) {
                console.log(message.content);
            }
            let parsedMessage = parse.parse(message, defaults.prefix);
            if (parsedMessage.success) {
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

                let commandParentAlias = utils.getParentAlias(parsedMessage.command);
                if (commandParentAlias !== undefined) {
                    await utils.cmdPermissionCheck(parsedMessage.command, message, settings.db);
                    await commandMap.get(commandParentAlias).execute(parsedMessage, message, settings.db);
                }
            }

        }
    } catch (e) {
        console.log(e);
        utils.sendMessage(message.channel.id, e);
    }
});

settings.client.on("ready", async () => {
    await settings.init();
    await scheduleCmd.init();
});

settings.client.login(config.BOT_TOKEN);
