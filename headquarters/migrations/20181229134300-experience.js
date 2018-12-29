'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.createTable('Experiences', {
      id: {
        type: 'INTEGER',
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: 'VARCHAR(255)',
        allowNull: false,
        defaultValue: ''
      },
      title: {
        type: 'VARCHAR(255)',
        allowNull: false,
        defaultValue: ''
      },
      host: {
        type: 'VARCHAR(64)',
        allowNull: false,
        defaultValue: ''
      },
      timezone: {
        type: 'VARCHAR(32)',
        allowNull: false,
        defaultValue: ''
      },
      is_archived: {
        type: 'TINYINT(1)',
        defaultValue: 0
      }
    });

    // Add experience id
    await queryInterface.addColumn('Scripts', 'experience_id', {
      allowNull: true,
      after: 'id',
      type: 'INTEGER',
      onDelete: 'NO ACTION',
      onUpdate: 'CASCADE'
    });
    await queryInterface.addColumn('Trips', 'experience_id', {
      allowNull: true,
      after: 'id',
      type: 'INTEGER',
      onDelete: 'NO ACTION',
      onUpdate: 'CASCADE'
    });

    // Gather scripts
    const scriptsSql = 'select id, name, title, host, timezone from Scripts';
    const scriptsRows = (await queryInterface.sequelize.query(scriptsSql))[0];

    // Create list of experiences to create
    const experiencesToCreate = scriptsRows.map(row => ({
      name: row.name,
      title: row.title,
      host: row.host,
      timezone: row.timezone,
      is_archived: false
    }));

    // Insert experiences
    await queryInterface.bulkInsert('Experiences', experiencesToCreate);

    // Add reference
    const updateScriptRefSql = `
      update Scripts
        inner join Experiences
        on Experiences.name = Scripts.name
      set
        Scripts.experience_id = Experiences.id;
    `;
    await queryInterface.sequelize.query(updateScriptRefSql);

      const updateTripRefSql = `
      update Trips
        inner join Scripts
        on Scripts.id = Trips.script_id
      set
        Trips.experience_id = Scripts.experience_id;
    `;
    await queryInterface.sequelize.query(updateTripRefSql);

    // rm null constraint
    await queryInterface.changeColumn('Scripts', 'experience_id', {
      allowNull: false,
      after: 'id',
      type: 'INTEGER',
      onDelete: 'NO ACTION',
      onUpdate: 'CASCADE'
    });
    await queryInterface.changeColumn('Trips', 'experience_id', {
      allowNull: false,
      after: 'id',
      type: 'INTEGER',
      onDelete: 'NO ACTION',
      onUpdate: 'CASCADE'
    });

    // Remove script
    await queryInterface.removeColumn('Scripts', 'name');
    await queryInterface.removeColumn('Scripts', 'title');
    await queryInterface.removeColumn('Scripts', 'host');
    await queryInterface.removeColumn('Scripts', 'timezone');
    await queryInterface.removeColumn('Scripts', 'created_at');

    // Other cleanups
    await queryInterface.removeColumn('Trips', 'created_at');
    // await queryInterface.addColumn('Trips', 'timezone', {
    //   type: 'VARCHAR(32)',
    //   after: 'date',
    //   allowNull: false,
    //   defaultValue: ''
    // });

    // Set timezone
    // const timezoneSql = 'update Trips set timezone = "US/Pacific";';
    // await queryInterface.sequelize.query(timezoneSql);
  },

  down: async (queryInterface) => {
    // Add back script fields.
    await queryInterface.addColumn('Scripts', 'name', {
      type: 'VARCHAR(255)',
      allowNull: false,
      defaultValue: ''
    });
    await queryInterface.addColumn('Scripts', 'title', {
      type: 'VARCHAR(255)',
      allowNull: false,
      defaultValue: ''
    });
    await queryInterface.addColumn('Scripts', 'host', {
      type: 'VARCHAR(64)',
      allowNull: false,
      defaultValue: ''
    });
    await queryInterface.addColumn('Scripts', 'timezone', {
      type: 'VARCHAR(32)',
      allowNull: false,
      defaultValue: ''
    });
    await queryInterface.addColumn('Scripts', 'created_at', {
      type: 'DATETIME',
      defaultValue: null
    });

    // Revert other cleanups
    await queryInterface.addColumn('Trips', 'created_at', {
      type: 'DATETIME',
      defaultValue: null
    });

    // Refill scripts info.
    const refillSql = `
      update Scripts
        inner join Experiences
        on Scripts.experience_id = Experiences.id
      set
        Scripts.name = Experiences.name,
        Scripts.title = Experiences.title,
        Scripts.timezone = Experiences.timezone,
        Scripts.host = Experiences.host;
    `;
    await queryInterface.sequelize.query(refillSql);
    await queryInterface.removeColumn('Scripts', 'experience_id');
    await queryInterface.removeColumn('Trips', 'experience_id');
    // await queryInterface.removeColumn('Trips', 'timezone');
    await queryInterface.dropTable('Experiences');
  }
};
