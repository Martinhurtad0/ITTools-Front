import axios from '../axios';

export const roleService = {
  
  // Obtener todos los roles
  async getRoles() {
    try {
      const response = await axios.get('/roles');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch roles:', error);
      throw new Error(error.response?.data || 'Failed to fetch roles');
    }
  },

  // Registrar un nuevo rol
  async registerRole(roleData) {
    try {
      const response = await axios.post('/roles', roleData);
      return response.data;
    } catch (error) {
      console.error('Registration failed:', error);
      throw new Error(error.response?.data || 'Registration failed');
    }
  },

  // Actualizar un rol existente
  async updateRole(roleId, roleData) {
    try {
      const response = await axios.put(`/roles/${roleId}`, roleData);
      return response.data;
    } catch (error) {
      console.error('Update failed:', error);
      throw new Error(error.response?.data || 'Update failed');
    }
  },

  // Eliminar un rol
  async deleteRole(roleId) {
    try {
      await axios.delete(`/roles/${roleId}`);
    } catch (error) {
      console.error('Delete failed:', error);
      throw new Error(error.response?.data || 'Delete failed');
    }
  }
};
