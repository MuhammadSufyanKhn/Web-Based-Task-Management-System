import axios from 'axios';

const api = axios.create({
    baseURL: 'https://localhost:7031/api', // Apni API ka port yahan check kar lena
});

export default api;