const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Notification = sequelize.define(
    "Notification",
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
      type: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          isIn: [["medication_reminder", "system", "other"]],
        },
      },
      payload: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
      scheduled_at: {
        type: DataTypes.DATE,
      },
      sent_at: {
        type: DataTypes.DATE,
      },
      status: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: "pending",
        validate: {
          isIn: [["pending", "sent", "failed", "cancelled"]],
        },
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "notifications",
      underscored: true,
      timestamps: false,
      indexes: [
        {
          name: "idx_notifications_user",
          fields: ["user_id"],
        },
        {
          name: "idx_notifications_profile",
          fields: ["profile_id"],
        },
      ],
    }
  );

  return Notification;
};
