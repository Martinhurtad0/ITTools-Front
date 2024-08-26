import axios from 'axios';

// Configurar Axios
axios.defaults.baseURL = 'http://192.168.2.148:8080'; // Cambia según tu baseURL

// Interceptor de solicitud para incluir el token JWT
axios.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token'); // Obtener el token JWT desde localStorage
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Interceptor de respuesta para manejar la expiración del token
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      // Eliminar el token JWT del localStorage si el token ha expirado o no es válido
      localStorage.removeItem('token');
      
      // Redirigir al usuario a la página de login o inicio
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default axios;
