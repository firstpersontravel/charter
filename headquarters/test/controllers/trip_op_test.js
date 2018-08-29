const assert = require('assert');
const moment = require('moment');
const sinon = require('sinon');

const models = require('../../src/models');
const MessageController = require('../../src/controllers/message');
const TripOpController = require('../../src/controllers/trip_op');
const TripRelaysController = require('../../src/controllers/trip_relays');

const sandbox = sinon.sandbox.create();

describe('TripOpController', () => {

  afterEach(() => {
    sandbox.restore();
  });

  describe('#applyOp', () => {

    describe('updatePlaythrough', () => {
      it('applies a deep value change to a playthrough', async () => {
        const objs = {
          playthrough: {
            values: { abc: 123 },
            save: sandbox.stub().resolves()
          }
        };
        const op = {
          operation: 'updatePlaythrough',
          updates: {
            values: { initiatives: { game_won: { $set: true } } }
          }
        };

        await TripOpController.applyOp(objs, op);
        const newValues = { abc: 123, initiatives: { game_won: true } };
        assert.deepStrictEqual(objs.playthrough.values, newValues);
        sinon.assert.calledWith(objs.playthrough.save,
          { fields: ['values']});
      });
    });

    describe('updateParticipant', () => {
      it('applies a deep value change to a participant', async () => {
        const objs = {
          participants: [{
            roleName: 'Test',
            values: { abc: 123 },
            save: sandbox.stub().resolves()
          }]
        };
        const op = {
          operation: 'updateParticipant',
          roleName: 'Test',
          updates: {
            values: { initiatives: { game_won: { $set: true } } }
          }
        };

        await TripOpController.applyOp(objs, op);
        const newValues = { abc: 123, initiatives: { game_won: true } };
        assert.deepStrictEqual(objs.participants[0].values, newValues);
        sinon.assert.calledWith(objs.participants[0].save,
          { fields: ['values']});
      });
    });

    describe('updateUser', () => {
      it('applies a value change to a user', async () => {
        const objs = {
          users: [{
            id: 1,
            phoneNumber: null,
            save: sandbox.stub().resolves(),
          }],
          participants: [{
            roleName: 'Test',
            userId: 1
          }]
        };
        const op = {
          operation: 'updateUser',
          roleName: 'Test',
          updates: {
            phoneNumber: { $set: '9144844223' }
          }
        };

        await TripOpController.applyOp(objs, op);
        assert.strictEqual(objs.users[0].phoneNumber, '9144844223');
        sinon.assert.calledWith(objs.users[0].save,
          { fields: ['phoneNumber']});
      });
    });

    describe('createMessage', () => {
      it('creates a message', async () => {
        const now = moment.utc();
        const objs = {
          playthrough: { id: 123 }
        };
        const op = {
          operation: 'createMessage',
          updates: {
            sentById: 1,
            sentToId: 2,
            messageType: 'text',
            messageContent: 'hi there',
            createdAt: now,
          },
          suppressRelayId: 5
        };
        const fakeMessage = {};
        sandbox.stub(models.Message, 'create').resolves(fakeMessage);
        sandbox.stub(MessageController, 'sendMessage');
        sandbox.stub(TripRelaysController, 'relayMessage');

        await TripOpController.applyOp(objs, op);
        sinon.assert.calledWith(models.Message.create, {
          createdAt: now.toDate(),
          messageContent: 'hi there',
          messageType: 'text',
          playthroughId: 123,
          readAt: null,
          sentById: 1,
          sentToId: 2
        });
        sinon.assert.calledWith(MessageController.sendMessage,
          fakeMessage);
        sinon.assert.calledWith(TripRelaysController.relayMessage,
          objs.playthrough, fakeMessage, 5);
      });
    });
  });
});
