const assert = require('assert');
const moment = require('moment');
const sinon = require('sinon');

const { sandbox } = require('../mocks');
const models = require('../../src/models');
const EmailController = require('../../src/controllers/email');
const MessageController = require('../../src/controllers/message');
const KernelOpController = require('../../src/kernel/op');
const TripRelaysController = require('../../src/controllers/trip_relays');

describe('KernelOpController', () => {
  describe('#applyOp', () => {
    it.skip('calls op function by name', () => {});
  });

  describe('#updateTripFields', () => {
    it('applies a field change to a trip', async () => {
      const objs = { trip: { update: sandbox.stub().resolves() } };
      const op = {
        operation: 'updateTripFields',
        fields: { newField: '123' }
      };

      await KernelOpController.applyOp(objs, op);

      sinon.assert.calledWith(objs.trip.update, { newField: '123' });
    });
  });

  describe('#updateTripValues', () => {
    it('applies a value change to a trip', async () => {
      const objs = {
        trip: { values: { abc: 123 }, update: sandbox.stub().resolves() }
      };
      const op = {
        operation: 'updateTripValues',
        values: { game_won: true }
      };

      await KernelOpController.applyOp(objs, op);

      const newValues = { abc: 123, game_won: true };
      sinon.assert.calledWith(objs.trip.update, { values: newValues });
    });
  });

  describe('#updateTripHistory', () => {
    it('applies a history change to a trip', async () => {
      const objs = {
        trip: { history: { t1: 123 }, update: sandbox.stub().resolves() }
      };
      const op = {
        operation: 'updateTripHistory',
        history: { t2: 456 }
      };

      await KernelOpController.applyOp(objs, op);

      const newHistory = { t1: 123, t2: 456 };
      sinon.assert.calledWith(objs.trip.update, { history: newHistory });
    });
  });

  describe('#updatePlayerFields', () => {
    it('applies a deep value change to a player', async () => {
      const objs = {
        players: [{ roleName: 'Test', update: sandbox.stub().resolves() }]
      };
      const op = {
        operation: 'updatePlayerFields',
        roleName: 'Test',
        fields: { field: true }
      };

      await KernelOpController.applyOp(objs, op);

      sinon.assert.calledWith(objs.players[0].update, { field: true });
    });
  });

  describe('#createMessage', () => {
    it('creates a message', async () => {
      const now = moment.utc();
      const objs = {
        trip: { id: 123, orgId: 456, experienceId: 789 },
        players: [
          { roleName: 'BadGuy', id: 10 },
          { roleName: 'GoodGuy', id: 20 }
        ]
      };
      const op = {
        operation: 'createMessage',
        fields: {
          sentByRoleName: 'BadGuy',
          sentToRoleName: 'GoodGuy',
          medium: 'text',
          content: 'die!',
          createdAt: now,
        },
        suppressRelayId: 5
      };
      const fakeMessage = {};
      sandbox.stub(models.Message, 'create').resolves(fakeMessage);
      sandbox.stub(MessageController, 'sendMessage');
      sandbox.stub(TripRelaysController, 'relayMessage');

      await KernelOpController.applyOp(objs, op);

      sinon.assert.calledOnce(models.Message.create);
      assert.deepStrictEqual(models.Message.create.firstCall.args, [{
        createdAt: now.toDate(),
        content: 'die!',
        medium: 'text',
        name: undefined,
        orgId: 456,
        experienceId: 789,
        isInGallery: undefined,
        isReplyNeeded: undefined,
        tripId: 123,
        readAt: null,
        sentById: 10,
        sentToId: 20,
        sentFromAccuracy: undefined,
        sentFromLatitude: undefined,
        sentFromLongitude: undefined
      }]);
      sinon.assert.calledWith(MessageController.sendMessage, fakeMessage);
      sinon.assert.calledWith(TripRelaysController.relayMessage, objs.trip,
        fakeMessage, 5);
    });
  });

  describe('#sendEmail', () => {
    it('sends an email', async () => {
      sandbox.stub(EmailController, 'sendEmail');
      const op = {
        operation: 'sendEmail',
        params: {
          from: 'from@email.com',
          to: 'to@email.com',
          subject: 'subj',
          bodyMarkdown: '# header\n\nbody'
        }
      };

      await KernelOpController.applyOp({}, op);

      sinon.assert.calledOnce(EmailController.sendEmail);
      sinon.assert.calledWith(EmailController.sendEmail, op.params);
    });
  });
});
