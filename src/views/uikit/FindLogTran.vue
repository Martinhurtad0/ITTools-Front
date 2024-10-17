<script>
import { ref, onMounted, watch } from 'vue';
import Dropdown from 'primevue/dropdown';
import Checkbox from 'primevue/checkbox';
import InputText from 'primevue/inputtext';
import Calendar from 'primevue/calendar';
import Button from 'primevue/button';
import LogService from '@/services/LogService';
import Breadcrumb from 'primevue/breadcrumb';
import { regionService } from '@/services/RegionService';
import { serverService } from '@/services/AgentService';
import Dialog from 'primevue/dialog';
import ProgressSpinner from 'primevue/progressspinner';
import { useToast } from 'primevue/usetoast'; // Importar useToast

export default {
    components: {
        Dropdown,
        Checkbox,
        InputText,
        Calendar,
        Button,
        Dialog,
        ProgressSpinner,
        Breadcrumb
    },
    setup() {
        const toast = useToast(); // Inicializar toast
        const breadcrumbItems = ref([
            { label: 'Home', icon: 'pi pi-home', url: '/' },
            { label: 'Logs', icon: 'pi pi-folder' },
            { label: 'Multi find log', icon: 'pi pi-search', route: { name: 'FindLogTran' } }
        ]);
        const regions = ref([]);
        const agents = ref([]);
        const selectedRegion = ref(null);
        const filteredAgents = ref([]);
        const selectedAgents = ref([]);
        const transactionId = ref('');
        const transactionDate = ref('');
        const results = ref([]);
        const isDialogVisible = ref(false);
        const isLoading = ref(false); // Estado de carga

        // Funciones de éxito y error
        const showSuccess = (detail) => {
            toast.add({ severity: 'success', summary: 'Success', detail, life: 3000 });
        };

        const showError = (detail) => {
            toast.add({ severity: 'error', summary: 'Error', detail, life: 3000 });
        };

        async function loadRegions() {
            try {
                const data = await regionService.getAllRegions();
                regions.value = data.map((region) => ({ name: region.nameRegion, id: region.idRegion }));
            } catch (error) {
                showError('Error fetching regions');
            }
        }

        async function loadAgents() {
            try {
                const data = await serverService.getAllServers();
                agents.value = data.filter((agent) => agent.status === 1);
            } catch (error) {
                showError('Error fetching agents');
            }
        }

        function filterAgentsByRegion() {
            if (selectedRegion.value) {
                filteredAgents.value = agents.value.filter((agent) => agent.regionId == selectedRegion.value);
            } else {
                filteredAgents.value = [];
            }
        }

        async function searchTransaction() {
            if (!transactionId.value) {
                showError('Please enter a transaction ID.');
                return;
            }

            if (!transactionDate.value) {
                showError('Please select a date.');
                return;
            }

            const year = transactionDate.value.getFullYear();
            const month = String(transactionDate.value.getMonth() + 1).padStart(2, '0');
            const day = String(transactionDate.value.getDate()).padStart(2, '0');

            const formattedDate = `${day}-${month}-${year}`;

            results.value = [];

            if (selectedAgents.value.length === 0) {
                showError('Please select at least one agent.');
                return;
            }

            if (!selectedRegion.value) { // Verificar que haya una región seleccionada
                showError('Please select a region.');
                return;
            }

            isLoading.value = true; // Iniciar carga

            try {
                for (const agentId of selectedAgents.value) {
                    const logsData = await LogService.getLogsByTransaction(agentId, transactionId.value, formattedDate, selectedRegion.value); // Pasar la región
                    if (Array.isArray(logsData) && logsData.length > 0) {
                        logsData.forEach((log) => {
                            results.value.push({
                                filename: log.filename,
                                logs: log.logs.map((logMessage) => ({ message: logMessage })),
                                region: selectedRegion.value // Añadir la región a los resultados
                            });
                        });
                    }
                }

                if (results.value.length > 0) {
                    isDialogVisible.value = true;
                    showSuccess('Logs found successfully');
                } else {
                    showError('No logs found for the provided transaction ID.');
                }
            } catch (error) {
                showError('An error occurred while searching for logs. Please check the transaction ID.');
            } finally {
                isLoading.value = false; // Finalizar carga
            }
        }

        async function downloadLogs() {
            if (selectedAgents.value.length === 0) {
                showError('Please select at least one agent to download logs.');
                return;
            }

            const filenames = results.value.map((result) => result.filename);

            isLoading.value = true; // Iniciar carga

            try {
                await LogService.zipLogFile(selectedAgents.value[0], filenames, selectedRegion.value);
                showSuccess('Logs downloaded successfully');
            } catch (error) {
                showError('An error occurred while downloading the logs.');
            } finally {
                isLoading.value = false; // Finalizar carga
            }
        }

        onMounted(() => {
            loadRegions();
            loadAgents();
        });

        watch(selectedRegion, filterAgentsByRegion);

        return {
            regions,
            agents,
            selectedRegion,
            filteredAgents,
            selectedAgents,
            transactionId,
            transactionDate,
            results,
            isDialogVisible,
            isLoading,
            searchTransaction,
            downloadLogs,
            breadcrumbItems,
            showSuccess,
            showError
        };
    }
};
</script>


