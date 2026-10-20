"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Privacy settings per user
    await queryInterface.createTable("privacy_settings", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      profile_visibility: {
        type: Sequelize.ENUM("PUBLIC", "PRIVATE"),
        defaultValue: "PRIVATE",
        allowNull: false,
      },
      show_education: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      show_experience: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      show_skills: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      show_certifications: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      show_applications: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
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

    // Data deletion requests
    await queryInterface.createTable("deletion_requests", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      reason: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM("PENDING", "PROCESSING", "COMPLETED", "CANCELLED"),
        defaultValue: "PENDING",
        allowNull: false,
      },
      processed_at: {
        type: Sequelize.DATE,
        allowNull: true,
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

    await queryInterface.addIndex("deletion_requests", ["user_id", "status"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("deletion_requests");
    await queryInterface.dropTable("privacy_settings");
  },
};
