const express = require('express');
const {

   // createFile,
     getFile,uploadFile,
    //getFiles,
    //updateFile,
    // deleteFile

} = require('../controllers/file');


const router = express.Router({ mergeParams: true });
const { protect} = require('../middleware/auth');
 
//router.use(protect);

router.route('/upload').post(uploadFile);
//router.route('/').post(getFiles);

router.route('/:id').get(getFile);
  //  .post( updateFile)
  //  .delete( deleteFile);

module.exports = router;
