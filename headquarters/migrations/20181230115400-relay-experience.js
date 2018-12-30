'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.addColumn('Relays', 'experience_id', {
      type: 'INTEGER',
      after: 'id',
      allowNull: true
    });
    await queryInterface.sequelize.query(`
      update Relays
        inner join Experiences
        on Relays.script_name = Experiences.name
      set
        Relays.experience_id = Experiences.id;
    `);
    await queryInterface.changeColumn('Relays', 'experience_id', {
      type: 'INTEGER',
      after: 'id',
      allowNull: false
    });
    await queryInterface.removeColumn('Relays', 'script_name');
  },

  down: async (queryInterface) => {
    await queryInterface.addColumn('Relays', 'script_name');
    await queryInterface.sequelize.query(`
      update Relays
        inner join Experiences
        on Relays.experience_id = Experiences.id
      set
        Relays.script_name = Experiences.name;
    `);
    await queryInterface.removeColumn('Relays', 'experience_id');
  }
};
