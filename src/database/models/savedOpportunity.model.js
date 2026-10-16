import { DataTypes } from "sequelize";
import sequelize from "../../config/sequelize.js";

const SavedOpportunity = sequelize.define(
  "SavedOpportunity",
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
    savedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: "saved_at",
    },
  },
  {
    tableName: "saved_opportunities",
    timestamps: true,
  },
);

export default SavedOpportunity;
