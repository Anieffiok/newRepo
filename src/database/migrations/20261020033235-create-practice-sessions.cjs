"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("practice_sessions", {
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
      opportunity_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "opportunities", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      questions: {
        type: Sequelize.JSONB,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM("GENERATED", "IN_PROGRESS", "COMPLETED"),
        defaultValue: "GENERATED",
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

    await queryInterface.addIndex("practice_sessions", [
      "user_id",
      "opportunity_id",
    ]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("practice_sessions");
  },
};
