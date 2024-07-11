'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.addColumn('Relays', 'last_active_at', {
      type: 'DATETIME',
      after: 'messaging_service_id',
      allowNull: true
    });

    await queryInterface.sequelize.query(`
      UPDATE Relays
      SET last_active_at = NOW()
    `, { type: queryInterface.sequelize.QueryTypes.UPDATE });

    await queryInterface.changeColumn('Relays', 'last_active_at', {
      type: 'DATETIME',
      after: 'messaging_service_id',
      allowNull: false
    });

  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('Relays', 'last_active_at');
  }
};