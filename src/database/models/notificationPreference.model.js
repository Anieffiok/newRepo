import { DataTypes } from "sequelize";
import sequelize from "../../config/sequelize.js";

const NotificationPreference = sequelize.define(
  "NotificationPreference",
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
    channel: {
      type: DataTypes.ENUM("EMAIL", "IN_APP"),
      defaultValue: "IN_APP",
      allowNull: false,
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
    enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
  },
  {
    tableName: "notification_preferences",
    timestamps: true,
  },
);

export default NotificationPreference;
