const express = require('express');
const {

    // createFile,
     getFile,
    //getFiles,
    // updateFile,
    // deleteFile

} = require('../controllers/file');


const router = express.Router({ mergeParams: true });
const { protect} = require('../middleware/auth');
 
//router.use(protect);

//router.route('/add').post(createFile);
//router.route('/').post(getFiles);

router.route('/:id').get(getFile);
  //  .post( updateFile)
  //  .delete( deleteFile);

module.exports = router;
