'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.addColumn('RelayEntryways', 'is_temporary', {
      type: 'TINYINT(1)',
      allowNull: false,
      defaultValue: 0,
      after: 'keyword'
    });
    // Set dev entryway to temp
    await queryInterface.sequelize.query(`
      UPDATE RelayEntryways
      SET is_temporary = 1
      WHERE id = 1
    `, { type: queryInterface.sequelize.QueryTypes.UPDATE });
    // Add a prod temp entryway
    await queryInterface.bulkInsert('RelayEntryways', [{
      stage: 'production',
      org_id: 1,
      experience_id: 837,
      relay_service_id: 5,
      is_temporary: 1
    }]);
    await queryInterface.sequelize.query(`
      UPDATE RelayServices
      SET is_shared = 1
      WHERE id = 5
    `, { type: queryInterface.sequelize.QueryTypes.UPDATE });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('RelayEntryways', 'is_temporary');
  }
};
