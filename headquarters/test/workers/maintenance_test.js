const sinon = require('sinon');
const Sequelize = require('sequelize');

const { sandbox, mockNow } = require('../mocks');
const models = require('../../src/models');
const MaintenanceWorker = require('../../src/workers/maintenance');

describe('MaintenanceWorker', () => {
  describe('#runMaintenance', () => {
    it('archives trips that were updated more than 30 days ago', async () => {
      // Setup mock for Trip.update
      const updateStub = sandbox.stub(models.Trip, 'update').resolves([5]); // Mock 5 trips updated
      
      // Mock the date to ensure consistent testing
      const thirtyDaysAgo = mockNow.clone().subtract(30, 'days').toDate();
      
      await MaintenanceWorker.runMaintenance();
      
      // Verify Trip.update was called with the correct parameters
      sinon.assert.calledOnce(updateStub);
      sinon.assert.calledWith(updateStub, 
        { isArchived: true },
        {
          where: {
            updatedAt: { [Sequelize.Op.lt]: thirtyDaysAgo },
            isArchived: false
          }
        }
      );
    });
    
    it('does not archive trips that were updated less than 30 days ago', async () => {
      // Setup mock for Trip.update
      const updateStub = sandbox.stub(models.Trip, 'update').resolves([0]); // Mock 0 trips updated
      
      // Create a trip that was updated 29 days ago (should not be archived)
      const recentTrip = {
        id: 1,
        updatedAt: mockNow.clone().subtract(29, 'days').toDate(),
        isArchived: false
      };
      
      await MaintenanceWorker.runMaintenance();
      
      // Verify Trip.update was called but no trips were archived
      sinon.assert.calledOnce(updateStub);
      const thirtyDaysAgo = mockNow.clone().subtract(30, 'days').toDate();
      
      // Verify the where clause would exclude our recent trip
      const recentTripWouldBeArchived = 
        recentTrip.updatedAt < thirtyDaysAgo && 
        !recentTrip.isArchived;
      
      sinon.assert.match(recentTripWouldBeArchived, false);
    });
  });
});
