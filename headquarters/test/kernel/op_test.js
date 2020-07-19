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
        players: [{ id: 'somePlayerId', update: sandbox.stub().resolves() }]
      };
      const op = {
        operation: 'updatePlayerFields',
        playerId: 'somePlayerId',
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
          fromRoleName: 'BadGuy',
          toRoleName: 'GoodGuy',
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
        orgId: 456,
        experienceId: 789,
        isInGallery: undefined,
        isReplyNeeded: undefined,
        tripId: 123,
        fromRoleName: 'BadGuy',
        toRoleName: 'GoodGuy'
      }]);
      sinon.assert.calledWith(MessageController.sendMessage, fakeMessage);
      sinon.assert.calledWith(TripRelaysController.relayMessage, objs.trip,
        fakeMessage, 5);
    });
  });

  describe('#sendEmail', () => {
    const op = {
      operation: 'sendEmail',
      fromEmail: 'from@email.com',
      toRoleName: 'Recipient',
      subject: 'subj',
      bodyMarkdown: '# header\n\nbody'
    };

    beforeEach(() => {
      sandbox.stub(EmailController, 'sendEmail');
    });

    it('sends an email to all players with email addresses', async () => {
      const objs = {
        players: [
          { roleName: 'Recipient', participantId: 3 },
          { roleName: 'Recipient', participantId: 4 },
          { roleName: 'Other', participantId: 5 }
        ],
        participants: [
          { id: 3, email: 'recipient@test.com' },
          { id: 4, email: 'recipient_2@test.com' },
          { id: 5, email: 'recipient_3@test.com' }
        ]
      };

      await KernelOpController.applyOp(objs, op);

      sinon.assert.calledTwice(EmailController.sendEmail);
      sinon.assert.calledWith(EmailController.sendEmail.getCall(0), 
        'from@email.com', 'recipient@test.com', op.subject, op.bodyMarkdown);
      sinon.assert.calledWith(EmailController.sendEmail.getCall(1), 
        'from@email.com', 'recipient_2@test.com', op.subject, op.bodyMarkdown);
    });

    it('sends no emails if no players match', async () => {
      const objs = {
        players: [
          { roleName: 'Other', participantId: 5 },
          { roleName: 'NoUser', participantId: null }
        ],
        participants: []
      };

      await KernelOpController.applyOp(objs, op);

      sinon.assert.notCalled(EmailController.sendEmail);
    });

    it('sends no emails if no players have emails', async () => {
      const objs = {
        players: [{ roleName: 'Recipient', participantId: 5 }],
        participants: [{ id: 5, email: '' }]
      };

      await KernelOpController.applyOp(objs, op);

      sinon.assert.notCalled(EmailController.sendEmail);
    });

    it('sends no emails if player has no participant', async () => {
      const objs = {
        players: [{ roleName: 'Recipient', participantId: null }],
        participants: [{ id: 5, email: 'abc@123.com' }]
      };

      await KernelOpController.applyOp(objs, op);

      sinon.assert.notCalled(EmailController.sendEmail);
    });
  });
});
