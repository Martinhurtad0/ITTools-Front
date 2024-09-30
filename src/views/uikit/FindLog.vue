<script>
import { ref, onMounted, watch } from 'vue';
import Dropdown from 'primevue/dropdown';
import Checkbox from 'primevue/checkbox';
import Button from 'primevue/button';
import Calendar from 'primevue/calendar';
import ProgressSpinner from 'primevue/progressspinner';
import InputText from 'primevue/inputtext';
import LogService from '@/services/LogService';
import Dialog from 'primevue/dialog';
import RadioButton from 'primevue/radiobutton'; // Asegúrate de importar RadioButton
import { regionService } from '@/services/RegionService';
import { serverService } from '@/services/AgentService';

export default {
    components: {
        Dropdown,
        Checkbox,
        Button,
        Calendar,
        ProgressSpinner,
        Dialog,
        InputText,
        RadioButton // Agregar el componente RadioButton
    },
    setup() {
        const regions = ref([]);
        const agents = ref([]);
        const selectedRegion = ref(null);
        const filteredAgents = ref([]);
        const selectedAgent = ref(null);
        const date = ref(null);
        const logs = ref([]);
        const selectedLogFiles = ref([]);
        const transactionId = ref('');
        const errorMessage = ref('');
        const isLoading = ref(false);
        const showResultsModal = ref(false); // Modal visibility
        const searchResults = ref([]); // Store search results

        async function loadLogs() {
            if (selectedAgent.value && date.value) {
                try {
                    const formattedDate = date.value.toISOString().split('T')[0].split('-').reverse().join('-');
                    const data = await LogService.filterLogsByDate(selectedAgent.value, formattedDate);
                    if (Array.isArray(data)) {
                        logs.value = data;
                    } else {
                        errorMessage.value = 'Error: Log data is not in the expected format.';
                        logs.value = [];
                    }
                } catch (error) {
                    handleError(error);
                }
            }
        }

        async function downloadSelectedLogs() {
    if (selectedLogFiles.value.length > 0) {
        console.log('Selected log files:', selectedLogFiles.value); // Verificar los archivos seleccionados
        isLoading.value = true; 
        try {
            const response = await LogService.zipLogFile(selectedAgent.value, selectedLogFiles.value);
        } catch (error) {
            errorMessage.value = 'Error downloading log file: ' + error.message;
        } finally {
            isLoading.value = false;
        }
    } else {
        errorMessage.value = 'Please select at least one log to download.';
    }
}




        async function searchLogsByTransaction() {
            if (!transactionId.value) {
                alert('Please enter a transaction ID.');
                return;
            }

            if (selectedLogFiles.value.length === 0) {
                alert('Please select at least one log file.');
                return;
            }

            isLoading.value = true;
            try {
                const data = await LogService.searchLogsInSelectedFiles(selectedAgent.value, transactionId.value, selectedLogFiles.value);


                if (Array.isArray(data)) {
                    searchResults.value = data; // Store the results
                 

                    if (searchResults.value.length > 0) {
                        showResultsModal.value = true; // Show the modal
                    } else {
                        alert('No logs found for the provided transaction ID.'); // Alert if no logs found
                    }
                } else {
                    alert('Error: Search results are not in the expected format.'); // Alert for unexpected format
                    searchResults.value = [];
                }
            } catch (error) {
                // Handle server errors
                if (error.response) {
                    // The server returned a response
                    if (error.response.status === 404) {
                        // If the error is 404, the transaction was not found
                        const errorMessage = error.response.data.message || 'No logs found for the provided transaction ID.';
                        alert(errorMessage); // Show the server's specific message
                    } else {
                        console.error('Error fetching logs:', error.message);
                        alert('An error occurred while searching for logs. Please try again.'); // Other server errors
                    }
                } else {
                    // Network error or other types of errors
                    console.error('Error fetching logs:', error.message);
                    alert('An error occurred while searching for logs. Please try again.'); // Generic message
                }
            } finally {
                isLoading.value = false; // Hide loading indicator
            }
        }

        function handleError(error) {
            if (error.message.includes('Network Error') || error.message.includes('I/O error')) {
                errorMessage.value = 'Unable to connect to the web service URL. Please check the URL and try again.';
            } else {
                errorMessage.value = 'Error: ' + error.message;
            }
        }

        async function loadRegions() {
            try {
                const data = await regionService.getAllRegions();
                regions.value = data.map((region) => ({ name: region.nameRegion, id: region.idRegion }));
            } catch (error) {
                handleError(error);
            }
        }

        async function loadAgents() {
            try {
                const data = await serverService.getAllServers();
                agents.value = data.filter((agent) => agent.status === 1);
            } catch (error) {
                handleError(error);
            }
        }

        function filterAgentsByRegion() {
            filteredAgents.value = selectedRegion.value ? agents.value.filter((agent) => agent.regionId === selectedRegion.value) : [];
        }

        onMounted(() => {
            loadRegions();
            loadAgents();
        });

        watch(selectedAgent, () =>{
            loadLogs(); // Cargar logs al seleccionar una fecha
            selectedLogFiles.value = []; // Limpiar la selección de logs
        }); 
        watch(date, () => {
            loadLogs(); // Cargar logs al seleccionar una fecha
            selectedLogFiles.value = []; // Limpiar la selección de logs
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
            selectedLogFiles,
            transactionId,
            errorMessage,
            isLoading,
            showResultsModal, // Modal visibility
            searchResults, // Store search results
            searchLogsByTransaction,
            downloadSelectedLogs
        };
    }
};
</script>

<template>
    <div class="flex flex-col h-screen p-4">
        <div class="flex gap-6">
            <!-- First Half -->
            <div class="w-full md:w-1/2 card p-4 flex flex-col gap-4 h-full">
                <div class="mb-4">
                    <div class="font-semibold text-xl mb-4">Region Details</div>
                    <label for="region" class="block text-sm font-medium mb-2">Region</label>
                    <Dropdown id="region" v-model="selectedRegion" :options="regions" option-label="name" option-value="id" placeholder="Select Region" class="w-full" filter filterPlaceholder="Search Region" />
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
                    <Calendar id="last-modified" v-model="date" class="w-full" placeholder="Select Date" />
                </div>
            </div>

            <!-- Second Half -->
            <div class="w-full md:w-1/2 card p-4 flex flex-col gap-4 h-full">
                <div class="font-semibold text-xl">Log Files</div>

                <div v-if="logs.length > 0" class="mb-4">
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
                                        <Checkbox v-model="selectedLogFiles" :value="log" name="log" />
                                        <span class="ml-2">{{ log }}</span>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div v-else class="text-sm text-gray-500">No logs available.</div>
                <div class="mb-4">
                    <label for="transaction-id" class="block text-sm font-medium mb-2">Transaction ID</label>
                    <InputText id="transaction-id" v-model="transactionId" type="text" class="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter Transaction ID" />
                </div>

                <div class="flex justify-end">
                    <Button id="create-button" @click="searchLogsByTransaction" label="Search" icon="pi pi-search" />
                </div>
            </div>
        </div>

        <div v-if="errorMessage" class="text-red-500 mt-4">{{ errorMessage }}</div>

        <!-- Modal for search results -->
        <Dialog v-model:visible="showResultsModal" header="Search Results" modal :style="{ 'max-width': '80vw', width: 'auto' }">
            <template #footer>
                <Button id="create-button" @click="downloadSelectedLogs" label="Download Logs" icon="pi pi-download" :loading="isLoading" />
                <Button label="Close" id="close-button" @click="showResultsModal = false" />
            </template>
            <div v-if="searchResults.length > 0">
                <div v-for="(result, index) in searchResults" :key="index" class="mb-6">
                    <div class="font-bold mb-4">{{ result.filename }}</div>
                    <ul>
                        <li v-for="(log, logIndex) in result.logs" :key="logIndex" class="mb-2">
                            {{ log }}
                            <!-- Aquí, log es una string directamente -->
                        </li>
                    </ul>
                </div>
            </div>
            <div v-else>
                <p>No results found.</p>
            </div>
        </Dialog>
        <!-- Modal de carga -->
        <Dialog v-model:visible="isLoading" modal :dismissableMask="false" :showHeader="false" :closable="false" style="width: 20%; height: 30%; display: flex; align-items: center; justify-content: center">
            <div class="flex flex-col items-center justify-center">
                <ProgressSpinner />
                <p class="mt-4">Searching for transaction...</p>
            </div>
        </Dialog>
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
    border-radius: 0.375rem; /* Radio de borde consistente */
    border: 1px solid #d1d5db; /* Borde consistente */
}

button {
    cursor: pointer;
}

#close-button {
    background: #614d56;
    color: white;
    border-color: #614d56;
}

#close-button:hover {
    background: white;
    color: #614d56;
    border-color: #614d56;
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
