"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_actions_priority" AS ENUM ('HIGH', 'MEDIUM', 'LOW');
    `);

    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_actions_status" AS ENUM ('OPEN', 'DONE', 'DISMISSED');
    `);

    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_actions_source_type" AS ENUM (
        'READINESS', 'DEADLINE', 'PREPARATION', 'REVIEW', 'APPLICATION'
      );
    `);

    await queryInterface.createTable("actions", {
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
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      reason: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      priority: {
        type: Sequelize.ENUM("HIGH", "MEDIUM", "LOW"),
        defaultValue: "MEDIUM",
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM("OPEN", "DONE", "DISMISSED"),
        defaultValue: "OPEN",
        allowNull: false,
      },
      due_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      source_type: {
        type: Sequelize.ENUM(
          "READINESS",
          "DEADLINE",
          "PREPARATION",
          "REVIEW",
          "APPLICATION",
        ),
        allowNull: false,
      },
      source_id: {
        type: Sequelize.UUID,
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

    await queryInterface.addIndex("actions", ["user_id", "status"], {
      name: "actions_user_status_idx",
    });
    await queryInterface.addIndex("actions", ["due_date"], {
      name: "actions_due_date_idx",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("actions");
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_actions_priority";',
    );
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_actions_status";',
    );
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_actions_source_type";',
    );
  },
};
