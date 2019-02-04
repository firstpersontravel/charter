'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.addColumn('Users', 'org_id', {
      type: 'INTEGER',
      allowNull: true,
      defaultValue: 1,
      after: 'id'
    });
    await queryInterface.addColumn('Users', 'experience_id', {
      type: 'INTEGER',
      allowNull: true,
      defaultValue: 1,
      after: 'org_id'
    });
    await queryInterface.sequelize.query(`
      update Users
      set experience_id = 3
      where id >= 47 and id != 60 and id != 61 and id != 62 and id != 63 and id != 65 and id != 90
    `);
    await queryInterface.sequelize.query(`
      update Users
      set org_id = 2, experience_id = 7
      where id = 90
    `);
    await queryInterface.changeColumn('Users', 'org_id', {
      type: 'INTEGER',
      allowNull: false,
      after: 'id'
    });
    await queryInterface.changeColumn('Users', 'experience_id', {
      type: 'INTEGER',
      allowNull: true,
      after: 'org_id'
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('Users', 'org_id');
    await queryInterface.removeColumn('Users', 'experience_id');
  }
};
