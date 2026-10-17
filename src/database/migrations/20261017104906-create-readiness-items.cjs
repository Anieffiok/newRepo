"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_readiness_items_item_type" AS ENUM (
        'PROFILE', 'SKILL', 'DOCUMENT', 'CERTIFICATION', 'ASSESSMENT', 'EXPERIENCE'
      );
    `);

    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_readiness_items_status" AS ENUM (
        'PENDING', 'DONE', 'DISMISSED'
      );
    `);

    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_readiness_items_priority" AS ENUM (
        'HIGH', 'MEDIUM', 'LOW'
      );
    `);

    await queryInterface.createTable("readiness_items", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      readiness_result_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "readiness_results", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      item_type: {
        type: Sequelize.ENUM(
          "PROFILE",
          "SKILL",
          "DOCUMENT",
          "CERTIFICATION",
          "ASSESSMENT",
          "EXPERIENCE",
        ),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM("PENDING", "DONE", "DISMISSED"),
        defaultValue: "PENDING",
        allowNull: false,
      },
      priority: {
        type: Sequelize.ENUM("HIGH", "MEDIUM", "LOW"),
        defaultValue: "MEDIUM",
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      profile_section: {
        type: Sequelize.STRING(50),
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

    await queryInterface.addIndex("readiness_items", ["readiness_result_id"], {
      name: "readiness_items_result_id_idx",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("readiness_items");
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_readiness_items_item_type";',
    );
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_readiness_items_status";',
    );
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_readiness_items_priority";',
    );
  },
};
