const assert = require('assert');
const httpMocks = require('node-mocks-http');
const moment = require('moment');
const Sequelize = require('sequelize');
const sinon = require('sinon');

const apiRestRoutes = require('../../src/routes/api_rest');

const sandbox = sinon.sandbox.create();

const sequelize = new Sequelize({
  dialect: 'sqlite'
});

const Model = sequelize.define('model', {
  title: Sequelize.STRING,
  timestamp: { type: Sequelize.DATE }
}, {
  timestamps: false
});

const sampleRecord1 = Model.build({
  id: 1,
  title: 'abc',
  timestamp: moment.utc('2018-02-04T04:05:06Z').toDate()
});
const sampleRecord2 = Model.build({
  id: 2,
  title: 'def',
  timestamp: moment.utc('2018-03-05T04:05:06Z').toDate()
});

async function assertThrows(fn, status, message) {
  let caughtErr = null;
  try {
    await fn();
  } catch(err) {
    caughtErr = err;
  } finally {
    if (!caughtErr) {
      assert.fail('Function should have thrown an error.');
    } else {
      assert.strictEqual(caughtErr.status, status);
      assert.strictEqual(caughtErr.message, message);
    }
  }
}

describe('apiRestRoutes', () => {
  afterEach(() => {
    sandbox.restore();
  });

  describe('#listCollectionRoute', () => {
    it('lists a collection', async () => {
      const req = httpMocks.createRequest({ query: { offset: 1, count: 5 } });
      const res = httpMocks.createResponse();

      sandbox.stub(Model, 'findAll').resolves([sampleRecord1, sampleRecord2]);

      // Call the route
      await apiRestRoutes.listCollectionRoute(Model)(req, res);

      // Check response
      assert.strictEqual(res.statusCode, 200);
      assert.deepStrictEqual(JSON.parse(res._getData()), {
        data: {
          models: [{
            id: 1,
            timestamp: '2018-02-04T04:05:06.000Z',
            title: 'abc'
          }, {
            id: 2,
            timestamp: '2018-03-05T04:05:06.000Z',
            title: 'def'
          }]
        }
      });

      // Assert find call made
      sinon.assert.calledWith(Model.findAll, {
        limit: 5,
        offset: 1,
        order: []
      });
    });

    it('sorts ascending', async () => {
      const req = httpMocks.createRequest({
        query: { offset: 1, sort: 'id' }
      });
      const res = httpMocks.createResponse();

      sandbox.stub(Model, 'findAll').resolves([]);

      // Call the route
      await apiRestRoutes.listCollectionRoute(Model)(req, res);

      // Assert find call made
      sinon.assert.calledWith(Model.findAll, {
        limit: 100,
        offset: 1,
        order: [['id', 'ASC']]
      });
    });

    it('sorts descending', async () => {
      const req = httpMocks.createRequest({
        query: { offset: 1, sort: '-title' }
      });
      const res = httpMocks.createResponse();

      sandbox.stub(Model, 'findAll').resolves([]);

      // Call the route
      await apiRestRoutes.listCollectionRoute(Model)(req, res);

      // Assert find call made
      sinon.assert.calledWith(Model.findAll, {
        limit: 100,
        offset: 1,
        order: [['title', 'DESC']]
      });
    });

    it('returns bad request on invalid sort param', async () => {
      const req = httpMocks.createRequest({
        query: { offset: 1, sort: 'abc' }
      });
      const res = httpMocks.createResponse();

      sandbox.stub(Model, 'findAll').resolves([]);

      // Call the route
      await assertThrows(async () => {
        await apiRestRoutes.listCollectionRoute(Model)(req, res);
      }, 400, 'Invalid sort parameter: abc.');
    });
  });

  describe('#createRecordRoute', () => {
    it('creates a record', async () => {
      const req = httpMocks.createRequest({
        body: {
          title: 'ghi',
          timestamp: '2018-01-01T04:05:06.000Z'
        }
      });
      const res = httpMocks.createResponse();
      let record;

      sandbox.stub(Model, 'build').callsFake(() => {
        record = new Model();
        sandbox.stub(record, 'save').callsFake(() => {
          record.id = 3;
        });
        return record;
      });

      // Call the route
      await apiRestRoutes.createRecordRoute(Model)(req, res);

      // Check response
      assert.strictEqual(res.statusCode, 201);
      assert.deepStrictEqual(JSON.parse(res._getData()), {
        data: {
          model: {
            id: 3,
            timestamp: '2018-01-01T04:05:06.000Z',
            title: 'ghi'
          }
        }
      });

      // Assert fields updated
      assert.deepStrictEqual(record.dataValues, {
        id: 3,
        title: req.body.title,
        timestamp: moment.utc(req.body.timestamp).toDate()
      });

      // Assert create call made
      sinon.assert.calledOnce(record.save);
      assert.deepStrictEqual(record.save.firstCall.args, [
        { fields: ['title', 'timestamp'] }
      ]);
    });

    it('does not allow creation with id', async () => {
      const req = httpMocks.createRequest({
        body: {
          id: 5,
          title: 'ghi',
          timestamp: '2018-01-01T04:05:06.000Z'
        }
      });
      const res = httpMocks.createResponse();

      // Call the route
      await assertThrows(async () => {
        await apiRestRoutes.createRecordRoute(Model)(req, res);
      }, 400, 'Id is not allowed on create.');
    });
  });

  describe('#retrieveRecordRoute', () => {
    it('returns a record', async () => {
      const req = httpMocks.createRequest({ params: { recordId: '10' } });
      const res = httpMocks.createResponse();

      sandbox.stub(Model, 'findById').resolves(sampleRecord1);

      // Call the route
      await apiRestRoutes.retrieveRecordRoute(Model)(req, res);

      // Check response
      assert.strictEqual(res.statusCode, 200);
      assert.deepStrictEqual(JSON.parse(res._getData()), {
        data: {
          model: {
            id: 1,
            timestamp: '2018-02-04T04:05:06.000Z',
            title: 'abc'
          }
        }
      });

      // Assert find call made
      sinon.assert.calledWith(Model.findById, 10);
    });

    it('returns 404 if not found', async () => {
      const req = httpMocks.createRequest({ params: { recordId: '10' } });
      const res = httpMocks.createResponse();

      sandbox.stub(Model, 'findById').resolves(null);

      // Call the route
      await assertThrows(async () => {
        await apiRestRoutes.retrieveRecordRoute(Model)(req, res);
      }, 404, 'Record not found.');
    });
  });
});
