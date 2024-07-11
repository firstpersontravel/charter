'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.query(`
      DELETE FROM Relays
    `, { type: queryInterface.sequelize.QueryTypes.UPDATE });
    await queryInterface.addColumn('Relays', 'trip_id', {
      type: 'INTEGER',
      allowNull: false,
      after: 'experience_id'
    });
    await queryInterface.addColumn('Relays', 'for_phone_number', {
      type: 'VARCHAR(15)',
      after: 'stage',
      allowNull: false
    });
    await queryInterface.removeColumn('Relays', 'is_active');
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('Relays', 'trip_id');
    await queryInterface.removeColumn('Relays', 'for_phone_number');
    await queryInterface.addColumn('Relays', 'is_active', {
      type: 'TINYINT(1)',
      after: 'last_active_at',
      allowNull: false
    });
  }
};