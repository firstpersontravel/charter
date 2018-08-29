'use strict';
module.exports = {
  up: async (queryInterface) => {
    await queryInterface.removeColumn('relay', 'allows_sms');
    await queryInterface.removeColumn('relay', 'allows_phone');
  },
  down: async (queryInterface) => {
    await queryInterface.addColumn('relay', 'allows_sms', {
      type: 'TINYINT(1)',
      defaultValue: false
    });
    await queryInterface.addColumn('relay', 'allows_phone', {
      type: 'TINYINT(1)',
      defaultValue: false
    });
  }
};
