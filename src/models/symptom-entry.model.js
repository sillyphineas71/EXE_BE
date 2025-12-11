const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const SymptomEntry = sequelize.define(
    "SymptomEntry",
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
      recorded_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      symptom_name: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      severity_score: {
        type: DataTypes.INTEGER,
        validate: {
          min: 0,
          max: 10,
        },
      },
      relation_to_med: {
        type: DataTypes.TEXT,
        validate: {
          isIn: [["before_medication", "after_medication", "unknown"]],
        },
      },
      description: {
        type: DataTypes.TEXT,
      },
      notes: {
        type: DataTypes.TEXT,
      },
      created_by_user_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "symptom_entries",
      underscored: true,
      timestamps: false,
      indexes: [
        {
          name: "idx_symptoms_profile",
          fields: ["profile_id"],
        },
      ],
    }
  );

  return SymptomEntry;
};
