import { DataTypes } from "sequelize";
import sequelize from "../../config/sequelize.js";

const Notification = sequelize.define(
  "Notification",
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
    type: {
      type: DataTypes.ENUM(
        "DEADLINES",
        "OPPORTUNITIES",
        "APPLICATION_UPDATES",
        "SECURITY_ALERTS",
      ),
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    body: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      field: "is_read",
    },
    relatedEntityType: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "related_entity_type",
    },
    relatedEntityId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "related_entity_id",
    },
  },
  {
    tableName: "notifications",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);

export default Notification;
