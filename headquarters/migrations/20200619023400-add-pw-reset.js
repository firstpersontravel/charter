'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.addColumn('Users', 'password_reset_token', {
      type: 'VARCHAR(32)',
      allowNull: false,
      after: 'password_hash'
    });
    await queryInterface.addColumn('Users', 'password_reset_expiry', {
      type: 'DATETIME',
      allowNull: true,
      after: 'password_reset_token'
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('Users', 'password_reset_token');
    await queryInterface.removeColumn('Users', 'password_reset_expiry');
  }
};
