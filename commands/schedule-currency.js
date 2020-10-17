const utils = require('../utils/utils');
const schedule = require('node-schedule');

let allCurrencySchedules = new Map();
module.exports.execute = async (parsedMessage, message, database) => {
    switch (parsedMessage.arguments.length) {
        case 4:
            let amount = utils.parseCurrencyAmount(parsedMessage.reader.getString());
            if (amount !== null) {
                let userId = parsedMessage.reader.getUserID(true);
                let roleId = parsedMessage.reader.getRoleID(true);
                if (userId === null && roleId === null) {
                    throw `The provided user/role is invalid\nArguments: ${parsedMessage.arguments}`;
                }
                parsedMessage.reader.seek();
                let scheduleString = parsedMessage.reader.getString();
                console.log(scheduleString);
                let scheduleObject = parseSchedule(scheduleString);
                console.log(scheduleObject);

                let s = null;
                if (userId !== null) {
                    let user = message.guild.members.cache.get(userId);
                    s = new schedule.scheduleJob(scheduleObject.rule, () => {
                        utils.addCurrencyToUser(userId, amount, false, message, database).then(() => {
                            utils.sendMessage(message.channel.id, `Sent scheduled payout of ${amount} to ${user}.`);
                        });
                    });
                } else if (roleId !== null) {
                    let role = message.guild.roles.cache.get(roleId);
                    s = new schedule.scheduleJob(scheduleObject.rule, () => {
                        utils.addCurrencyToRole(roleId, amount, false, message, database).then(() => {
                            utils.sendMessage(message.channel.id, `Sent scheduled payout of ${amount} to ${role}.`);
                        });
                    });
                }
                let storageResult = await database.collection("servers").doc(message.guild.id).collection("schedules").add({
                    type: "currency",
                    rule: scheduleObject.input
                });
                allCurrencySchedules.set(storageResult.id, scheduleObject);
            }
            break;
        default:
            throw `Schedule-currency: Unknown command`;
    }
};

parseSchedule = (scheduleString) => {
    let tokens = scheduleString.split(" ");
    let regexMap = new Map();
    regexMap.set("second", /^([1-5]?[0-9])s$/);
    regexMap.set("minute", /^([1-5]?[0-9])m$/);
    regexMap.set("hour", /^(2[0-3]|1?[0-9])h$/);
    regexMap.set("dayOfWeek", /^([0-6])dw$/);
    regexMap.set("dayOfMonth", /^(30|[1-2]?[0-9])dm$/);
    regexMap.set("month", /^(1[0-1]|[0-9])mo$/);

    let allValidTokens = !tokens.some(token => {
        return ![...regexMap.values()].some(regex => regex.test(token));
    });

    if (allValidTokens) {
        let rule = new schedule.RecurrenceRule();
        let result = {};
        result.input = {};
        tokens.forEach(token => {
            if (regexMap.get("second").test(token)) {
                let value = token.match(regexMap.get("second"))[1];
                result.input.second = Number.parseInt(value);
                rule.second = Number.parseInt(value);
            } else if (regexMap.get("minute").test(token)) {
                let value = token.match(regexMap.get("minute"))[1];
                result.input.minute = Number.parseInt(value);
                rule.minute = Number.parseInt(value);
            } else if (regexMap.get("hour").test(token)) {
                let value = token.match(regexMap.get("hour"))[1];
                result.input.hour = Number.parseInt(value);
                rule.hour = Number.parseInt(value);
            } else if (regexMap.get("dayOfWeek").test(token)) {
                let value = token.match(regexMap.get("dayOfWeek"))[1];
                result.input.dayOfWeek = Number.parseInt(value);
                rule.dayOfWeek = Number.parseInt(value);
            } else if (regexMap.get("dayOfMonth").test(token)) {
                let value = token.match(regexMap.get("dayOfMonth"))[1];
                //Add one because i wanted it to start at 0 like the rest of them
                result.input.dayOfMonth = Number.parseInt(value) + 1;
                rule.date = Number.parseInt(value) + 1;
            } else if (regexMap.get("month").test(token)) {
                let value = token.match(regexMap.get("month"))[1];
                result.input.month = Number.parseInt(value);
                rule.month = Number.parseInt(value);
            }
        });
        result.rule = rule;
        if (result.rule.second === null) {
            result.rule.second = new schedule.Range(0, 59);
        }
        if (result.rule.minute === null) {
            result.rule.minute = new schedule.Range(0, 59);
        }
        if (result.rule.hour === null) {
            result.rule.hour = new schedule.Range(0, 23);
        }
        if (result.rule.dayOfWeek === null) {
            result.rule.dayOfWeek = new schedule.Range(0, 6);
        }
        if (result.rule.dayOfMonth === null) {
            result.rule.date = new schedule.Range(1, 31);
        }
        if (result.rule.month === null) {
            result.rule.month = new schedule.Range(0, 11);
        }
        return result;
    } else {
        throw `Schedule-currency: Invalid schedule string`;
    }
};

getRecurrenceObject = (parsedMessage) => {
    let argument = null;
    let rule = new schedule.RecurrenceRule();
    let secondRegex = /^([1-5]?[0-9])s$/;
    let minuteRegex = /^([1-5]?[0-9])m$/;
    let hourRegex = /^(2[0-3]|1?[0-9])h$/;
    let dayOfWeekRegex = /^([0-6])dw$/;
    let dayOfMonthRegex = /^(30|[1-2]?[0-9])dm$/;
    let monthRegex = /^(1[0-1]|[0-9])mo$/;
    let result = {};
    while (argument = parsedMessage.reader.getString()) {
        if (secondRegex.test(argument)) {
            let value = argument.match(secondRegex)[1];
            result.second = Number.parseInt(value);
            rule.second = Number.parseInt(value);
        } else if (minuteRegex.test(argument)) {
            let value = argument.match(minuteRegex)[1];
            result.minute = Number.parseInt(value);
            rule.minute = Number.parseInt(value);
        } else if (hourRegex.test(argument)) {
            let value = argument.match(hourRegex)[1];
            result.hour = Number.parseInt(value);
            rule.hour = Number.parseInt(value);
        } else if (dayOfWeekRegex.test(argument)) {
            let value = argument.match(dayOfWeekRegex)[1];
            result.dayOfWeek = Number.parseInt(value);
            rule.dayOfWeek = Number.parseInt(value);
        } else if (dayOfMonthRegex.test(argument)) {
            let value = argument.match(dayOfMonthRegex)[1];
            //Add one because i wanted it to start at 0 like the rest of them
            result.dayOfMonth = Number.parseInt(value) + 1;
            rule.date = Number.parseInt(value) + 1;
        } else if (monthRegex.test(argument)) {
            let value = argument.match(monthRegex)[1];
            result.month = Number.parseInt(value);
            rule.month = Number.parseInt(value);
        } else {
            break;
        }
    }
    result.rule = rule;
    return result;
};