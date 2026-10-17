import { DataTypes } from "sequelize";
import sequelize from "../../config/sequelize.js";

const EligibilityItem = sequelize.define(
  "EligibilityItem",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    eligibilityResultId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "eligibility_result_id",
    },
    requirementId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "requirement_id",
    },
    result: {
      type: DataTypes.ENUM(
        "SATISFIED",
        "POTENTIAL_GAP",
        "NOT_SATISFIED",
        "INFORMATION_NEEDED",
        "NOT_APPLICABLE",
      ),
      allowNull: false,
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    userInfoUsed: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "user_info_used",
    },
  },
  {
    tableName: "eligibility_items",
    timestamps: true,
  },
);

export default EligibilityItem;
