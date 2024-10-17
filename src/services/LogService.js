import axios from '../axios'; // Importa tu configuración de axios

const LogService = {
  // Obtener todos los logs para un agente específico
  async getLogs(agentId, region) {
    try {
      const response = await axios.get(`/logs/${agentId}?region=${region}`); // Añadir región como query param
      return response.data;
    } catch (error) {
      console.error('Error fetching logs:', error.message);
      throw error;
    }
  },

  // Obtener un archivo log específico para un agente
  async getLogFile(agentId, filename, region) {
    try {
      const response = await axios.get(`/logs/${agentId}/${filename}?region=${region}`); // Añadir región
      return response.data;
    } catch (error) {
      console.error('Error fetching log file:', error.message);
      throw error;
    }
  },

  // Filtrar logs por fecha para un agente específico
  async filterLogsByDate(agentId, date, region) {
    try {
      const response = await axios.get(`/logs/filter/${agentId}?date=${date}&region=${region}`); // Añadir región
      return response.data;
    } catch (error) {
      console.error('Error fetching logs by date:', error.message);
      throw error;
    }
  },

  // Filtrar logs_archive por fecha para un agente específico
  async filterLogsArchiveByDate(agentId, date, region) {
    try {
      const response = await axios.get(`/logs/filter_archive/${agentId}?date=${date}&region=${region}`); // Añadir región
      return response.data;
    } catch (error) {
      console.error('Error fetching logs archive by date:', error.message);
      throw error;
    }
  },

  // Método para zip de archivos log
  async zipLogFile(agentId, filenames, region) {
    try {
      const response = await axios.post(
        `/logs/zip/${agentId}?region=${region}`,  // Añadir región como query param
        filenames,  // Envía directamente los nombres de los archivos
        {
          responseType: 'blob',  // Maneja la respuesta de archivo binario
        }
      );

      // Verifica si la respuesta es un archivo ZIP
      const contentType = response.headers['content-type'];
      if (contentType === 'application/zip' || contentType === 'application/octet-stream') {
        // Crea un Blob a partir de la respuesta y descarga el archivo
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `logs.zip`); // Establece el nombre del archivo para descargar
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
  },

  // Obtener logs por ID de transacción
  async getLogsByTransaction(agentId, transactionId, date, region) {
    try {
      const response = await axios.get(`/logs/transaction/${agentId}?transactionId=${transactionId}&date=${date}&region=${region}`); // Añadir región
      return response.data; // Asegúrate de que esto sea lo que esperas
    } catch (error) {
      console.error('Error fetching transaction logs:', error.message);
      throw error;
    }
  },

 // Buscar logs en archivos seleccionados
async searchLogsInSelectedFiles(agentId, idTransaction, selectedFiles, region) {
  try {
      // Validación de entrada
      if (!idTransaction || !selectedFiles || selectedFiles.length === 0 || !region) {
          throw new Error('idTransaction, selectedFiles, and region are required.');
      }

      // Preparar el cuerpo de la solicitud
      const requestBody = {
          idTransaction: idTransaction,
          selectedFiles: selectedFiles
      };

      // Realizar la solicitud POST
      const response = await axios.post(`/logs/search_selected/${agentId}?region=${region}`, requestBody);

      // Retornar la respuesta del servidor
      return response.data;
  } catch (error) {
      console.error('Error searching logs in selected files:', error.message);
      // Aquí puedes manejar el error de una manera más específica si es necesario
      throw error;
  }
}

};

export default LogService;
