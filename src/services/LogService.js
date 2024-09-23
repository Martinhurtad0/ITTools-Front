import axios from '../axios'; // Importa tu configuración de axios

const LogService = {
  // Obtener todos los logs para un agente específico
  async getLogs(agentId) {
    try {
      const response = await axios.get(`/logs/${agentId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching logs:', error.message);
      throw error;
    }
  },

  // Obtener un archivo log específico para un agente
  async getLogFile(agentId, filename) {
    try {
      const response = await axios.get(`/logs/${agentId}/${filename}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching log file:', error.message);
      throw error;
    }
  },

  // Filtrar logs por fecha para un agente específico
  async filterLogsByDate(agentId, date) {
    try {
      const response = await axios.get(`/logs/filter/${agentId}?date=${date}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching logs by date:', error.message);
      throw error;
    }
  },

  // Método en el servicio
async zipLogFile(agentId, filename) {
  try {
    const response = await axios.get(`/logs/zip/${agentId}/${filename}`, {
      responseType: 'blob', // Para manejar la descarga de archivos binarios
  });

    // Verifica que la respuesta sea un archivo ZIP
    const contentType = response.headers['content-type'];
    if (contentType === 'application/zip' || contentType === 'application/octet-stream') {
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${filename}.zip`); // Establece el nombre del archivo
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Libera el objeto URL después de la descarga
      window.URL.revokeObjectURL(url);

      return 'File downloaded successfully';
    } else {
      throw new Error(`Invalid file type received. Expected ZIP, got ${contentType}.`);
    }
  } catch (error) {
    console.error('Error downloading log file:', error.message);
    throw error;
  }
}

};
export default LogService;
