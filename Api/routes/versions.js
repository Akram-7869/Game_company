const express = require('express');
const {

    createVersion,
    getVersion,
    getVersions,
    updateVersion,
    deleteVersion

} = require('../controllers/versions');


const router = express.Router({ mergeParams: true });
const { protect} = require('../middleware/auth');
 
router.use(protect);

router.route('/add').post(createVersion);
router.route('/').post(getVersions);

router
    .route('/:id')
    .get(getVersion)
    .post( updateVersion)
    .delete( deleteVersion);

module.exports = router;
