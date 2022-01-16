const { Record, RecordType, Employee, validateInputRecord } = require('../models/models')
const sequelize = require('../db')
const ApiError = require('../error/ApiError')
// const { type } = require('express/lib/response')

class RecordController {
    async getRatings(req, res, next) {
        try {
            const { type, period } = req.query

            if (!type) return next(ApiError.badRequest('Некорректный type'))
            // if (!['day', 'week', 'month'].includes(period)) return next(ApiError.badRequest('Некорректный period'))

            let date = new Date()
            switch(period) {
                case 'day':
                    date.setDate(date.getDate() - 1);
                    break
                case 'week':
                    date.setDate(date.getDate() - 7);
                    break
                case 'month':
                    date.setMonth(date.getMonth() - 1);
                    break
                default: 
                    return next(ApiError.badRequest('Некорректный period'))
            }

            date = date.toISOString();

            let records = await sequelize.query(`
                select ROW_NUMBER () OVER (ORDER BY sum(sum) DESC),
                    "employeeId" as employee_id,
                    e.name as employee_name,
                    "recordTypeId" as type_id,
                    rt.name as type_name,
                    sum(sum) as sum
                from records r
                left join employees e on e.id = r."employeeId"
                left join record_types rt on r."recordTypeId" = rt.id
                where rt.name = '${type}'
                and r."createdAt" > '${date}'
                group by "employeeId", e.name, "recordTypeId", rt.name
            `, { type: sequelize.QueryTypes.SELECT})

            return res.json({ records })
        } catch (e) {
            next(ApiError.internal(e.message))
        }
    }

    async create(req, res, next) {
        try {
            let { records } = req.body

            let recordTypes = await RecordType.findAll()
            let recordTypeNames = (recordTypes).map(type => type.name)

            records.forEach(record => {
                const { error } = validateInputRecord(record)
                if (error) return next(ApiError.badRequest(error.details[0].message))
                if (!recordTypeNames.includes(record.type)) return next(ApiError.badRequest('Некорректный type ' + record.type))                
            })

            let result = []

            for (let i = 0; i < records.length; i++) {
                let employee = (await Employee.findOrCreate({ where: { name: records[i].employee } }))[0]
                let recordType = recordTypes.find(type => type.name == records[i].type)
                let record = await Record.create({ date: records[i].date,
                    sum: records[i].sum, 
                    recordTypeId: recordType.id, 
                    employeeId: employee.id 
                })
                if (record)
                    result.push({
                        employee_id: employee.id,
                        employee: employee.name,
                        type_id: recordType.id,
                        type: recordType.name,
                        date: record.date,
                        sum: record.sum
                    })
            }

            return res.status(201).json(result)
        } catch (e) {
            next(ApiError.internal(e.message))
        }

    }

}

module.exports = new RecordController()
