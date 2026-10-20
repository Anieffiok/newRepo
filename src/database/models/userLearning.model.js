import { DataTypes } from "sequelize";
import sequelize from "../../config/sequelize.js";

const UserLearning = sequelize.define(
  "UserLearning",
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
    resourceId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "resource_id",
    },
    status: {
      type: DataTypes.ENUM("SAVED", "IN_PROGRESS", "COMPLETED"),
      defaultValue: "SAVED",
      allowNull: false,
    },
  },
  {
    tableName: "user_learning",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);

export default UserLearning;
