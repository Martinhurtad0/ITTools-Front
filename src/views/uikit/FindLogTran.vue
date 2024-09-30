<script>
import { ref, onMounted, watch } from 'vue';
import Dropdown from 'primevue/dropdown';
import Checkbox from 'primevue/checkbox';
import InputText from 'primevue/inputtext';
import Calendar from 'primevue/calendar';
import Button from 'primevue/button';
import LogService from '@/services/LogService';
import { regionService } from '@/services/RegionService';
import { serverService } from '@/services/AgentService';
import Dialog from 'primevue/dialog';
import ProgressSpinner from 'primevue/progressspinner';

export default {
    components: {
        Dropdown,
        Checkbox,
        InputText,
        Calendar,
        Button,
        Dialog,
        ProgressSpinner
    },
    setup() {
        const regions = ref([]);
        const agents = ref([]);
        const selectedRegion = ref(null);
        const filteredAgents = ref([]);
        const selectedAgents = ref([]);
        const transactionId = ref('');
        const transactionDate = ref('');
        const results = ref([]);
        const isDialogVisible = ref(false);
        const isLoading = ref(false);

        async function loadRegions() {
            try {
                const data = await regionService.getAllRegions();
                regions.value = data.map((region) => ({ name: region.nameRegion, id: region.idRegion }));
            } catch (error) {
                console.error('Error fetching regions:', error.message);
            }
        }

        async function loadAgents() {
            try {
                const data = await serverService.getAllServers();
                agents.value = data.filter((agent) => agent.status === 1);
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

        async function searchTransaction() {
            if (!transactionId.value) {
                alert('Please enter a transaction ID.');
                return;
            }

            if (!transactionDate.value) {
                alert('Please select a date.');
                return;
            }

            const year = transactionDate.value.getFullYear();
            const month = String(transactionDate.value.getMonth() + 1).padStart(2, '0');
            const day = String(transactionDate.value.getDate()).padStart(2, '0');

            const formattedDate = `${day}-${month}-${year}`;

            results.value = [];

            if (selectedAgents.value.length === 0) {
                alert('Please select at least one agent.');
                return;
            }

            isLoading.value = true;

            try {
                for (const agentId of selectedAgents.value) {
                    const logsData = await LogService.getLogsByTransaction(agentId, transactionId.value, formattedDate);
                    if (Array.isArray(logsData) && logsData.length > 0) {
                        logsData.forEach((log) => {
                            results.value.push({
                                filename: log.filename,
                                logs: log.logs.map((logMessage) => ({ message: logMessage }))
                            });
                        });
                    }
                }

                if (results.value.length > 0) {
                    isDialogVisible.value = true;
                } else {
                    alert('No logs found for the provided transaction ID.');
                }
            } catch (error) {
                console.error('Error fetching transaction logs:', error.message);
                alert('An error occurred while searching for logs. Please check the transaction ID.');
            } finally {
                isLoading.value = false;
            }
        }

        async function downloadLogs() {
            if (selectedAgents.value.length === 0) {
                alert('Please select at least one agent to download logs.');
                return;
            }

            // Extract filenames from results
            const filenames = results.value.map(result => result.filename);

            try {
                await LogService.zipLogFile(selectedAgents.value[0], filenames); // Call with the first selected agent
            } catch (error) {
                console.error('Error downloading logs:', error.message);
                alert('An error occurred while downloading the logs.');
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
            downloadLogs
        };
    }
};
</script>

<template>
    <div class="flex flex-col h-screen p-4">
        <div class="flex gap-6">
            <div class="w-full md:w-1/2 card p-4 flex flex-col gap-4 h-full">
                <div class="mb-6">
                    <div class="font-semibold text-xl mb-4">Region Details</div>
                    <label for="region" class="block text-sm font-medium mb-2">Region</label>
                    <Dropdown id="region" v-model="selectedRegion" :options="regions" option-label="name" option-value="id" placeholder="Select Region" class="w-full" filter filterPlaceholder="Search Region" />
                </div>

                <div class="mb-6 gap-4">
                    <label class="block text-sm font-medium mb-3">Agents</label>
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
                <div class="font-semibold text-xl mb-4">Transaction Details</div>

                <div class="mb-4">
                    <label for="transaction-date" class="block text-sm font-medium mb-2">Transaction date</label>
                    <Calendar id="transaction-date" v-model="transactionDate" dateFormat="mm/dd/yy" placeholder="Select a date" class="w-full" />
                </div>

                <div class="mb-4">
                    <label for="transaction-id" class="block text-sm font-medium mb-2">Transaction ID</label>
                    <InputText id="transaction-id" v-model="transactionId" type="text" class="w-full border rounded-lg p-3 focus:outline-none" placeholder="Enter Transaction ID" />
                </div>

                <div class="flex justify-end mt-4">
                    <Button id="create-button" label="Search" icon="pi pi-search" @click="searchTransaction" />
                </div>
            </div>
        </div>

        <Dialog v-model:visible="isDialogVisible" header="Transaction Logs" modal :style="{ 'max-width': '80vw', width: 'auto' }">
            <template #footer>
                <Button label="Download Logs" icon="pi pi-download"  id="create-button" @click="downloadLogs" />
                <Button label="Close" id="close-button" @click="isDialogVisible = false" />
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
</style>
