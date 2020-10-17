const utils = require('../utils/utils');

module.exports.execute = async (parsedMessage, message, database) => {
    const snapshot = await database.collection('users').get();
    let allData = snapshot.docs.map(doc => {
        return {id: doc.id, ...doc.data()};
    });
    allData.forEach(value => {
        if (value.currency === undefined) {
            value.currency = 0;
        }
    });
    allData.sort((a, b) => {
        return b.currency - a.currency;
    });
    console.log(allData);

    let finalText = "";
    allData.forEach(value => {
        let user = utils.getUser(value.id, message);
        if (user === undefined) {
            finalText += `${value.id}: ${value.currency}\n`
        } else {
            finalText += `${user}: ${value.currency}\n`;
        }
    });

    console.log(finalText);

    message.channel.send(utils.createSuccessEmbed(finalText));
};