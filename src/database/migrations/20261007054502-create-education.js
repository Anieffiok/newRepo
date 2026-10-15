export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("education", {
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
      institution: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      qualification: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      field_of_study: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      start_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      end_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      country: {
        type: Sequelize.STRING(100),
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

    await queryInterface.addIndex("education", ["user_id"], {
      name: "education_user_id_idx",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("education");
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_education_verification_status";',
    );
  },
};
