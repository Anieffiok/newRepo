"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_application_stages_stage_type" AS ENUM (
        'APPLIED', 'ASSESSMENT', 'INTERVIEW', 'FINAL_STAGE', 'OTHER'
      );
    `);

    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_application_stages_status" AS ENUM (
        'PLANNED', 'COMPLETED', 'SKIPPED'
      );
    `);

    await queryInterface.createTable("application_stages", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      application_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "applications", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      stage_type: {
        type: Sequelize.ENUM(
          "APPLIED",
          "ASSESSMENT",
          "INTERVIEW",
          "FINAL_STAGE",
          "OTHER",
        ),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM("PLANNED", "COMPLETED", "SKIPPED"),
        defaultValue: "PLANNED",
        allowNull: false,
      },
      scheduled_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      completion_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      assessment_area: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      sort_order: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
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

    await queryInterface.addIndex("application_stages", ["application_id"], {
      name: "app_stages_application_id_idx",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("application_stages");
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_application_stages_stage_type";',
    );
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_application_stages_status";',
    );
  },
};
