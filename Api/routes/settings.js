const express = require('express');
const {

    createSetting,
    getSetting,
    getSettings,
    updateSetting,
    deleteSetting

} = require('../controllers/settings');


const router = express.Router({ mergeParams: true });

const { advancedResults, ownResults, defaultResults } = require('../middleware/advancedResults');
const { protect, authorize, init } = require('../middleware/auth');
const Setting = require('../models/Setting');


router.route('/add').post(createSetting);
router.route('/').post(getSettings);

router
    .route('/:id')
    .get(getSetting)
    .post( updateSetting)
    .delete( deleteSetting);

module.exports = router;
