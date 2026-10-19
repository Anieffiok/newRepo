import { DataTypes } from "sequelize";
import sequelize from "../../config/sequelize.js";

const Action = sequelize.define(
  "Action",
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
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    priority: {
      type: DataTypes.ENUM("HIGH", "MEDIUM", "LOW"),
      defaultValue: "MEDIUM",
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("OPEN", "DONE", "DISMISSED"),
      defaultValue: "OPEN",
      allowNull: false,
    },
    dueDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: "due_date",
    },
    sourceType: {
      type: DataTypes.ENUM(
        "READINESS",
        "DEADLINE",
        "PREPARATION",
        "REVIEW",
        "APPLICATION",
      ),
      allowNull: false,
      field: "source_type",
    },
    sourceId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "source_id",
    },
  },
  {
    tableName: "actions",
    timestamps: true,
  },
);

export default Action;