<template>
    <div class="flex flex-col h-screen p-4">
        <div class="w-full card p-1 mb-4">
            <div class="header-container">
                <div class="title font-semibold text-xl ml-4">Multi find logs</div>
                <div class="breadcrumb-section mr-2">
                    <Breadcrumb :model="breadcrumbItems" class="breadcrumb-item" />
                </div>
            </div>
        </div>
        <div class="flex gap-6">
            <div class="w-full md:w-1/2 card p-4 flex flex-col gap-4 h-full">
                <div class="mb-2">
                    <div class="font-semibold text-xl mb-4">Region details</div>
                    <label for="region" class="block text-sm font-medium mb-2">Region</label>
                    <Dropdown id="region" v-model="selectedRegion" :options="regions" option-label="name" option-value="id" placeholder="Select region" class="w-full" filter filterPlaceholder="Search Region" />
                </div>

                <div class="mb-2 gap-4">
                    <label class="block text-sm font-medium mb-2">Agents</label>
                    <div class="flex flex-col gap-2 ml-2">
                        <div v-for="agent in filteredAgents" :key="agent.idAgent" class="flex items-center">
                            <div class="flex items-center gap-2 checkbox-margin">
                                <Checkbox v-model="selectedAgents" :value="agent.idAgent" />
                                <span class="text-sm">{{ agent.agentName }}</span>
                                <span class="text-sm">||</span>
                                <span class="text-sm">{{ agent.ipagent }}</span>
                            </div>
                        </div>
                        <div v-if="filteredAgents.length === 0" class="text-sm text-gray-500 mt-2">No agents found for the selected region</div>
                    </div>
                </div>
            </div>

            <div class="w-full md:w-1/2 card p-4 flex flex-col gap-4 h-full">
                <div class="font-semibold text-xl mb-2">Transaction details</div>

                <div class="mb-2">
                    <label for="transaction-date" class="block text-sm font-medium mb-2">Transaction date</label>
                    <Calendar id="transaction-date" v-model="transactionDate" dateFormat="mm/dd/yy" placeholder="Select date" class="w-full" />
                </div>

                <div class="mb-2">
                    <label for="transaction-id" class="block text-sm font-medium mb-2">Transaction ID</label>
                    <InputText id="transaction-id" v-model="transactionId" type="text" class="w-full border rounded-lg p-3 focus:outline-none" placeholder="Enter transaction ID" />
                </div>

                <div class="flex justify-end mt-2">
                    <Button id="create-button" label="Search" icon="pi pi-search" @click="searchTransaction" />
                </div>
            </div>
        </div>

        <Dialog v-model:visible="isDialogVisible" header="Transaction logs" modal :style="{ 'max-width': '80vw', width: 'auto' }">
    <template #footer>
        <div class="flex justify-between items-center w-full">
            <!-- Mensaje con icono de información -->
            <div class="flex items-center">
                <i class="pi pi-info-circle mr-2"></i>
                <span>For more information, please download the logs.</span>
            </div>
            
            <!-- Botones alineados a la derecha -->
            <div class="flex">
                <Button label="Download logs" icon="pi pi-download" id="create-button" @click="downloadLogs" class="mr-2" />
                <Button label="Close" id="close-button" @click="isDialogVisible = false" />
            </div>
        </div>
    </template>

    <div v-if="results.length > 0">
        <div v-for="(result, index) in results" :key="index" class="mb-6">
            <div class="font-bold mb-4">{{ result.filename }}</div>
            <ul>
                <li v-for="(log, logIndex) in result.logs" :key="logIndex" class="mb-2">
                    {{ log.message }}
                </li>
            </ul>
        </div>
    </div>
    
    <div v-else>
        <p>No logs found for the selected transaction ID.</p>
    </div>
</Dialog>


        <!-- Loading Modal -->
        <Dialog v-model:visible="isLoading" modal :dismissableMask="false" :showHeader="false" :closable="false" style="width: 20%; height: 30%; display: flex; align-items: center; justify-content: center">
            <div class="flex flex-col items-center justify-center">
                <ProgressSpinner />
                <p class="mt-4">Searching for transaction...</p>
            </div>
        </Dialog>

        <div v-if="errorMessage" class="text-red-500 mt-4">{{ errorMessage }}</div>
        <div v-else class=" mt-4 ml-4">
            <div class="flex items-center">
                        <i class="pi pi-info-circle mr-2"></i>
                        <span>In this module you can search for a transaction on several agents, this may take some time..</span>
                    </div>
        </div>
    </div>
</template>

<style scoped>
/* Margen adicional para radio buttons */
.radio-margin {
    margin-left: 1rem;
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

/* Margen adicional para checkboxes */
.checkbox-margin {
    margin-left: 0.5rem;
}

.header-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
}
</style>
