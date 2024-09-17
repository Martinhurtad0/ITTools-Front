<script>

import axios from 'axios';
import Button from 'primevue/button';
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';
import RadioButton from 'primevue/radiobutton';
import { onMounted, ref, watch } from 'vue';
import Calendar from 'primevue/calendar'; // Importar Calendar
import { regionService } from '@/services/RegionService';
import { serverService } from '@/services/AgentService';

export default {
    components: {
        Dropdown,
        RadioButton,
        InputText,
        Button,
        Calendar // Registrar Calendar
    },
    setup() {
        const regions = ref([]);
        const agents = ref([]);
        const selectedRegion = ref(null);
        const filteredAgents = ref([]);
        const selectedAgent = ref(null);
        const selectedDate = ref(''); // Fecha seleccionada
        const logs = ref([]); // Logs que se mostrarán
        const selectedLogs = ref([]); // Logs seleccionados para descargar
        const downloadUrl = ref(''); // URL de descarga del archivo ZIP

        const date = ref(null); // Para almacenar la fecha seleccionada

        async function loadRegions() {
            try {
                const response = await axios.get('/api/regions'); // Ajusta la URL según tu backend
                regions.value = response.data.map((region) => ({ name: region.nameRegion, id: region.idRegion }));
            } catch (error) {
                console.error('Error fetching regions:', error.message);
            }
        }

        async function loadAgents() {
            try {
                const response = await axios.get('/api/agents'); // Ajusta la URL según tu backend
                agents.value = response.data.filter((agent) => agent.status === 1);
            } catch (error) {
                console.error('Error fetching agents:', error.message);
            }
        }

        function filterAgentsByRegion() {
            if (selectedRegion.value) {
                filteredAgents.value = agents.value.filter((agent) => agent.regionId == selectedRegion.value);
            } else {
                filteredAgents.value = [];
            }
        }

        async function fetchLogs() {
            if (!selectedAgent.value || !selectedDate.value) {
                console.error('Please select an agent and a date.');
                return;
            }

            try {
                const token = 'your-token-here'; // Obtén tu token JWT aquí
                const response = await axios.get(`/logs/${selectedAgent.value}`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                logs.value = response.data; // Asigna los logs obtenidos a la variable logs
            } catch (error) {
                console.error('Error fetching logs:', error.message);
            }
        }

        async function downloadLogs() {
            if (selectedLogs.value.length === 0) {
                console.error('Please select at least one log.');
                return;
            }

            try {
                const token = 'your-token-here'; // Asegúrate de proporcionar el token correcto
                const response = await axios.get(`/logs/download`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    },
                    params: {
                        logFileNames: selectedLogs.value
                    },
                    responseType: 'blob' // Indica que la respuesta será un archivo
                });

                // Crear un enlace de descarga
                const url = window.URL.createObjectURL(new Blob([response.data]));
                downloadUrl.value = url;
            } catch (error) {
                console.error('Error downloading logs:', error.message);
            }
        }

        onMounted(async () => {
            await loadRegions();
            await loadAgents();
        });

        watch(selectedRegion, filterAgentsByRegion);

        return {
            regions,
            agents,
            selectedRegion,
            filteredAgents,
            selectedAgent,
            selectedDate,
            logs,
            selectedLogs,
            downloadUrl,
            fetchLogs,
            downloadLogs, // Asegúrate de que este nombre coincida con el nombre usado en el template
            date // Añadir 'date' a la lista de variables reactivas
        };
    }
};
</script>

<template>
    <div class="flex flex-col h-screen p-4">
        <div class="flex gap-6">
            <!-- Div para la primera mitad -->
            <div class="w-full md:w-1/2 card p-4 flex flex-col gap-4 h-full">
                <div class="mb-6">
                    <div class="font-semibold text-xl mb-4">Region Details</div>
                    <label for="region" class="block text-sm font-medium mb-2">Region</label>
                    <Dropdown 
                        id="region" 
                        v-model="selectedRegion" 
                        :options="regions" 
                        option-label="name" 
                        option-value="id" 
                        placeholder="Select Region" 
                        class="w-full" 
                        filter 
                        filterPlaceholder="Search Region" 
                    />
                </div>

                <div class="mb-6">
                    <label for="last-modified" class="block text-sm font-medium mb-2">Last Modified</label>
                    <Calendar
                        id="last-modified"
                        v-model="date"
                        class="w-full"
                        placeholder="Select Date"
                    />
                </div>

                <div class="mb-6">
                    <label class="block text-sm font-medium mb-3">Agents</label>
                    <div class="flex flex-col gap-2">
                        <div v-for="agent in filteredAgents" :key="agent.idAgent" class="flex items-center">
                            <div class="flex items-center gap-2 radio-margin">
                                <RadioButton v-model="selectedAgent" :value="agent.idAgent" name="agent" />
                                <span class="text-sm">{{ agent.agentName }}</span>
                                <span class="text-sm">||</span>
                                <span class="text-sm">{{ agent.ipagent }}</span>
                            </div>
                        </div>
                        <div v-if="filteredAgents.length === 0" class="text-sm text-gray-500 mt-2">No agents found for the selected region</div>
                    </div>
                </div>
            </div>

            <!-- Div para la segunda mitad -->
            <div class="w-full md:w-1/2 card p-4 flex flex-col gap-4 h-full">
                <div class="font-semibold text-xl mb-4">Log Files</div>
                <div>
                    <Button 
                        label="Fetch Logs" 
                        class="w-full p-3 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                        @click="fetchLogs" 
                    />
                </div>
                
                <!-- Lista de logs -->
                <div v-if="logs.length > 0" class="mt-4 overflow-y-auto" style="max-height: 300px;"> <!-- Ajusta la altura máxima según sea necesario -->
                    <h3 class="text-lg font-semibold mb-2">Logs:</h3>
                    <ul class="list-disc ml-5">
                        <li v-for="log in logs" :key="log">
                            <RadioButton type="check" :value="log" v-model="selectedLogs" />
                            {{ log }}
                        </li>
                    </ul>
                </div>
                <div v-else class="text-sm text-gray-500 mt-2">No logs available.</div>

                <!-- Botón de descarga de logs en formato ZIP -->
                <div v-if="selectedLogs.length > 0" class="mt-4">
                    <Button 
                        label="Download Selected Logs (ZIP)" 
                        class="w-full p-3 bg-green-500 text-white rounded-lg shadow-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                        @click="downloadLogs" 
                    />
                </div>
                <!-- Enlace de descarga del ZIP -->
                <div v-if="downloadUrl" class="mt-4">
                    <a :href="downloadUrl" download="logs.zip" class="text-blue-500 underline">Click here to download the logs as ZIP</a>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Asegurar que todos los campos de entrada sean del mismo tamaño */
.p-calendar {
    width: 100%; /* Asegura que el calendario ocupe el 100% del ancho del contenedor */
    border-radius: 0.375rem; /* Radio de borde consistente */
    border: 1px solid #d1d5db; /* Borde consistente */
}

/* Margen adicional para radio buttons */
.radio-margin {
    margin-left: 1rem; /* Ajusta el margen según sea necesario */
}

#create-button {
  background: #64c4ac;
  color: white;
  border-color: #64c4ac;
}

#create-button:hover {
  background: white;
  color: #64c4ac;
  border-color: #64c4ac;
}
</style>
