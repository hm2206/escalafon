const axios = require('axios').default;
const { API } = require('./tools');


const authentication = {
    config: (options = {}) => {
        for (let opt in options) {
            axios.defaults.headers.common[opt] = options[opt]; 
        }
    },
    get: async (path, config) => {
        return axios.get(`${API.API_AUTHENTICATION}/${path}`, config);
    },
    post: (path, data = {}, config) => {
        return axios.post(`${API.API_AUTHENTICATION}/${path}`, data, config);
    },
}

const apiClock = {
    config: (options = {}) => {
        for (let opt in options) {
            axios.defaults.headers.common[opt] = options[opt]; 
        }
    },
    get: async (path, config) => {
        return axios.get(`${API.API_CLOCK}/${path}`, config);
    },
    post: (path, data = {}, config) => {
        return axios.post(`${API.API_CLOCK}/${path}`, data, config);
    },
}


module.exports = { 
    authentication,   
    apiClock, 
}