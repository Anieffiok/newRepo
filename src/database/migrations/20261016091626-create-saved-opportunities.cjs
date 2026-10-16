"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("saved_opportunities", {
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
      opportunity_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "opportunities",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      saved_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
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

    // Prevent duplicate saves
    await queryInterface.addConstraint("saved_opportunities", {
      fields: ["user_id", "opportunity_id"],
      type: "unique",
      name: "unique_user_opportunity_save",
    });

    await queryInterface.addIndex("saved_opportunities", ["user_id"], {
      name: "saved_opportunities_user_id_idx",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("saved_opportunities");
  },
};
