const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const NotificationPreference = sequelize.define(
    "NotificationPreference",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      profile_id: {
        type: DataTypes.UUID,
      },
      allow_push: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      allow_email: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      quiet_hours_start: {
        type: DataTypes.TIME,
      },
      quiet_hours_end: {
        type: DataTypes.TIME,
      },
      timezone: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: "Asia/Ho_Chi_Minh",
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
    },
    {
      tableName: "notification_preferences",
      underscored: true,
      timestamps: false,
      indexes: [
        {
          name: "notification_preferences_user_profile_unique",
          unique: true,
          fields: ["user_id", "profile_id"],
        },
      ],
    }
  );

  return NotificationPreference;
};
