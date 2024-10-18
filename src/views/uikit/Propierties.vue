<script>
import axios from 'axios';
import Card from 'primevue/card';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Dropdown from 'primevue/dropdown';
import RadioButton from 'primevue/radiobutton';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import ProgressSpinner from 'primevue/progressspinner';
import { ref, watch, onMounted } from 'vue';

export default {
    components: {
        Dropdown,
        DataTable,
        Column,
        RadioButton,
        Card,
        Button,
        Dialog,
        ProgressSpinner
    },
    setup() {
        const regions = ref([]);
        const serversDB = ref([]);
        const filteredServers = ref([]);
        const databases = ref([]);
        const properties = ref([]);
        const isLoading = ref(false);
        const selectedRegion = ref(null);
        const selectedServerDB = ref(null);
        const selectedDatabase = ref(null);
        const rowsPerPage = ref(5);

        const showLoading = () => isLoading.value = true;
        const hideLoading = () => isLoading.value = false;
        const breadcrumbItems = ref([
            { label: 'Home', icon: 'pi pi-home', url: '/' },
            { label: 'Database', icon: 'pi pi-database' },
            { label: 'Properties', icon: 'pi pi-cog', route: { name: 'Properties' } }
        ]);
        async function loadRegions() {
            showLoading();
            try {
                const response = await axios.get('/api/regions');
                regions.value = response.data.map((region) => ({
                    name: region.nameRegion,
                    id: region.idRegion
                }));
            } catch (error) {
                console.error('Error fetching regions:', error.message);
            } finally {
                hideLoading();
            }
        }

        async function loadServersDB() {
            showLoading();
            try {
                const response = await axios.get('/api/serversdb');
                serversDB.value = response.data.filter((server) => server.status === 1);
            } catch (error) {
                console.error('Error fetching servers:', error.message);
            } finally {
                hideLoading();
            }
        }

        function filterServersByRegion() {
            if (selectedRegion.value) {
                filteredServers.value = serversDB.value.filter(
                    (server) => server.regionId === selectedRegion.value
                );
            } else {
                filteredServers.value = [];
            }
        }

        async function loadDatabases() {
            showLoading();
            if (!selectedServerDB.value) return;
            try {
                const response = await axios.get(`/api/database/list?serverId=${selectedServerDB.value}`);
                databases.value = response.data;
            } catch (error) {
                console.error('Error fetching databases:', error.message);
            } finally {
                hideLoading();
            }
        }

        async function loadProperties() {
            showLoading();
            if (!selectedServerDB.value || !selectedDatabase.value) return;
            try {
                const response = await axios.get(
                    `/api/database/properties?serverId=${selectedServerDB.value}&dataName=${selectedDatabase.value}`
                );
                properties.value = response.data.map((property) => ({
                    property_id: property.property_id,
                    project: property.project,
                    property: property.property,
                    module: property.module,
                    value: property.value,
                    instance: property.instance,
                }));
            } catch (error) {
                console.error('Error fetching properties:', error.message);
            } finally {
                hideLoading();
            }
        }

        watch(selectedRegion, filterServersByRegion);

        onMounted(async () => {
            await loadRegions();
            await loadServersDB();
        });

        return {
            regions,
            filteredServers,
            databases,
            properties,
            selectedRegion,
            selectedServerDB,
            selectedDatabase,
            rowsPerPage,
            isLoading,
            loadDatabases,
            loadProperties,
            breadcrumbItems
        };
    },
};
</script>

