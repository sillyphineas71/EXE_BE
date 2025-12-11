const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const ProductSubstance = sequelize.define(
    "ProductSubstance",
    {
      product_id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
      },
      substance_id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
      },
      strength_value: {
        type: DataTypes.DECIMAL(10, 3),
      },
      strength_unit: {
        type: DataTypes.TEXT,
      },
    },
    {
      tableName: "product_substances",
      underscored: true,
      timestamps: false,
    }
  );

  return ProductSubstance;
};
