var axios = require("axios");
const fs = require('fs');
const path = require("path");

exports.callApi = (req) => {
    
  axios.defaults.headers.common = { 'Authorization': `Bearer ${req.cookies.token}` }
  return axios;
}
exports.api_url = process.env.API_URL;

exports.adminUi = (s) => {
  return process.env.ADMIN_URL + s
}
exports.uploadFile = (req, filename, res)=> {
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

exports.deletDiskFile= (filePath  )=> {

  fs.exists(filePath, function (exists) {
     if (exists) {
        console.log('File exists. Deleting now ...');
        fs.unlinkSync(filePath);
     } else {
        console.log('File not found, so not deleting.');
     }
  });
}
exports.gameIdToName = {1:'ludo',2:'Dragon Tiger',3:'Teen patti',4:'Rouletee',5:'Tambola',6:'Crash'}

exports.stateList = [{ type: 'state', code: 'IN-AP', name: 'Andhra Pradesh' },
{ type: 'state', code: 'IN-AR', name: 'Arunachal Pradesh' },
{ type: 'state', code: 'IN-AS', name: 'Assam' },
{ type: 'state', code: 'IN-BR', name: 'Bihar' },
{ type: 'state', code: 'IN-CT', name: 'Chhattīsgarh' },
{ type: 'state', code: 'IN-GA', name: 'Goa' },
{ type: 'state', code: 'IN-GJ', name: 'Gujarat' },
{ type: 'state', code: 'IN-HR', name: 'Haryana' },
{ type: 'state', code: 'IN-HP', name: 'Himachal Pradesh' },
{ type: 'state', code: 'IN-JH', name: 'Jharkhand' },
{ type: 'state', code: 'IN-KA', name: 'Karnataka' },
{ type: 'state', code: 'IN-KL', name: 'Kerala' },
{ type: 'state', code: 'IN-MP', name: 'Madhya Pradesh' },
{ type: 'state', code: 'IN-MH', name: 'Maharashtra' },
{ type: 'state', code: 'IN-MN', name: 'Manipur' },
{ type: 'state', code: 'IN-ML', name: 'Meghalaya' },
{ type: 'state', code: 'IN-MZ', name: 'Mizoram' },
{ type: 'state', code: 'IN-NL', name: 'Nagaland' },
{ type: 'state', code: 'IN-OR', name: 'Odisha' },
{ type: 'state', code: 'IN-PB', name: 'Punjab' },
{ type: 'state', code: 'IN-RJ', name: 'Rajasthan' },
{ type: 'state', code: 'IN-SK', name: 'Sikkim' },
{ type: 'state', code: 'IN-TN', name: 'Tamil Nadu' },
{ type: 'state', code: 'IN-TG', name: 'Telangana' },
{ type: 'state', code: 'IN-TR', name: 'Tripura' },
{ type: 'state', code: 'IN-UP', name: 'Uttar Pradesh' },
{ type: 'state', code: 'IN-UT', name: 'Uttarakhand' },
{ type: 'state', code: 'IN-WB', name: 'West Bengal' },
{ type: 'state', code: 'IN-AN', name: 'Andaman and Nicobar Islands' },
{ type: 'state', code: 'IN-CH', name: 'Chandīgarh' },
{ type: 'state', code: 'IN-DL', name: 'Delhi' },
{ type: 'state', code: 'IN-DH', name: 'Dadra and Nagar Haveli and Daman and Diu' },
{ type: 'state', code: 'IN-JK', name: 'Jammu and Kashmīr' },
{ type: 'state', code: 'IN-LA', name: 'Ladakh' },
{ type: 'state', code: 'IN-LD', name: 'Lakshadweep' },
{ type: 'state', code: 'IN-PY', name: 'Puducherry Pondicherry' },
];