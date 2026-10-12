import { DataTypes } from "sequelize";
import sequelize from "../../config/sequelize.js";

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    firstName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: "first_name",
      set(value) {
        this.setDataValue("firstName", value ? value.trim() : null);
      },
    },
    lastName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: "last_name",
      set(value) {
        this.setDataValue("lastName", value ? value.trim() : null);
      },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
      set(value) {
        this.setDataValue("email", value.trim().toLowerCase());
      },
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "password_hash",
    },
    role: {
      type: DataTypes.ENUM("USER", "ADMIN", "OPERATIONS", "MODERATOR"),
      defaultValue: "USER",
      allowNull: false,
    },
    accountStatus: {
      type: DataTypes.ENUM("ACTIVE", "SUSPENDED", "DEACTIVATED"),
      defaultValue: "ACTIVE",
      allowNull: false,
      field: "account_status",
    },
    emailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      field: "email_verified",
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "last_login_at",
    },
  },
  {
    tableName: "users",
    timestamps: true,
    defaultScope: {
      attributes: { exclude: ["passwordHash"] },
    },
    scopes: {
      withPassword: {
        attributes: { include: ["passwordHash"] },
      },
    },
  },
);

export default User;
