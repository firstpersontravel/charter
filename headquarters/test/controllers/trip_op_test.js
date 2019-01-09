const moment = require('moment');
const sinon = require('sinon');

const { sandbox } = require('../mocks');
const models = require('../../src/models');
const MessageController = require('../../src/controllers/message');
const TripOpController = require('../../src/controllers/trip_op');
const TripRelaysController = require('../../src/controllers/trip_relays');

describe('TripOpController', () => {
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

      await TripOpController.applyOp(objs, op);

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

      await TripOpController.applyOp(objs, op);

      const newValues = { abc: 123, game_won: true };
      sinon.assert.calledWith(objs.trip.update, { values: newValues });
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

      await TripOpController.applyOp(objs, op);

      sinon.assert.calledWith(objs.players[0].update, { field: true });
    });
  });

  describe('#createMessage', () => {
    it('creates a message', async () => {
      const now = moment.utc();
      const objs = { trip: { id: 123, orgId: 456 } };
      const op = {
        operation: 'createMessage',
        fields: {
          sentById: 1,
          sentToId: 2,
          medium: 'text',
          content: 'hi there',
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
        content: 'hi there',
        medium: 'text',
        orgId: 456,
        tripId: 123,
        readAt: null,
        sentById: 1,
        sentToId: 2
      });
      sinon.assert.calledWith(MessageController.sendMessage, fakeMessage);
      sinon.assert.calledWith(TripRelaysController.relayMessage, objs.trip,
        fakeMessage, 5);
    });
  });
});
