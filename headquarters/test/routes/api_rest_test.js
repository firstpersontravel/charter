const assert = require('assert');
const httpMocks = require('node-mocks-http');
const moment = require('moment');
const Sequelize = require('sequelize');
const sinon = require('sinon');

const { sandbox } = require('../mocks');
const apiRestRoutes = require('../../src/routes/api_rest');
const errors = require('../../src/errors');

const sequelize = new Sequelize({
  dialect: 'sqlite'
});

const Model = sequelize.define('model', {
  title: Sequelize.STRING,
  timestamp: { type: Sequelize.DATE },
  isShiny: Sequelize.BOOLEAN
}, {
  timestamps: false
});

const sampleRecord1 = Model.build({
  id: 1,
  isShiny: false,
  title: 'abc',
  timestamp: moment.utc('2018-02-04T04:05:06Z').toDate()
});
const sampleRecord2 = Model.build({
  id: 2,
  isShiny: true,
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
      if (!caughtErr.status) {
        assert.fail(`Expected status but got "${caughtErr.message}".`);
      }
      assert.strictEqual(caughtErr.status, status);
      assert.strictEqual(caughtErr.message, message);
    }
  }
}

describe('apiRestRoutes', () => {
  let dummyAuthz;
  let req;
  let res;

  beforeEach(() => {
    dummyAuthz = {
      checkRecord: sinon.stub().returns(null),
      checkFields: sinon.stub().returns(null)
    };
    req = httpMocks.createRequest();
    res = httpMocks.createResponse();
  });

  describe('#listCollectionRoute', () => {
    it('lists a collection', async () => {
      req.query = { offset: 1, count: 5 };
      sandbox.stub(Model, 'findAll').resolves([sampleRecord1, sampleRecord2]);

      // Call the route
      await apiRestRoutes.listCollectionRoute(Model, dummyAuthz)(req, res);

      // Check response
      assert.strictEqual(res.statusCode, 200);
      assert.deepStrictEqual(JSON.parse(res._getData()), {
        data: {
          models: [{
            id: 1,
            isShiny: false,
            timestamp: '2018-02-04T04:05:06.000Z',
            title: 'abc'
          }, {
            id: 2,
            isShiny: true,
            timestamp: '2018-03-05T04:05:06.000Z',
            title: 'def'
          }]
        }
      });

      // Assert find call made
      sinon.assert.calledWith(Model.findAll, {
        limit: 5,
        offset: 1,
        order: [['id', 'ASC']],
        where: {}
      });
    });

    it('calls authorizer', async () => {
      req.query = { offset: 1, count: 5 };
      sandbox.stub(Model, 'findAll').resolves([sampleRecord1, sampleRecord2]);

      // Call the route
      await apiRestRoutes.listCollectionRoute(Model, dummyAuthz)(req, res);

      // Assert authz calls are made
      sinon.assert.calledTwice(dummyAuthz.checkRecord);
      sinon.assert.calledWith(dummyAuthz.checkRecord,
        req, 'retrieve', Model, sampleRecord1);
      sinon.assert.calledWith(dummyAuthz.checkRecord,
        req, 'retrieve', Model, sampleRecord2);
    });

    it('returns error if authorizer denies request', async () => {
      req.query = { offset: 1, count: 5 };
      sandbox.stub(Model, 'findAll').resolves([sampleRecord1, sampleRecord2]);
      dummyAuthz.checkRecord.throws(errors.forbiddenError('Sample'));

      // Call the route and assert forbidden error.
      await assertThrows(async () => {
        await apiRestRoutes.listCollectionRoute(Model, dummyAuthz)(req, res);
      }, 403, 'Sample');
    });

    it('sorts ascending', async () => {
      req.query = { offset: 1, sort: 'id' };
      sandbox.stub(Model, 'findAll').resolves([]);

      // Call the route
      await apiRestRoutes.listCollectionRoute(Model, dummyAuthz)(req, res);

      // Assert find call made
      sinon.assert.calledWith(Model.findAll, {
        limit: 100,
        offset: 1,
        order: [['id', 'ASC']],
        where: {}
      });
    });

    it('sorts descending', async () => {
      req.query = { offset: 1, sort: '-title' };
      sandbox.stub(Model, 'findAll').resolves([]);

      // Call the route
      await apiRestRoutes.listCollectionRoute(Model, dummyAuthz)(req, res);

      // Assert find call made
      sinon.assert.calledWith(Model.findAll, {
        limit: 100,
        offset: 1,
        order: [['title', 'DESC']],
        where: {}
      });
    });

    it('returns bad request on invalid sort param', async () => {
      req.query = { offset: 1, sort: 'abc' };
      sandbox.stub(Model, 'findAll').resolves([]);

      // Call the route
      await assertThrows(async () => {
        await apiRestRoutes.listCollectionRoute(Model, dummyAuthz)(req, res);
      }, 400, 'Invalid sort parameter: abc.');
    });

    it('returns bad request on invalid filter param', async () => {
      req.query = { offset: 1, missingField: 'abc' };
      sandbox.stub(Model, 'findAll').resolves([]);

      // Call the route
      await assertThrows(async () => {
        await apiRestRoutes.listCollectionRoute(Model, dummyAuthz)(req, res);
      }, 400, 'Invalid query parameter: missingField.');
    });

    it('filters by parameters', async () => {
      const okValues = [
        ['isShiny', 'false', false],
        ['isShiny', 'true', true],
        ['title', 'abc', 'abc'],
        ['title', '123', '123'],
        ['id', '123', '123'],
        ['timestamp', '2018-02-04T04:05:06Z', '2018-02-04T04:05:06Z'],
        ['isShiny', 'null', null]
      ];
      for (let [fieldName, queryValue, whereValue] of okValues) {
        req.query = { [fieldName]: queryValue };
        sandbox.stub(Model, 'findAll').resolves([]);

        // Call the route
        await apiRestRoutes.listCollectionRoute(Model, dummyAuthz)(req, res);

        // Assert find call made
        assert.deepStrictEqual(Model.findAll.firstCall.args, [{
          limit: 100,
          offset: 0,
          order: [['id', 'ASC']],
          where: { [fieldName]: whereValue }
        }]);

        sandbox.restore();
      }
    });

    it('returns bad request on invalid query parameters', async () => {
      const okValues = [
        ['isShiny', '123'],
        ['isShiny', 'abc'],
        ['isShiny', 'fals'],
        ['id', 'abc'],
        ['timestamp', '2018-asd']
      ];
      for (let [fieldName, queryValue] of okValues) {
        req.query = { [fieldName]: queryValue };
        // Call the route
        await assertThrows(async () => {
          await apiRestRoutes.listCollectionRoute(Model, dummyAuthz)(req, res);
        }, 400, `Invalid value "${queryValue}" for parameter ${fieldName}.`);
      }
    });

    it('filters by multiple with comma', async () => {
      req.query = { offset: 1, title: 'x,y' };
      sandbox.stub(Model, 'findAll').resolves([]);

      // Call the route
      await apiRestRoutes.listCollectionRoute(Model, dummyAuthz)(req, res);

      // Assert find call made
      sinon.assert.calledWith(Model.findAll, {
        limit: 100,
        offset: 1,
        order: [['id', 'ASC']],
        where: { title: { [Sequelize.Op.or]: ['x', 'y'] } }
      });
    });

    it('filters by multiple with multiple params', async () => {
      req.query = { offset: 1, title: ['x', 'y'] };
      sandbox.stub(Model, 'findAll').resolves([]);

      // Call the route
      await apiRestRoutes.listCollectionRoute(Model, dummyAuthz)(req, res);

      // Assert find call made
      sinon.assert.calledWith(Model.findAll, {
        limit: 100,
        offset: 1,
        order: [['id', 'ASC']],
        where: { title: { [Sequelize.Op.or]: ['x', 'y'] } }
      });
    });
  });

  describe('#createRecordRoute', () => {
    it('creates a record', async () => {
      req.body = { title: 'ghi', timestamp: '2018-01-01T04:05:06.000Z' };
      let record;

      sandbox.stub(Model, 'build').callsFake(() => {
        record = new Model();
        sandbox.stub(record, 'save').callsFake(() => {
          record.id = 3;
        });
        return record;
      });

      // Call the route
      await apiRestRoutes.createRecordRoute(Model, dummyAuthz)(req, res);

      // Check response
      assert.strictEqual(res.statusCode, 201);
      assert.deepStrictEqual(JSON.parse(res._getData()), {
        data: {
          model: {
            id: 3,
            isShiny: null,
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

      // Assert save call made without fields argument
      sinon.assert.calledOnce(record.save);
      assert.deepStrictEqual(record.save.firstCall.args, [{}]);
    });

    it('calls authorizer', async () => {
      req.body = { title: 'ghi', timestamp: '2018-01-01T04:05:06.000Z' };
      let record;

      sandbox.stub(Model, 'build').callsFake(() => {
        record = new Model();
        sandbox.stub(record, 'save').callsFake(() => {
          record.id = 3;
        });
        return record;
      });

      // Call the route
      await apiRestRoutes.createRecordRoute(Model, dummyAuthz)(req, res);

      // Assert authz calls are made
      sinon.assert.calledOnce(dummyAuthz.checkRecord);
      sinon.assert.calledWith(dummyAuthz.checkRecord,
        req, 'create', Model, null);
      sinon.assert.calledOnce(dummyAuthz.checkFields);
      sinon.assert.calledWith(dummyAuthz.checkFields,
        req, 'create', Model, null, req.body);
    });

    it('does not allow creation with id', async () => {
      req.body = { id: 5, title: 'ghi', timestamp: '2018-01-01T04:05:06Z' };

      // Call the route
      await assertThrows(async () => {
        await apiRestRoutes.createRecordRoute(Model, dummyAuthz)(req, res);
      }, 400, 'Id is not allowed on create.');
    });

    it('does not allow creation with unknown field', async () => {
      req.body = { missing: 123 };

      // Call the route
      await assertThrows(async () => {
        await apiRestRoutes.createRecordRoute(Model, dummyAuthz)(req, res);
      }, 422, 'Invalid field: "missing".');
    });
  });

  describe('#retrieveRecordRoute', () => {
    it('returns a record', async () => {
      req.params = { recordId: '10' };
      sandbox.stub(Model, 'findById').resolves(sampleRecord1);

      // Call the route
      await apiRestRoutes.retrieveRecordRoute(Model, dummyAuthz)(req, res);

      // Check response
      assert.strictEqual(res.statusCode, 200);
      assert.deepStrictEqual(JSON.parse(res._getData()), {
        data: {
          model: {
            id: 1,
            isShiny: false,
            timestamp: '2018-02-04T04:05:06.000Z',
            title: 'abc'
          }
        }
      });

      // Assert find call made
      sinon.assert.calledWith(Model.findById, 10);
    });

    it('calls authorizer', async () => {
      req.params = { recordId: '10' };
      sandbox.stub(Model, 'findById').resolves(sampleRecord1);

      // Call the route
      await apiRestRoutes.retrieveRecordRoute(Model, dummyAuthz)(req, res);

      // Assert authz calls are made
      sinon.assert.calledOnce(dummyAuthz.checkRecord);
      sinon.assert.calledWith(dummyAuthz.checkRecord,
        req, 'retrieve', Model, sampleRecord1);
    });

    it('returns 404 if not found', async () => {
      req.params = { recordId: '10' };
      sandbox.stub(Model, 'findById').resolves(null);

      // Call the route
      await assertThrows(async () => {
        await apiRestRoutes.retrieveRecordRoute(Model, dummyAuthz)(req, res);
      }, 404, 'Record not found.');
    });
  });

  describe('#updateRecordRoute', () => {
    it('returns a record', async () => {
      req.params = { recordId: '10' };
      req.body = { title: 'def' };
      const existingRecord = Model.build({
        id: 1,
        title: 'abc',
        timestamp: moment.utc('2018-02-04T04:05:06Z').toDate()
      });
      sandbox.stub(existingRecord, 'save').resolves(null);
      sandbox.stub(Model, 'findById').resolves(existingRecord);

      // Call the route
      await apiRestRoutes.updateRecordRoute(Model, dummyAuthz)(req, res);

      // Check response
      assert.strictEqual(res.statusCode, 200);
      assert.deepStrictEqual(JSON.parse(res._getData()), {
        data: {
          model: {
            id: 1,
            isShiny: null,
            timestamp: '2018-02-04T04:05:06.000Z',
            title: 'def'
          }
        }
      });

      // Assert find call made
      sinon.assert.calledWith(Model.findById, 10);

      // Assert save call made with fields argument
      sinon.assert.calledOnce(existingRecord.save);
      assert.deepStrictEqual(existingRecord.save.firstCall.args, [{
        fields: ['title']
      }]);

      // assert field was updated
      assert.strictEqual(existingRecord.title, 'def');
    });

    it('calls authorizer', async () => {
      req.params = { recordId: '10' };
      req.body = { title: 'def' };
      const existingRecord = Model.build({
        id: 1,
        title: 'abc',
        timestamp: moment.utc('2018-02-04T04:05:06Z').toDate()
      });
      sandbox.stub(existingRecord, 'save').resolves(null);
      sandbox.stub(Model, 'findById').resolves(existingRecord);

      // Call the route
      await apiRestRoutes.updateRecordRoute(Model, dummyAuthz)(req, res);

      // Assert authz calls are made
      sinon.assert.calledOnce(dummyAuthz.checkRecord);
      sinon.assert.calledWith(dummyAuthz.checkRecord,
        req, 'update', Model, existingRecord);  

      sinon.assert.calledOnce(dummyAuthz.checkFields);
      sinon.assert.calledWith(dummyAuthz.checkFields,
        req, 'update', Model, existingRecord, req.body);  
    });

    it('returns 404 if not found', async () => {
      req.params = { recordId: '10' };
      req.body = { title: 'def' };
      sandbox.stub(Model, 'findById').resolves(null);

      // Call the route
      await assertThrows(async () => {
        await apiRestRoutes.updateRecordRoute(Model, dummyAuthz)(req, res);
      }, 404, 'Record not found.');
    });

    it('does not allow update with missing field', async () => {
      req.params = { recordId: '10' };
      req.body = { bad: 'doggy' };
      const existingRecord = Model.build({
        id: 1,
        title: 'abc',
        timestamp: moment.utc('2018-02-04T04:05:06Z').toDate()
      });
      sandbox.stub(existingRecord, 'save').resolves(null);
      sandbox.stub(Model, 'findById').resolves(existingRecord);

      // Call the route
      await assertThrows(async () => {
        await apiRestRoutes.updateRecordRoute(Model, dummyAuthz)(req, res);
      }, 422, 'Invalid field: "bad".');
    });
  });
});
