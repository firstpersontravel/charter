const assert = require('assert');
const httpMocks = require('node-mocks-http');

const Authorizer = require('../../../src/authorization/logic/authorizer');

describe('Authorizer', () => {
  describe('#subjectForReq', () => {
    it('returns anonymous subject', () => {
      const authz = new Authorizer(null);
      const req = httpMocks.createRequest();

      const subject = authz.subjectForReq(req);

      assert.deepStrictEqual(subject, { isAnonymous: true, name: 'anonymous' });
    });

    it('returns authenticated user', () => {
      const authz = new Authorizer(null);
      const req = httpMocks.createRequest();
      req.auth = {
        user: {
          email: 'test@test.com',
          orgRoles: [{ orgId: 1 }]
        }
      };

      const subject = authz.subjectForReq(req);

      assert.deepStrictEqual(subject, {
        isUser: true,
        name: 'test@test.com',
        orgIds: [1]
      });
    });

    it('returns authenticated participant', () => {
      const authz = new Authorizer(null);
      const req = httpMocks.createRequest();
      req.auth = {
        participant: {
          id: 4,
          name: 'test',
          orgId: 1,
          experienceId: 2
        },
        players: [{ tripId: 3, trip: { groupId: 5 } }]
      };

      const subject = authz.subjectForReq(req);

      assert.deepStrictEqual(subject, {
        isParticipant: true,
        name: 'test',
        orgId: 1,
        experienceId: 2,
        participantIds: [4],
        tripIds: [3]
      });
    });

    it('returns authenticated trip', () => {
      const authz = new Authorizer(null);
      const req = httpMocks.createRequest();
      req.auth = {
        trip: {
          title: 'Ted\'s trip',
          id: 1,
          orgId: 2,
          experienceId: 3
        },
        players: [{
          participantId: 4
        }]
      };

      const subject = authz.subjectForReq(req);

      assert.deepStrictEqual(subject, {
        isParticipant: true,
        name: 'Ted\'s trip',
        orgId: 2,
        experienceId: 3,
        participantIds: [4],
        tripIds: [1]
      });
    });
  });
});
