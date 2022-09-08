const path = require('path');
const fs = require('fs');

module.exports = {
   makeid, uploadFile, deletDiskFile
}

function makeid(length) {
   var result = '';
   var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
   var charactersLength = characters.length;
   for (var i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
   }
   return result;
}

function uploadFile(req, filename, res) {
   let sampleFile;
   let uploadPath;
   // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
   sampleFile = req.files.file;

   uploadPath = path.resolve(__dirname, '../../assets/' + filename);

   // Use the mv() method to place the file somewhere on your server
   req.files.file.mv(uploadPath, function (err) {
      if (err)
         return res.status(500).send(err);
      // res.send('File uploaded!');
   });

}

function deletDiskFile(filePath) {

   fs.exists(filePath, function (exists) {
      if (exists) {
         console.log('File exists. Deleting now ...');
         fs.unlinkSync(filePath);
      } else {
         console.log('File not found, so not deleting.');
      }
   });
}