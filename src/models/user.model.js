const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const User = sequelize.define(
    "User",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      email: {
        type: DataTypes.TEXT,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      password_hash: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      full_name: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      phone_number: {
        type: DataTypes.TEXT,
      },
      role_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      status: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: "active",
        validate: {
          isIn: [["active", "disabled", "pending"]],
        },
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      last_login_at: {
        type: DataTypes.DATE,
      },
    },
    {
      tableName: "users",
      underscored: true,
      timestamps: false,
      indexes: [
        {
          name: "idx_users_role",
          fields: ["role_id"],
        },
      ],
    }
  );

  return User;
};
