import { DataTypes } from "sequelize";
import sequelize from "../../config/sequelize.js";

const DeletionRequest = sequelize.define(
  "DeletionRequest",
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
    reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("PENDING", "PROCESSING", "COMPLETED", "CANCELLED"),
      defaultValue: "PENDING",
      allowNull: false,
    },
    processedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "processed_at",
    },
  },
  {
    tableName: "deletion_requests",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);

export default DeletionRequest;
