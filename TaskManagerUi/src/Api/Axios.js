import axios from 'axios';

const api = axios.create({
    baseURL: 'https://localhost:7127/api',
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            const status = error.response.status;
            if (status === 403) {
                const serverMsg = error.response.data?.message;
                error.userFriendlyMessage = serverMsg || "You don't have permission to perform this action.";
            } else if (status === 401) {
                error.userFriendlyMessage = "Your session has expired. Please log in again.";
            }
        }
        return Promise.reject(error);
    }
);

export default api;