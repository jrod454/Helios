module.exports.getUserCurrency = async (userId, database) => {
    let result = 0;
    const userDoc = database.collection('users').doc(userId);
    await userDoc.set({}, {merge: true});
    await database.runTransaction(async (t) => {
        let currencyValue = await (await t.get(userDoc)).data().currency;
        if (currencyValue === undefined) {
            t.update(userDoc, {currency: 0});
            result = 0;
        } else {
            result = currencyValue;
        }
    });
    return result;
};