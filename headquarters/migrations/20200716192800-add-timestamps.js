'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.addColumn('Users', 'created_at', {
      type: 'DATETIME',
      after: 'id',
      allowNull: true
    });
    await queryInterface.addColumn('Orgs', 'created_at', {
      type: 'DATETIME',
      after: 'id',
      allowNull: true
    });
    await queryInterface.addColumn('Participants', 'created_at', {
      type: 'DATETIME',
      after: 'experience_id',
      allowNull: true
    });
    await queryInterface.addColumn('Experiences', 'created_at', {
      type: 'DATETIME',
      after: 'org_id',
      allowNull: true
    });

    // Update orgs with groups
    await queryInterface.sequelize.query(`
      UPDATE Orgs
      SET created_at = (
        SELECT date
        FROM Groups
        WHERE Groups.org_id = Orgs.id
        ORDER BY Groups.date
        LIMIT 1
      )`, { type: queryInterface.sequelize.QueryTypes.UPDATE });

    // Update orgs without groups
    await queryInterface.sequelize.query(`
    UPDATE Orgs
    SET created_at = (
      SELECT date
      FROM Groups
      WHERE Groups.org_id >= Orgs.id - 2
      ORDER BY Groups.date
      LIMIT 1
    )
    WHERE Orgs.created_at IS NULL
    `, { type: queryInterface.sequelize.QueryTypes.UPDATE });

    // Update users
    await queryInterface.sequelize.query(`
      UPDATE Users
      SET created_at = (
        SELECT Orgs.created_at
        FROM Orgs
        INNER JOIN OrgRoles
        ON OrgRoles.org_id = Orgs.id
        WHERE OrgRoles.user_id = Users.id
        ORDER BY Orgs.created_at
        LIMIT 1
      )`, { type: queryInterface.sequelize.QueryTypes.UPDATE });

    // Update experiences with groups
    await queryInterface.sequelize.query(`
      UPDATE Experiences
      SET created_at = (
        SELECT date
        FROM Groups
        WHERE Groups.experience_id = Experiences.id
        ORDER BY Groups.date
        LIMIT 1
      )`, { type: queryInterface.sequelize.QueryTypes.UPDATE });

    // Update experiences without groups
    await queryInterface.sequelize.query(`
      UPDATE Experiences
      INNER JOIN Orgs
      ON Experiences.org_id = Orgs.id
      SET Experiences.created_at = Orgs.created_at
      WHERE Experiences.created_at IS NULL
    `, { type: queryInterface.sequelize.QueryTypes.UPDATE });

    // Update participants
    await queryInterface.sequelize.query(`
      UPDATE Participants
      INNER JOIN Experiences
      ON Participants.experience_id = Experiences.id
      SET Participants.created_at = Experiences.created_at
    `, { type: queryInterface.sequelize.QueryTypes.UPDATE });

    await queryInterface.changeColumn('Users', 'created_at', {
      type: 'DATETIME',
      after: 'id',
      allowNull: false
    });
    await queryInterface.changeColumn('Orgs', 'created_at', {
      type: 'DATETIME',
      after: 'id',
      allowNull: false
    });
    await queryInterface.changeColumn('Participants', 'created_at', {
      type: 'DATETIME',
      after: 'experience_id',
      allowNull: false
    });
    await queryInterface.changeColumn('Experiences', 'created_at', {
      type: 'DATETIME',
      after: 'org_id',
      allowNull: false
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('Orgs', 'created_at');
    await queryInterface.removeColumn('Participants', 'created_at');
    await queryInterface.removeColumn('Users', 'created_at');
  }
};