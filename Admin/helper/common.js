var axios = require("axios");
exports.callApi = (req) => {
  axios.defaults.headers.common = { 'Authorization': `Bearer ${req.session.user.token}` }
  return axios;
}
exports.api_url = process.env.API_URL;

exports.redirect = (s) => {
  return process.env.API_URL + s
}
exports.api = (s) => {
  process.env.API_URL + s
}
