const expect = require('chai').expect;
const sinon = require('sinon');
const Firestore = require('@google-cloud/firestore');
const db = new Firestore({
    projectId: 'sofia-1b7ee',
    keyFilename: 'sofia-1b7ee-4f5cc376d00a.json',
});

const awardCmd = require('../commands/award');

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
let assert = chai.assert;

describe("Award command tests", () => {
    it('parsedMessage getRemaining returns null', () => {
        let fake = sinon.fake.returns(null);
        let test = {reader: {getRemaining: fake}};
        return assert.isRejected(awardCmd.execute(test, null, null), "Award must have at least 2 arguments");
    })

    it('parsedMessage getRemaining returns empty string', async () => {
        let fake = sinon.fake.returns("");
        let test = {reader: {getRemaining: fake}};
        return assert.isRejected(awardCmd.execute(test, null, null), "Wrong number of arguments\nArguments: ");
    })


})