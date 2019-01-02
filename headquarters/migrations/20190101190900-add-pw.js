'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.addColumn('Users', 'password_hash', {
      type: 'VARCHAR(60)',
      after: 'email',
      allowNull: false
    });
    await queryInterface.sequelize.query('update Users set password_hash = "$2b$10$Sfvlt.bCDSe52WMiGF4yNetKARGsNNwr1aGlm90hPQM0GUvLQb/FG" where id = 1;');
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('Users', 'password_hash');
  }
};
