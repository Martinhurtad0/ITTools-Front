
<script>
import { serverService } from '@/services/AgentService';
import { regionService } from '@/services/RegionService';
import { serviceService } from '@/services/ServiceService';
import Button from 'primevue/button';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';

export default {
  components: {
    InputText,
    Button,
    Dropdown,
    DataTable,
    Column,
  },
  data() {
    return {
      services: [],
      servers: [],
      filteredServers: [], // Agregado para gestionar los servidores filtrados
      selectedServer: null,
      serviceName: '',
      description: '',
      command: '',
      pathCommand: '',
      logFile: '',
      type: null,
      selectedRegion: null,
      regions: [],
      error: '',
      typeOptions: [true, false]
    };
  },
  async created() {
    await this.loadRegions();
    await this.loadServers(); // Cargar todos los servidores al inicio
    await this.loadServices();
  },
  methods: {
    async loadRegions() {
      try {
        this.regions = await regionService.getAllRegions();
      } catch (error) {
        console.error('Error fetching regions:', error);
        this.error = 'Error al cargar las regiones';
      }
    },

    async onRegionChange() {
  if (!this.selectedRegion) {
    await this.loadServers(); // Cargar todos los servidores si no hay región seleccionada
  } else {
    await this.loadServersByRegion(this.selectedRegion); // Cargar servidores filtrados por región
  }
}
,

async loadServers() {
  try {
    this.servers = await serverService.getAllServers();
    this.servers = this.servers.filter(server => server.status === 1); // Filtrar servidores activos
    this.filteredServers = this.servers; // Mostrar todos los servidores cuando no hay región seleccionada
  } catch (error) {
    console.error('Error fetching servers:', error);
    this.error = 'Error al cargar los servidores';
  }
}
,

async loadServersByRegion(idRegion) {
      try {
        this.filteredServers = await serverService.loadServersByRegion(idRegion);
        this.servers = this.filteredServers; // Actualizar servidores con los filtrados
      } catch (error) {
        console.error('Error fetching servers by region:', error);
        this.error = 'Error al cargar los servidores';
      }
    }
,

async loadServices() {
  try {
    const response = await serviceService.getAllServices();
    if (response.length === 0) {
      this.error = 'No hay servicios agregados';
      this.services = []; // Asegúrate de que `services` esté inicializado como una lista vacía
    } else {
      this.services = response;
      this.error = ''; // Limpia el mensaje de error si hay servicios
    }
  } catch (error) {
    console.error('Error fetching services:', error);
    this.error = 'Error al cargar los servicios';
    this.services = []; // Asegúrate de que `services` esté inicializado como una lista vacía en caso de error
  }
}
,

    async createService() {
      if (!this.selectedServer) {
        this.error = "Por favor, selecciona un servidor.";
        return;
      }

      try {
        const serviceData = {
          serviceName: this.serviceName,
          description: this.description,
          command: this.command,
          pathCommand: this.pathCommand,
          logFile: this.logFile,
          type: this.type ? 1 : 0,
          idAgent: this.selectedServer
        };

        await serviceService.createService(serviceData);
        alert('Servicio creado exitosamente');
        this.resetForm();
        await this.loadServices(); // Recargar servicios después de la creación
      } catch (err) {
        this.error = err.message || 'Error al crear el servicio';
      }
    },

    resetForm() {
      this.serviceName = '';
      this.description = '';
      this.command = '';
      this.pathCommand = '';
      this.logFile = '';
      this.type = '';
      this.selectedServer = null;
      this.selectedRegion = null;
    }
  }
};
</script>

<template>
  <div class="flex flex-col h-screen p-4">
    <!-- Formulario de registro de servicio -->
    <div class="mb-4">
      <div class="card p-4">
        <div class="font-semibold text-xl">Registrar Servicio</div>
        <form @submit.prevent="createService">
          <div class="grid grid-cols-2 gap-4">
            <div class="flex flex-col gap-2">
              <label for="serviceName">Nombre del Servicio</label>
              <InputText id="serviceName" type="text" v-model="serviceName" class="p-inputtext-sm" required />
            </div>
            <div class="flex flex-col gap-2">
              <label for="description">Descripción</label>
              <InputText id="description" type="text" v-model="description" class="p-inputtext-sm" required />
            </div>
            <div class="flex flex-col gap-2">
              <label for="command">Comando</label>
              <InputText id="command" type="text" v-model="command" class="p-inputtext-sm" required />
            </div>
            <div class="flex flex-col gap-2">
              <label for="pathCommand">Ruta del Comando</label>
              <InputText id="pathCommand" type="text" v-model="pathCommand" class="p-inputtext-sm" required />
            </div>
            <div class="flex flex-col gap-2">
              <label for="logFile">Archivo de Log</label>
              <InputText id="logFile" type="text" v-model="logFile" class="p-inputtext-sm" required />
            </div>
            <div class="flex flex-col gap-2">
              <label for="type">Tipo</label>
              <Dropdown 
                id="type" 
                v-model="type" 
                :options="typeOptions" 
                placeholder="Selecciona un Tipo"
                class="p-inputtext-sm"
                required
              />
            </div>
            <div class="flex flex-col gap-2">
              <label for="region">Selecciona Región</label>
              <Dropdown 
                id="region" 
                v-model="selectedRegion" 
                :options="regions" 
                optionLabel="nameRegion" 
                optionValue="idRegion" 
                placeholder="Selecciona una Región" 
                @change="onRegionChange" 
                class="p-inputtext-sm"
              />
            </div>
            <div class="flex flex-col gap-1">
              <label for="idAgent">Selecciona Servidor</label>
              <Dropdown 
                id="idAgent" 
                v-model="selectedServer" 
                :options="servers" 
                optionLabel="agentName" 
                optionValue="idAgent" 
                placeholder="Selecciona un Servidor" 
                class="p-inputtext-sm"
                required
              />
            </div>
          </div>
          <Button type="submit" label="Crear" class="p-button-primary mt-3" />
          <p v-if="error" class="text-red-500 mt-2">{{ error }}</p>
        </form>
      </div>
    </div>

    <!-- Tabla de Servicios -->
    <div class="card p-4">
      <div class="font-semibold text-xl">Servicios</div>
      <DataTable :value="services">
        <Column field="serviceName" header="Nombre del Servicio" />
        <Column field="description" header="Descripción" />
        <Column field="command" header="Comando" />
        <Column field="pathCommand" header="Ruta del Comando" />
        <Column field="logFile" header="Archivo de Log" />
        <Column field="type" header="Tipo" />
        <Column field="idAgent" header="Servidor Asociado" />
      </DataTable>
      <p v-if="services.length === 0">No hay servicios para mostrar.</p>
    </div>
  </div>
</template>



<style scoped>
/* Añade tus estilos aquí */
</style>
