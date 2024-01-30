'use strict';
const {Model} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Chapters extends Model {
    static associate(models) {
      Chapters.belongsTo(models.Courses, {
        foreignKey: 'courseId',
        allowNull: false,
      });
    }
  }

  Chapters.init(
      {
        title: DataTypes.STRING,
        description: DataTypes.STRING,
        pages: DataTypes.ARRAY(DataTypes.TEXT),
        name: DataTypes.STRING,
        email: DataTypes.STRING,
        courseId: DataTypes.INTEGER,
      },
      {
        sequelize,
        modelName: 'Chapters',
      },
  );

  return Chapters;
};
