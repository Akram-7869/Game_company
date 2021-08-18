const fs = require('fs');
const mongoose = require('mongoose');
const colors = require('colors');
const dotenv = require('dotenv');

// Load env vars
dotenv.config({ path: './config/config.env' });

// Load models
const Dashboard = require('./models/Dashboard');
const User = require('./models/User');
// Connect to DB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false,
  useUnifiedTopology: true
});

// Read JSON files
// const services = JSON.parse(
//   // fs.readFileSync(`${__dirname}/_data/services.json`, 'utf-8')
// );

// const lookups = JSON.parse(
//   // fs.readFileSync(`${__dirname}/_data/lookups.json`, 'utf-8')
// );

// const users = JSON.parse(
//   // fs.readFileSync(`${__dirname}/_data/users.json`, 'utf-8')
// );


// Import into DB
const importData = async () => {
  try {
    let dash = {
      "type": "dashboard",
      "livePlayers": 0,
      "grossIncome": 0,
      "totalIncome": 0,
      "active": true,
      "chartData": [],
      "chartType": "daily_game",
      "totalPayoutRequest": 0,
      "totalPlayers": 0,
      "totalSupportTicket": 0
    }
    await Dashboard.create(dash);


    console.log('Data Imported...'.green.inverse);
    process.exit();
  } catch (err) {
    console.error(err);
  }
};

// Delete data
const deleteData = async () => {
  try {
    await Service.deleteMany();
    await Lookup.deleteMany();
    await User.deleteMany();
    console.log('Data Destroyed...'.red.inverse);
    process.exit();
  } catch (err) {
    console.error(err);
  }
};

if (process.argv[2] === '-i') {
  importData();
} else if (process.argv[2] === '-d') {
  deleteData();
}
