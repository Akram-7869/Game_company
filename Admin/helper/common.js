var axios = require("axios");
exports.callApi = (req) => {
  axios.defaults.headers.common = { 'Authorization': `Bearer ${req.session.user.token}` }
  return axios;
}
exports.api_url = process.env.API_URL;

exports.adminUi = (s) => {
  return process.env.ADMIN_URL + s
}
