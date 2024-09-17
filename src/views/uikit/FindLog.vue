<script>
import { ref, onMounted, watch } from 'vue';
import Dropdown from 'primevue/dropdown';
import RadioButton from 'primevue/radiobutton'; // Importar RadioButton
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import Calendar from 'primevue/calendar';
import { regionService } from '@/services/RegionService';
import { serverService } from '@/services/AgentService';

export default {
    components: {
        Dropdown,
        RadioButton, // Registrar RadioButton
        InputText,
        Button,
        Calendar
    },
    setup() {
        const regions = ref([]);
        const agents = ref([]);
        const selectedRegion = ref(null);
        const filteredAgents = ref([]);
        const selectedAgent = ref(null); // Para almacenar el agente seleccionado
        const transactionDate = ref(null); // Para almacenar la fecha seleccionada

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
                filteredAgents.value = agents.value.filter((agent) => {
                    return agent.regionId == selectedRegion.value;
                });
            } else {
                filteredAgents.value = [];
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
            transactionDate
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
                    <Calendar id="last-modified" v-model="transactionDate" class="w-full" placeholder="Select Date" />
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

                <div class="font-semibold text-xl mb-4">Transaction</div>

                <div class="mb-6">
                    <label for="transaction-id" class="block text-sm font-medium mb-2">Transaction ID</label>
                    <InputText 
                        id="transaction-id" 
                        type="text" 
                        class="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                        placeholder="Enter Transaction ID" 
                    />
                </div>

                <div class="flex justify-end mt-4">
                    <Button id="create-button" type="submit" label="Search" icon="pi pi-search" />
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Asegurar que el input de fecha tenga el mismo tamaño que el InputText */
.date-input {
    height: calc(1.5em + 1rem + 2px); /* Altura del input ajustada para que coincida con InputText */
    padding: 0.75rem; /* Relleno consistente con InputText */
}

/* Asegurar que todos los campos de entrada sean del mismo tamaño */
input[type="date"], .p-inputtext {
    width: 100%; /* Asegura que el input ocupe el 100% del ancho del contenedor */
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
