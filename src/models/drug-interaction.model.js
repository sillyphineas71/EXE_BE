const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const DrugInteraction = sequelize.define(
    "DrugInteraction",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      substance_id_1: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      substance_id_2: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      severity: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          isIn: [["mild", "moderate", "severe", "contraindicated"]],
        },
      },
      description: {
        type: DataTypes.TEXT,
      },
      management: {
        type: DataTypes.TEXT,
      },
      source_id: {
        type: DataTypes.UUID,
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
      tableName: "drug_interactions",
      underscored: true,
      timestamps: false,
      indexes: [
        {
          name: "unique_interaction_pair",
          unique: true,
          fields: ["substance_id_1", "substance_id_2"],
        },
        {
          name: "idx_interactions_sub1",
          fields: ["substance_id_1"],
        },
        {
          name: "idx_interactions_sub2",
          fields: ["substance_id_2"],
        },
      ],
    }
  );

  return DrugInteraction;
};
