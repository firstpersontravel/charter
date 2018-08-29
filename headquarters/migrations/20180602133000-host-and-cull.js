'use strict';
module.exports = {
  up: async (queryInterface) => {
    await queryInterface.addColumn('script', 'host', {
      type: 'VARCHAR(64)',
      allowNull: false,
      defaultValue: ''
    });
    await queryInterface.removeColumn('user', 'gender');
    await queryInterface.removeColumn('user', 'photo');
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('script', 'host');
    await queryInterface.addColumn('user', 'gender', {
      type: 'TINYINT(1)',
      defaultValue: 0
    });
    await queryInterface.addColumn('user', 'photo', {
      type: 'VARCHAR(64)',
      allowNull: false,
      defaultValue: ''
    });
  }
};
