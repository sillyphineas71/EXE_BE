const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const PushDevice = sequelize.define(
    "PushDevice",
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
      device_platform: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          isIn: [["ios", "android", "web", "other"]],
        },
      },
      device_token: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      last_seen_at: {
        type: DataTypes.DATE,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "push_devices",
      underscored: true,
      timestamps: false,
      indexes: [
        {
          name: "push_device_unique_user_token",
          unique: true,
          fields: ["user_id", "device_token"],
        },
        {
          name: "idx_push_devices_user",
          fields: ["user_id"],
        },
      ],
    }
  );

  return PushDevice;
};