<template>
    <div class="flex flex-col h-screen p-4 space-y-6">
        <div class="w-full card p-1 mb-4">
            <div class="header-container">
                <div class="title font-semibold text-xl ml-4">Find in a log file</div>
                <div class="breadcrumb-section mr-2">
                    <Breadcrumb :model="breadcrumbItems" class="breadcrumb-item" />
                </div>
            </div>
        </div>
        <!-- Selección de región y servidores -->
        <div class="flex space-x-6">
            <!-- Panel de selección de región y servidores -->
            <div class="w-1/2 card p-4 flex flex-col max-h-96 overflow-auto">
                <div class="font-semibold text-xl mb-4">Select Region</div>
                <label for="region" class="block text-sm font-medium mb-2">Region</label>
                <Dropdown id="region" v-model="selectedRegion" :options="regions" option-label="name" option-value="id"
                    placeholder="Select Region" class="w-full" filter filterPlaceholder="Search Region" />
                <h2 class="font-semibold text-lg mb-2 mt-10">Available Servers</h2>
                <div v-if="filteredServers.length === 0" class="text-sm text-gray-500 mt-2">
                    No servers found for the selected region
                </div>
                <div v-else class="flex flex-col gap-2">
                    <div v-for="server in filteredServers" :key="server.idServer" class="flex items-center">
                        <RadioButton v-model="selectedServerDB" :value="server.idServer" name="server"
                            @change="loadDatabases" />
                        <span class="text-sm ml-2">{{ server.serverName }}</span>
                        <span class="text-sm ml-2">||</span>
                        <span class="text-sm ml-2">{{ server.ipServer }}</span>
                        <span class="text-sm ml-2">||</span>
                        <span class="text-sm ml-2">{{ server.description }}</span>
                    </div>
                </div>
            </div>

            <!-- Panel de selección de base de datos -->
            <div class="w-1/2 card p-4 flex-1 max-h-96 overflow-auto">
                <h2 class="font-semibold text-lg mb-2">Select Database</h2>

                <!-- Tabla de selección de base de datos -->
                <DataTable :value="databases" class="p-datatable-sm" :paginator="true" :rowsPerPageOptions="[5, 10, 20]"
                    :rows="5">
                    <Column header="Select">
                        <template #body="{ data }">
                            <RadioButton v-model="selectedDatabase" :value="data.name" name="database" />
                        </template>
                    </Column>
                    <Column field="database_id" header="SPID" />
                    <Column field="name" header="Database Name" />
                </DataTable>

                <!-- Contenedor del botón -->
                <div class="flex justify-center mt-4">
                    <Button @click="loadProperties" :disabled="!selectedDatabase" label="View Properties"
                        class="p-button-success" style="min-width: 200px;" />
                </div>

                <!-- Mensaje cuando no hay bases de datos -->
                <div v-if="databases.length === 0" class="text-sm text-gray-500 mt-2">
                    No databases found for the selected server.
                </div>
            </div>
        </div>

        <!-- Tabla de propiedades -->
        <div class="w-full card p-4 flex flex-col gap-4">
            <h2 class="font-semibold text-lg mb-2">Properties</h2>
            <DataTable :value="properties" class="p-datatable-sm" :paginator="true" :rows="rowsPerPage"
                :rowsPerPageOptions="[5, 10, 20]">
                <Column field="property_id" header="ID property" />
                <Column field="project" header="Project" />
                <Column field="property" header="Property Name" />
                <Column field="module" header="Module" />
                <Column field="value" header="Value" />
                <Column field="instance" header="Instance" />
            </DataTable>
            <div v-if="properties.length === 0 && selectedDatabase !== null && selectedServerDB !== null"
                class="text-center mt-4 text-gray-500">
                No properties found for the selected database.
            </div>
        </div>

        <!-- Loading Modal -->
        <Dialog v-model:visible="isLoading" modal :dismissableMask="false" :showHeader="false" :closable="false"
            style="width: 20%; height: 30%; display: flex; align-items: center; justify-content: center">
            <div class="flex flex-col items-center justify-center">
                <ProgressSpinner />
                <p class="mt-4">Loading...</p>
            </div>
        </Dialog>

    </div>
</template>

<style scoped>
.radio-margin {
    margin-left: 1rem;
    /* Ajusta el margen según sea necesario */
}
.header-container {
    display: flex;
    justify-content: space-between;
    align-items: center;

}
</style>
