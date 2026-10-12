"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("users", "role", {
      type: Sequelize.ENUM("USER", "ADMIN", "OPERATIONS", "MODERATOR"),
      defaultValue: "USER",
      allowNull: false,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("users", "role");
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_users_role";',
    );
  },
};
