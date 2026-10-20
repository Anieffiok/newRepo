import { DataTypes } from "sequelize";
import sequelize from "../../config/sequelize.js";

const PracticeSession = sequelize.define(
  "PracticeSession",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "user_id",
    },
    opportunityId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "opportunity_id",
    },
    questions: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("GENERATED", "IN_PROGRESS", "COMPLETED"),
      defaultValue: "GENERATED",
      allowNull: false,
    },
  },
  {
    tableName: "practice_sessions",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);

export default PracticeSession;
