const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const ProfileShare = sequelize.define(
    "ProfileShare",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      profile_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      role: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          isIn: [["owner", "caregiver", "viewer"]],
        },
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "profile_shares",
      underscored: true,
      timestamps: false,
      indexes: [
        {
          name: "profile_shares_profile_user_unique",
          unique: true,
          fields: ["profile_id", "user_id"],
        },
        {
          name: "idx_profile_shares_user",
          fields: ["user_id"],
        },
      ],
    }
  );

  return ProfileShare;
};
