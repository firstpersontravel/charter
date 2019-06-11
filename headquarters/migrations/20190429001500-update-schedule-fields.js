'use strict';

module.exports = {
  up: async (queryInterface) => {
    const timestampType = {
      type: 'DATETIME',
      after: 'experience_id',
      allowNull: true
    };
    await queryInterface.addColumn('Trips', 'created_at', timestampType);
    await queryInterface.addColumn('Trips', 'updated_at', timestampType);
    await queryInterface.sequelize.query(`
      update Trips set created_at = NOW(), updated_at = NOW();
    `);
    timestampType.allowNull = false;
    await queryInterface.changeColumn('Trips', 'updated_at', timestampType);
    await queryInterface.changeColumn('Trips', 'created_at', timestampType);
    await queryInterface.addColumn('Trips', 'schedule_at', {
      type: 'DATETIME',
      after: 'gallery_name',
      allowNull: true
    });
    await queryInterface.addColumn('Trips', 'schedule_updated_at', {
      type: 'DATETIME',
      after: 'schedule_at',
      allowNull: true
    });
    await queryInterface.removeColumn('Trips', 'last_scheduled_time');
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('Trips', 'created_at');
    await queryInterface.removeColumn('Trips', 'updated_at');
    await queryInterface.removeColumn('Trips', 'schedule_updated_at');
    await queryInterface.removeColumn('Trips', 'schedule_at');
    await queryInterface.addColumn('Trips', 'last_scheduled_time', {
      type: 'DATETIME',
      allowNull: true
    });
  }
};
