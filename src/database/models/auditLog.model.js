import { DataTypes } from "sequelize";
import sequelize from "../../config/sequelize.js";

const AuditLog = sequelize.define(
  "AuditLog",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    adminId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "admin_id",
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    targetType: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "target_type",
    },
    targetId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "target_id",
    },
    details: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
  },
  {
    tableName: "audit_logs",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);

export default AuditLog;
