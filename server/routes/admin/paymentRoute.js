const express    = require('express')
const router     = express.Router()
const adminAuth  = require('../../middleware/auth')
const { getAdminPayments } = require('../../controllers/paymentController')
const { getCheckoutConfig } = require('../../controllers/paymentSettingsController')

router.get('/admin', adminAuth, getAdminPayments)
router.get('/config', getCheckoutConfig)

module.exports = router
