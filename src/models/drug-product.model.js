const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const DrugProduct = sequelize.define(
    "DrugProduct",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      brand_name: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      form: {
        type: DataTypes.TEXT,
      },
      route: {
        type: DataTypes.TEXT,
      },
      strength_text: {
        type: DataTypes.TEXT,
      },
      manufacturer: {
        type: DataTypes.TEXT,
      },
      country: {
        type: DataTypes.TEXT,
      },
      is_generic: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
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
      tableName: "drug_products",
      underscored: true,
      timestamps: false,
      indexes: [
        {
          name: "drug_products_brand_name_idx",
          fields: ["brand_name"],
        },
      ],
    }
  );

  return DrugProduct;
};
