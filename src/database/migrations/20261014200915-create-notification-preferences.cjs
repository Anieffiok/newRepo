"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("notification_preferences", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      channel: {
        type: Sequelize.ENUM("EMAIL", "IN_APP"),
        defaultValue: "IN_APP",
        allowNull: false,
      },
      type: {
        type: Sequelize.ENUM(
          "DEADLINES",
          "OPPORTUNITIES",
          "APPLICATION_UPDATES",
          "SECURITY_ALERTS",
        ),
        allowNull: false,
      },
      enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // Composite unique index: A user has one setting per (channel + type) pair
    await queryInterface.addIndex(
      "notification_preferences",
      ["user_id", "channel", "type"],
      {
        unique: true,
        name: "notification_preferences_user_channel_type_unique_idx",
      },
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable("notification_preferences");
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_notification_preferences_channel";',
    );
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_notification_preferences_type";',
    );
  },
};
