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
 async zipLogFile(agentId, filenames) {
  try {
    const response = await axios.post(
      `/logs/zip/${agentId}`, 
      filenames,  // Send filenames directly
      {
        responseType: 'blob',  // Handle binary file response
      }
    );

    // Check if the response is a ZIP file
    const contentType = response.headers['content-type'];
    if (contentType === 'application/zip' || contentType === 'application/octet-stream') {
      // Create a Blob from the response and download the file
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `logs.zip`); // Set the file name for download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Release the URL object after the download
      window.URL.revokeObjectURL(url);

      return 'File downloaded successfully';
    } else {
      throw new Error(`Invalid file type received. Expected ZIP, got ${contentType}.`);
    }
  } catch (error) {
    console.error('Error downloading log file:', error.message);
    throw error;
  }
},


async getLogsByTransaction(agentId, transactionId, date) {
  try {
    const response = await axios.get(`/logs/transaction/${agentId}?transactionId=${transactionId}&date=${date}`);
    return response.data; // Asegúrate de que esto sea lo que esperas
  } catch (error) {
    console.error('Error fetching transaction logs:', error.message);
    throw error;
  }
},

async searchLogsInSelectedFiles(agentId, idTransaction, selectedFiles) {
  try {
      // Validación de entrada
      if (!idTransaction || !selectedFiles || selectedFiles.length === 0) {
          throw new Error('idTransaction and selectedFiles are required.');
      }

      // Preparar el cuerpo de la solicitud
      const requestBody = {
          idTransaction: idTransaction,
          selectedFiles: selectedFiles
      };

      // Realizar la solicitud POST
      const response = await axios.post(`/logs/search_selected/${agentId}`, requestBody);

      // Retornar la respuesta del servidor
      return response.data;
  } catch (error) {
      console.error('Error searching logs in selected files:', error.message);
      throw error;
  }
}


};
export default LogService;
