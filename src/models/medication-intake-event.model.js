const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const MedicationIntakeEvent = sequelize.define(
    "MedicationIntakeEvent",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      regimen_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      profile_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      scheduled_time: {
        type: DataTypes.DATE,
      },
      taken_time: {
        type: DataTypes.DATE,
      },
      status: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          isIn: [["taken", "skipped", "delayed", "unknown"]],
        },
      },
      dose_amount_taken: {
        type: DataTypes.DECIMAL(10, 3),
      },
      notes: {
        type: DataTypes.TEXT,
      },
      recorded_by_user_id: {
        type: DataTypes.UUID,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "medication_intake_events",
      underscored: true,
      timestamps: false,
      indexes: [
        {
          name: "idx_med_intake_regimen",
          fields: ["regimen_id"],
        },
        {
          name: "idx_med_intake_profile",
          fields: ["profile_id"],
        },
      ],
    }
  );

  return MedicationIntakeEvent;
};
