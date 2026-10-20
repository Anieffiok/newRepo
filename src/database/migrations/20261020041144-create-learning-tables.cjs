"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Curated learning resources (seeded by admin or system)
    await queryInterface.createTable("learning_resources", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      provider: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      url: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      skill_category: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      difficulty: {
        type: Sequelize.ENUM("BEGINNER", "INTERMEDIATE", "ADVANCED"),
        defaultValue: "BEGINNER",
        allowNull: false,
      },
      is_free: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      duration_estimate: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      country_focus: {
        type: Sequelize.STRING,
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

    // User engagement with resources
    await queryInterface.createTable("user_learning", {
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
      resource_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "learning_resources", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      status: {
        type: Sequelize.ENUM("SAVED", "IN_PROGRESS", "COMPLETED"),
        defaultValue: "SAVED",
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

    // Indexes for fast lookups
    await queryInterface.addIndex("learning_resources", ["skill_category"]);
    await queryInterface.addIndex("user_learning", ["user_id", "resource_id"], {
      unique: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("user_learning");
    await queryInterface.dropTable("learning_resources");
  },
};
