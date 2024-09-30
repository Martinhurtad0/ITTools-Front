<script>
import { ref, onMounted, watch } from 'vue';
import Dropdown from 'primevue/dropdown';
import RadioButton from 'primevue/radiobutton';
import Button from 'primevue/button';
import Calendar from 'primevue/calendar';
import ProgressSpinner from 'primevue/progressspinner';
import LogService from '@/services/LogService';
import Dialog from 'primevue/dialog';
import { regionService } from '@/services/RegionService';
import { serverService } from '@/services/AgentService';
import Checkbox from 'primevue/checkbox'; // Asegúrate de importar Checkbox

export default {
    components: {
        Dropdown,
        RadioButton,
        Button,
        Calendar,
        ProgressSpinner,
        Dialog,
        Checkbox // Registra el componente Checkbox
    },
    setup() {
        const regions = ref([]);
        const agents = ref([]);
        const selectedRegion = ref(null);
        const filteredAgents = ref([]);
        const selectedAgent = ref(null);
        const date = ref(null); // Esta es la fecha seleccionada
        const logs = ref([]);
        const selectedLogs = ref([]); // Cambia a un array para seleccionar múltiples logs
        const errorMessage = ref('');
        const isLoading = ref(false); // Variable para el estado de carga

        async function loadLogs() {
            if (selectedAgent.value && date.value) {
                try {
                    const formattedDate = date.value.toISOString().split('T')[0].split('-').reverse().join('-'); // Formato DD-MM-YYYY
                    const data = await LogService.filterLogsByDate(selectedAgent.value, formattedDate);
                    if (Array.isArray(data)) {
                        logs.value = data; // Guardar los nombres de archivo directamente
                    } else {
                        errorMessage.value = 'Error: Log data is not in the expected format.';
                        logs.value = [];
                    }
                } catch (error) {
                    if (error.message.includes('Network Error') || error.message.includes('I/O error')) {
                        errorMessage.value = 'Unable to connect to the web service URL. Please check the URL and try again.';
                    } else {
                        errorMessage.value = 'Error fetching logs: ' + error.message;
                    }
                    logs.value = [];
                }
            }
        }

        async function loadRegions() {
            try {
                const data = await regionService.getAllRegions();
                regions.value = data.map((region) => ({ name: region.nameRegion, id: region.idRegion }));
            } catch (error) {
                errorMessage.value = 'Error fetching regions: ' + error.message;
            }
        }

        async function loadAgents() {
            try {
                const data = await serverService.getAllServers();
                agents.value = data.filter((agent) => agent.status === 1);
            } catch (error) {
                errorMessage.value = 'Error fetching agents: ' + error.message;
            }
        }

        function filterAgentsByRegion() {
            filteredAgents.value = selectedRegion.value ? agents.value.filter((agent) => agent.regionId === selectedRegion.value) : [];
        }

        async function downloadSelectedLogs() {
            if (selectedLogs.value.length > 0) { // Check if there are any selected logs
                isLoading.value = true; // Open the loading modal
                try {
                    // Mapea los nombres de archivo para pasar al servicio
                    const response = await LogService.zipLogFile(selectedAgent.value, selectedLogs.value);
                    console.log('Log downloaded successfully');
                } catch (error) {
                    errorMessage.value = 'Error downloading log file: ' + error.message;
                } finally {
                    isLoading.value = false; // Close the loading modal
                }
            } else {
                errorMessage.value = 'Please select at least one log to download.';
            }
        }

        onMounted(() => {
            loadRegions();
            loadAgents();
        });

        watch(selectedAgent, () =>{
            loadLogs(); // Cargar logs al seleccionar una fecha
            selectedLogs.value = []; // Limpiar la selección de logs
        }); 
        watch(date, () => {
            loadLogs(); // Cargar logs al seleccionar una fecha
            selectedLogs.value = []; // Limpiar la selección de logs
        });
        watch(selectedRegion, filterAgentsByRegion);

        return {
            regions,
            agents,
            selectedRegion,
            filteredAgents,
            selectedAgent,
            date,
            logs,
            selectedLogs,
            downloadSelectedLogs,
            errorMessage,
            isLoading
        };
    }
};
</script>

<template>
    <div class="flex flex-col h-screen p-4">
        <div class="flex gap-6">
            <!-- Div para la primera mitad -->
            <div class="w-full md:w-1/2 card p-4 flex flex-col gap-4 h-full">
                <div class="mb-4">
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

                <div class="mb-4">
                    <label class="block text-sm font-medium mb-3">Agents</label>
                    <div class="flex flex-col gap-2 ml-2">
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

                <div class="mb-4">
                    <label for="last-modified" class="block text-sm font-medium mb-2">Last Modified</label>
                    <Calendar 
                        id="last-modified" 
                        v-model="date" 
                        class="w-full" 
                        placeholder="Select Date" 
                    />
                </div>
            </div>

            <!-- Div para la segunda mitad -->
            <div class="w-full md:w-1/2 card p-4 flex flex-col gap-4 h-full">
                <div class="font-semibold text-xl">Log Files</div>

                <div v-if="logs.length > 0">
                    <table class="w-full table-auto border-collapse border border-gray-200">
                        <thead>
                            <tr class="text-white" style="background-color: #614d56">
                                <th class="text-left p-2">Log File</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="log in logs" :key="log" class="border-b border-gray-200">
                                <td class="p-2">
                                    <div class="flex items-center">
                                        <Checkbox v-model="selectedLogs" :value="log" name="log" />
                                        <span class="ml-2">{{ log }}</span>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <div class="flex justify-end mt-4">
                        <Button 
                            icon="pi pi-download" 
                            class="p-button-text" 
                            @click="downloadSelectedLogs" 
                            label="Download" 
                        />
                    </div>
                </div>
                <div v-else class="text-sm text-gray-500">No logs available.</div>
            </div>
        </div>

        <!-- Modal de carga -->
        <Dialog 
            v-model:visible="isLoading" 
            modal 
            :dismissableMask="false" 
            :showHeader="false" 
            :closable="false" 
            style="width: 20%; height: 30%; display: flex; align-items: center; justify-content: center"
        >
            <div class="flex flex-col items-center justify-center">
                <ProgressSpinner />
                <p class="mt-4">Downloading logs...</p>
            </div>
        </Dialog>

        <div v-if="errorMessage" class="text-red-500 mt-4">{{ errorMessage }}</div>
    </div>
</template>


<style scoped>
/* Estilo para el encabezado de la tabla */
.header-row {
    background-color: #614d56;
}

/* Estilo general para la tabla */
table {
    width: 100%;
    border-collapse: collapse;
}

/* Estilo para los encabezados y celdas */
th,
td {
    padding: 0.5rem;
    border-bottom: 1px solid #ddd;
}

th {
    text-align: left;
    color: white; /* Asegura que el texto del encabezado sea blanco */
}

td {
    text-align: left;
}

/* Margen adicional para radio buttons */
.radio-margin {
    margin-left: 1rem; /* Ajusta el margen según sea necesario */
}

.p-calendar {
    width: 100%; /* Asegura que el calendario ocupe el 100% del ancho del contenedor */
    border-radius: 0.25rem; /* Ajusta el borde del calendario */
}
</style>
