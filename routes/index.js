const Router = require('express')
const router = new Router()
const RecordController = require('../controllers/RecordController')

router.get('/ratings', RecordController.getRatings)
router.post('/records', RecordController.create)

module.exports = router