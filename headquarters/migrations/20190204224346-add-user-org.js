'use strict';

const _ = require('lodash');

module.exports = {
  up: async (queryInterface) => {
    // All users convert to null org and experience id
    try {
      await queryInterface.addColumn('Users', 'org_id', {
        type: 'INTEGER',
        allowNull: true,
        after: 'id'
      });
      await queryInterface.addColumn('Users', 'experience_id', {
        type: 'INTEGER',
        allowNull: true,
        after: 'org_id'
      });
    } catch (err) {
      console.log('continuing');
    }

    const getUsersSql = 'select * from Users';
    const getProfilesSql = 'select * from Profiles';
    const oldUsers = await queryInterface.sequelize.query(getUsersSql,
      { type: queryInterface.sequelize.QueryTypes.SELECT });
    const oldUsersById = _.fromPairs(oldUsers.map(u => [u.id, u]));
    const newUserIdsByOldIdAndExpId = {};
    const profiles = await queryInterface.sequelize.query(getProfilesSql,
      { type: queryInterface.sequelize.QueryTypes.SELECT });

    async function getOrCreateUserIdForProfile(profile) {
      const oldUser = oldUsersById[profile.user_id];
      const existingUserIdsByExpId = newUserIdsByOldIdAndExpId[oldUser.id];
      const existingUserId = _.get(existingUserIdsByExpId,
        profile.experience_id);
      if (existingUserId) {
        console.log(` -> found existing ${existingUserId}`);
        return existingUserId;
      }
      const createUserSql = `
        insert into Users
        (org_id, experience_id, email, password_hash, first_name, last_name, phone_number, is_active, device_id, device_push_token, is_archived)
        values
        (?, ?, ?, '', ?, ?, ?, ?, ?, ?, ?)
      `;
      const createUserValues = [
        profile.org_id,
        profile.experience_id,
        oldUser.email,
        oldUser.first_name,
        oldUser.last_name,
        oldUser.phone_number,
        oldUser.is_active,
        oldUser.device_id,
        oldUser.device_push_token,
        oldUser.is_archived
      ];
      const newUserId = (await queryInterface.sequelize.query(createUserSql, {
        replacements: createUserValues,
        type: queryInterface.sequelize.QueryTypes.INSERT
      }))[0];
      console.log(` -> created ${newUserId}`);
      if (!newUserIdsByOldIdAndExpId[oldUser.id]) {
        newUserIdsByOldIdAndExpId[oldUser.id] = {};
      }
      newUserIdsByOldIdAndExpId[oldUser.id][profile.experience_id] = newUserId;
      return newUserId;
    }

    for (const profile of profiles) {
      const oldUserId = profile.user_id;
      if (!oldUserId) {
        continue;
      }
      console.log(`updating profile ${profile.id}:`);
      const updatedUserId = await getOrCreateUserIdForProfile(profile);
      await queryInterface.sequelize.query(`
        update Profiles
        set user_id = ${updatedUserId}
        where id = ${profile.id}
      `);
    }

    const playersSql = `
      select
      Players.id as id,
      Players.user_id as user_id,
      Trips.org_id as org_id,
      Trips.experience_id as experience_id
      from Players
      inner join Trips
      on Trips.id = Players.trip_id
    `;
    const players = await queryInterface.sequelize.query(playersSql,
      { type: queryInterface.sequelize.QueryTypes.SELECT });

    for (const player of players) {
      const oldUserId = player.user_id;
      if (!oldUserId) {
        continue;
      }
      console.log(`updating player ${player.id}:`);
      const updatedUserId = await getOrCreateUserIdForProfile(player);
      await queryInterface.sequelize.query(`
        update Players
        set user_id = ${updatedUserId}
        where id = ${player.id}
      `);
    }

    await queryInterface.sequelize.query(`
      delete from Users where org_id IS NULL and password_hash = ""
    `);

    await queryInterface.sequelize.query(
      'update Users set org_id = 1 where id = 1');
    await queryInterface.sequelize.query(
      'update Users set org_id = 1 where id = 50');
    await queryInterface.sequelize.query(
      'update Users set org_id = 2 where id = 90');

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
