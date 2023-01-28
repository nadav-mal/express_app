'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Message extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }

  Message.init({
    imgDate: {
      type: DataTypes.STRING,
      validate: {
        is: {
          args: /^\d{4}-\d{2}-\d{2}$/,
          msg: 'imgDate must be in the format of yyyy-mm-dd'
        }
      }
    },
    content: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: true,
        len: {
          args: [1, 132],
          msg: 'Message length has to be between 1-132 chars'
        },
      }
    },
    email: {
      type: DataTypes.STRING,
      validate: {
        isEmail: {
          msg: 'Invalid email'
        },
      }
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    }
  }, {
    sequelize,
    modelName: 'Message',
  });

  return Message;
};