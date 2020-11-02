'use strict';

module.exports = {
  up: async (queryInterface) => {
    const timestampType = {
      type: 'DATETIME',
      after: 'experience_id',
      allowNull: true
    };
    await queryInterface.addColumn('Scripts', 'created_at', timestampType);
    await queryInterface.addColumn('Scripts', 'updated_at', timestampType);
    await queryInterface.sequelize.query(`
      update Scripts set created_at = NOW(), updated_at = NOW();
    `);
    await queryInterface.addColumn('Assets', 'created_at', timestampType);
    await queryInterface.addColumn('Assets', 'updated_at', timestampType);
    await queryInterface.sequelize.query(`
      update Assets set created_at = NOW(), updated_at = NOW();
    `);
    timestampType.allowNull = false;
    await queryInterface.changeColumn('Scripts', 'updated_at', timestampType);
    await queryInterface.changeColumn('Assets', 'updated_at', timestampType);
    await queryInterface.changeColumn('Scripts', 'created_at', timestampType);
    await queryInterface.changeColumn('Assets', 'created_at', timestampType);
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('Scripts', 'created_at');
    await queryInterface.removeColumn('Scripts', 'updated_at');
    await queryInterface.removeColumn('Assets', 'created_at');
    await queryInterface.removeColumn('Assets', 'updated_at');
  }
};
