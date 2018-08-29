'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.addColumn('script', 'is_active', {
      type: 'TINYINT(1)',
      defaultValue: 0
    });
    await queryInterface.addColumn('script', 'is_archived', {
      type: 'TINYINT(1)',
      defaultValue: 0
    });
    await queryInterface.addColumn('relay', 'script_name', {
      type: 'VARCHAR(32)',
      allowNull: false,
      after: 'stage',
      defaultValue: ''
    });
    await queryInterface.sequelize.query('update script set is_active = 1');
    await queryInterface.sequelize.query('update relay set stage = "development" where stage = "local"');
    await queryInterface.sequelize.query('update relay set script_name = "theheadlandsgamble" where script_id = 1');
    await queryInterface.sequelize.query('update relay set script_name = "tacosyndicate" where script_id = 3');
    await queryInterface.sequelize.query('delete from relay where script_id = 4');
    await queryInterface.sequelize.query('delete from relay where script_id = 5');
    await queryInterface.sequelize.query('delete from relay where script_id = 6');
    await queryInterface.removeColumn('relay', 'script_id');
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('script', 'is_active');
    await queryInterface.removeColumn('script', 'is_archived');
    await queryInterface.addColumn('relay', 'script_id', {
      allowNull: false,
      type: 'INTEGER'
    });
    await queryInterface.removeColumn('relay', 'script_name');
  }
};
