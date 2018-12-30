'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.addColumn('Profiles', 'experience_id', {
      type: 'INTEGER',
      after: 'id',
      allowNull: true
    });
    await queryInterface.sequelize.query(`
      update Profiles
        inner join Experiences
        on Profiles.script_name = Experiences.name
      set
        Profiles.experience_id = Experiences.id;
    `);
    await queryInterface.changeColumn('Profiles', 'experience_id', {
      type: 'INTEGER',
      after: 'id',
      allowNull: false
    });
    await queryInterface.removeColumn('Profiles', 'script_name');
  },

  down: async (queryInterface) => {
    await queryInterface.addColumn('Profiles', 'script_name');
    await queryInterface.sequelize.query(`
      update Profiles
        inner join Experiences
        on Profiles.experience_id = Experiences.id
      set
        Profiles.script_name = Experiences.name;
    `);
    await queryInterface.removeColumn('Profiles', 'experience_id');
  }
};
