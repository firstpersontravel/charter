'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.addColumn('Groups', 'experience_id', {
      type: 'INTEGER',
      after: 'id',
      allowNull: true
    });
    await queryInterface.sequelize.query(`
      update Groups
        inner join Scripts
        on Groups.script_id = Scripts.id
      set
        Groups.experience_id = Scripts.experience_id;
    `);
    await queryInterface.changeColumn('Groups', 'experience_id', {
      type: 'INTEGER',
      after: 'id',
      allowNull: false
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('Groups', 'experience_id');
  }
};
