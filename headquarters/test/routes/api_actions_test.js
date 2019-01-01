const assert = require('assert');
const httpMocks = require('node-mocks-http');
const sinon = require('sinon');

const { sandbox } = require('../mocks');
const apiActionsRoutes = require('../../src/routes/api_actions');
const TripActionController = require('../../src/controllers/trip_action');
const TripNotifyController = require('../../src/controllers/trip_notify');
const UserController = require('../../src/controllers/user');

describe('apiActionsRoutes', () => {
  describe('#createActionRoute', () => {
    it('applies and notifies on an action', async () => {
      const req = httpMocks.createRequest({
        params: { tripId: 100 },
        body: { name: 'action_name', params: { param: true }, client_id: 123 }
      });
      const res = httpMocks.createResponse();

      // Stub action response
      sandbox.stub(TripActionController, 'applyAction').resolves();
      sandbox.stub(TripNotifyController, 'notifyAction').resolves();

      await apiActionsRoutes.createActionRoute(req, res);

      // Check response
      const expected = { data: { ok: true } };
      assert.strictEqual(res.statusCode, 200);
      assert.deepStrictEqual(JSON.parse(res._getData()), expected);

      // Check apply called with correct args
      const action = { name: 'action_name', params: { param: true } };
      sinon.assert.calledOnce(TripActionController.applyAction);
      assert.deepStrictEqual(
        TripActionController.applyAction.firstCall.args, [100, action]);

      // Check notify called with correct args
      sinon.assert.calledOnce(TripNotifyController.notifyAction);
      assert.deepStrictEqual(
        TripNotifyController.notifyAction.firstCall.args,
        [100, action, req.body.client_id]);
    });
  });

  describe('#createEventRoute', () => {
    it('applies and notifies on an event', async () => {
      const req = httpMocks.createRequest({
        params: { tripId: 100 },
        body: { type: 'cue_signaled', cue_name: 'hi', client_id: 123 }
      });
      const res = httpMocks.createResponse();

      // Stub action response
      sandbox.stub(TripActionController, 'applyEvent').resolves();
      sandbox.stub(TripNotifyController, 'notifyEvent').resolves();

      await apiActionsRoutes.createEventRoute(req, res);

      // check response
      const expected = { data: { ok: true } };
      assert.strictEqual(res.statusCode, 200);
      assert.deepStrictEqual(JSON.parse(res._getData()), expected);

      // Check apply called with correct args
      const event = { type: 'cue_signaled', cue_name: 'hi' };
      sinon.assert.calledOnce(TripActionController.applyEvent);
      assert.deepStrictEqual(
        TripActionController.applyEvent.firstCall.args, [100, event]);

      // Check notify called with correct args
      sinon.assert.calledOnce(TripNotifyController.notifyEvent);
      assert.deepStrictEqual(
        TripNotifyController.notifyEvent.firstCall.args,
        [100, event, req.body.client_id]);
    });
  });

  describe('#updateDeviceStateRoute', () => {
    it('updates device state', async () => {
      const req = httpMocks.createRequest({
        params: { userId: 100 },
        body: {
          client_id: 123,
          location_latitude: '40.2',
          location_longitude: '50.5',
          location_accuracy: '30',
          location_timestamp: '12345678',
          device_is_active: 'false',
          device_battery: '0.50'
        }
      });
      const res = httpMocks.createResponse();

      // Stub update response
      sandbox.stub(UserController, 'updateDeviceState').resolves();

      await apiActionsRoutes.updateDeviceStateRoute(req, res);

      // check response
      const expected = { data: { ok: true } };
      assert.strictEqual(res.statusCode, 200);
      assert.deepStrictEqual(JSON.parse(res._getData()), expected);

      // Check update called with correct args
      const params = {
        locationLatitude: 40.2,
        locationLongitude: 50.5,
        locationAccuracy: 30,
        locationTimestamp: 12345678,
        deviceIsActive: false,
        deviceBattery: 0.5
      };
      sinon.assert.calledOnce(UserController.updateDeviceState);
      assert.deepStrictEqual(
        UserController.updateDeviceState.firstCall.args, [100, params, 123]);
    });
  });
});
