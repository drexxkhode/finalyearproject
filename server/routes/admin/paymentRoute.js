const express    = require('express')
const router     = express.Router()
const adminAuth  = require('../../middleware/auth')
const { getAdminPayments } = require('../../controllers/paymentController')

router.get('/admin', adminAuth, getAdminPayments)

module.exports = router