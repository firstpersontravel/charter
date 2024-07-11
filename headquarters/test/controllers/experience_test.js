const assert = require('assert');
const sinon = require('sinon');

const { sandbox } = require('../mocks');
const models = require('../../src/models');
const ExperienceController = require('../../src/controllers/experience');

describe('ExperienceController', () => {
  describe('#findActiveScript', () => {
    it('looks up active script', async () => {
      const stubScript = { name: 'abc', experience: {} };
      sandbox.stub(models.Script, 'findOne').resolves(stubScript);

      const res = await ExperienceController.findActiveScript(10);

      assert.strictEqual(res, stubScript);
      sinon.assert.calledWith(models.Script.findOne, {
        where: { experienceId: 10, isActive: true, isArchived: false },
        include: [{
          model: models.Experience,
          as: 'experience'
        }, {
          model: models.Org,
          as: 'org'
        }]
      });
    });
  });
});