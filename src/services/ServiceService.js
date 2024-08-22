import axios from '../axios'; // Importa la instancia de Axios configurada con la baseURL y el interceptor

export const serviceService = {
  async createService(serviceData) {
    try {
      const response = await axios.post('/api/services/register', serviceData); // Usando rutas relativas
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error creating service');
    }
  },

  async getAllServices() {
    try {
      const response = await axios.get('/api/services'); // Usando rutas relativas
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error fetching services');
    }
  },

  async getServiceById(id) {
    try {
      const response = await axios.get(`/api/services/${id}`); // Usando rutas relativas
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error fetching service');
    }
  },

  async updateService(service) {
    try {
      const response = await axios.put(`/api/services/${service.idService}`, service); // Usando rutas relativas
      return response.data;
    } catch (error) {
      console.error('Error updating service:', error);
      throw error; // Lanzar el error para que pueda ser manejado en el componente
    }
  },

  async deleteService(id) {
    try {
      const response = await axios.delete(`/api/services/${id}`); // Usando rutas relativas
      return response.data;
    } catch (error) {
      console.error('Error deleting service:', error);
      throw error;
    }
  }
};
