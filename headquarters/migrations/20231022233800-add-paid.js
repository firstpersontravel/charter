'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.addColumn('Orgs', 'is_paid', {
      type: 'TINYINT(1)',
      allowNull: false,
      defaultValue: 0,
      after: 'is_personal'
    });
    await queryInterface.addColumn('Experiences', 'country_code', {
      type: 'INTEGER',
      allowNull: true,
      after: 'timezone'
    });
    await queryInterface.addColumn('Experiences', 'area_code', {
      type: 'INTEGER',
      allowNull: true,
      after: 'country_code'
    });
    await queryInterface.sequelize.query('update Experiences set country_code = 1;');
    await queryInterface.changeColumn('Experiences', 'country_code', {
      type: 'INTEGER',
      allowNull: false,
      after: 'timezone'
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('Orgs', 'is_paid');
    await queryInterface.removeColumn('Experiences', 'country_code');
    await queryInterface.removeColumn('Experiences', 'area_code');
  }
};
