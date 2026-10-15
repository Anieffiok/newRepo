/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("certifications", {
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
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      issuer: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      issue_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      expiry_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      credential_id: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      credential_url: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      verification_status: {
        type: Sequelize.ENUM("PENDING", "VERIFIED", "REJECTED"),
        defaultValue: "PENDING",
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

    await queryInterface.addIndex("certifications", ["user_id"], {
      name: "certifications_user_id_idx",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("certifications");
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_certifications_verification_status";',
    );
  },
};
