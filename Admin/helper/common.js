var axios = require("axios");
exports.callApi =(req)=>{
  axios.defaults.headers.common = {'Authorization': `Bearer ${req.session.user.token}`}
  return axios;
}