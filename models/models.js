const sequelize = require('../db')
const {DataTypes} = require('sequelize')
const Joi = require('joi');

const Record = sequelize.define('record', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    date: {type: DataTypes.DATE, allowNull: false},
    sum: {type: DataTypes.INTEGER, allowNull: false}
})

const validateInputRecord = (record) => {
    let date = new Date();
    let pastDate = date.getDate() - 7;
    date.setDate(pastDate);

    const schema = Joi.object({ 
        employee: Joi.string().required(),
        type: Joi.string().required(),
        date: Joi.date().iso().greater(date).required(),
        sum: Joi.number().integer().required(),
    });

    return schema.validate(record);
}

const RecordType = sequelize.define('record_type', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    name: {type: DataTypes.STRING, unique: true, allowNull: false}
})

const Employee = sequelize.define('employee', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    name: {type: DataTypes.STRING, allowNull: false}
})

RecordType.hasMany(Record)
Record.belongsTo(RecordType)

Employee.hasMany(Record)
Record.belongsTo(Employee)

module.exports = {
    Record,
    RecordType,
    Employee,
    validateInputRecord
}





