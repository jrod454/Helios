const utils = require('../utils/utils');
const cmdAliasMap = require('../config/cmdAliasMap.json');
const scheduleCurrency = require('../commands/schedule-currency');

module.exports.execute = async (parsedMessage, message, database) => {
    switch (parsedMessage.arguments.length) {
        case 4:
            let subCommand = parsedMessage.reader.getString();
            if (cmdAliasMap.schedule.subCommands.includes(subCommand)) {
                switch (subCommand) {
                    case "currency":
                        await scheduleCurrency.execute(parsedMessage, message, database);
                        break;
                    default:
                        throw `Invalid/not implemented sub command of schedule`;
                }
            } else {
                throw `Unknown sub command of schedule`;
            }
            break;
        default:
            throw `Schedule: Invalid number of arguments`;
    }
};