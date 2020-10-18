const utils = require('../utils/utils');
const cmdAliasMap = require('../config/cmdAliasMap.json');
const scheduleCurrency = require('../commands/schedule-currency');

module.exports.execute = async (parsedMessage, message, database) => {
    parsedMessage.reader.seek();
    if (cmdAliasMap.schedule.subCommands.includes(parsedMessage.arguments[0])) {
        switch (parsedMessage.arguments[0]) {
            case "currency":
                await scheduleCurrency.execute(parsedMessage, message, database);
                break;
            default:
                throw `Invalid/not implemented sub command of schedule`;
        }
    } else {
        throw `Unknown sub command of schedule`;
    }
};

module.exports.init = async () => {
    await scheduleCurrency.init();
};