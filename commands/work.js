const utils = require('../utils/utils');
const settings = require('../config/settings');

module.exports.execute = async (parsedMessage, message, database) => {
    if (parsedMessage.arguments.length === 0) {
        let user = message.author;
        const userDoc = database.collection('users').doc(user.id);
        await userDoc.set({}, {merge: true});

        let workAmount = await settings.getWorkPayout(message);
        let workInterval = await settings.getWorkInterval(message);

        await database.runTransaction(async (t) => {
            let doc = await t.get(userDoc);
            let lastWorkDate = doc.data().lastWorkDate;

            if (lastWorkDate === undefined) {
                t.update(userDoc, {lastWorkDate: new Date().getTime()});
            } else {
                let currentDate = new Date().getTime();
                console.log(currentDate - lastWorkDate);
                if ((currentDate - lastWorkDate) > workInterval) {
                    t.update(userDoc, {lastWorkDate: currentDate});
                } else {
                    throw `Not enough time has passed since the last time you ran the work command`;
                }
            }
        }).then(async () => {
            await utils.addCurrencyToUser(user.id, workAmount, true, message, database);
            utils.sendMessage(message.channel.id, `${user} worked for ${workAmount}`);
        }).catch(reason => {
            console.log(reason);
            utils.sendMessage(message.channel.id, reason);
        });
    } else {
        utils.sendMessage(message.channel.id, `Too many arguments to the work command`);
    }



};