<script>
import { serverService } from '@/services/AgentService';
import { regionService } from '@/services/RegionService';
import Button from 'primevue/button';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';

export default {
    components: {
        InputText,
        Button,
        Dropdown,
        DataTable,
        Column,
        Dialog
    },
    data() {
        return {
            servers: [],
            filteredServers: [], // Almacena los servidores filtrados
            regions: [],
            isEditDialogVisible: false,
            displayConfirmation: false,
            isCreateServerDialogVisible: false,
            isActivating: false,
            selectedServer: null,
            searchQuery: '', // Para la búsqueda global
            showActiveServers: false, // Para filtrar solo activos
            isShowDialogVisible: false,
            displayDeleteConfirmation: false,
            showAll: false,
            server: {
                agentName: '',
                ipAgent: '',
                webServiceUrl: '',
                pathArchive: '',
                regionId: null // Para almacenar el ID de la región seleccionada
            },
            newServer: {
                agentName: '',
                ipAgent: '',
                webServiceUrl: '',
                pathArchive: '',
                regionId: null
            },
            editServerData: {
                idAgent: null,
                agentName: '',
                ipAgent: '',
                webServiceUrl: '',
                pathArchive: '',
                regionId: null
            },
            detailServerData: {
                agentName: '',
                ipAgent: '',
                webServiceUrl: '',
                pathArchive: '',
                regionId: null
            },
            error: ''
        };
    },
    async created() {
        await this.loadRegions();
        await this.fetchServers();
    },
    watch: {
        searchQuery() {
            this.applyFilters(); // Aplica búsqueda global cuando cambia el input de búsqueda
        },
        showActiveServers() {
            this.applyFilters(); // Aplica el filtro de activos
        },
        servers() {
            this.applyFilters(); // Aplica los filtros cuando cambia la lista de servidores
        }
    },
    methods: {
        async fetchServers() {
            try {
                this.servers = await serverService.getAllServers();
                this.filteredServers = [...this.servers]; // Inicializa los servidores filtrados
            } catch (error) {
                console.error('Error fetching servers:', error);
            }
        },
        applyFilters() {
            this.filteredServers = this.servers.filter((server) => {
                const globalFilter = this.searchQuery.toLowerCase();
                const matchesSearch = !globalFilter || server.agentName.toLowerCase().includes(globalFilter) || server.ipAgent.toLowerCase().includes(globalFilter) || server.webServiceUrl.toLowerCase().includes(globalFilter);
                const matchesActiveFilter = this.showAll || server.status === 1;
                return matchesSearch && matchesActiveFilter;
            });
        },

        toggleFilter() {
            this.showAll = !this.showAll; // Alterna el estado de showAll
            this.applyFilters(); // Aplica el filtro actualizado
        },

        getRegionNameById(regionId) {
            const region = this.regions.find((region) => region.idRegion === regionId);
            return region ? region.nameRegion : 'Unknown Region';
        },

        editServer(server) {
            this.editServerData = { ...server };
            this.isEditDialogVisible = true;
        },
        showServerDetails(server) {
            this.detailServerData = { ...server };
            this.isShowDialogVisible = true;
        },
        confirmDeleteServer(serverId) {
            this.serverToDelete = serverId;
            this.displayDeleteConfirmation = true;
        },
        async updateServer() {
            try {
                await serverService.updateServer(this.editServerData);
                await this.fetchServers();
                this.isEditDialogVisible = false;
            } catch (error) {
                console.error('Error updating server:', error);
                this.error = 'Update failed';
            }
        },
        async deleteAgent() {
            try {
                // Confirmación antes de eliminar
                    await serverService.deleteAgent(this.serverToDelete);
                    alert('Agent deleted successfully');
                    await this.fetchServers(); // Recarga la lista de servidores después de la eliminación    
                    this.displayDeleteConfirmation = false;
                    this.serverToDelete = null;
                  } catch (error) {
                console.error('Error deleting agent:', error);
                alert('Error deleting agent: ' + error.message);
            }
        },
        async changeServerStatus() {
            try {
                await this.toggleStatus(this.selectedServer);
                this.closeConfirmation();
            } catch (error) {
                console.error('Error changing server status:', error.message);
            }
        },
        openConfirmation(server, isActivating) {
            this.selectedServer = server;
            this.isActivating = isActivating;
            this.displayConfirmation = true;
        },
        closeDeleteConfirmation() {
            this.displayDeleteConfirmation = false;
            this.serverToDelete = null;
        },
        openCreateServerDialog() {
            this.isCreateServerDialogVisible = true;
        },
        async toggleStatus(server) {
            const updatedStatus = server.status === 1 ? 0 : 1;
            try {
                await serverService.updateServerStatus(server.idAgent);
                server.status = updatedStatus;
                await this.fetchServers();
            } catch (error) {
                console.error('Error updating server status:', error.message);
            }
        },

        closeConfirmation() {
            this.displayConfirmation = false;
        },

        async loadRegions() {
            try {
                const allRegions = await regionService.getAllRegions();
                this.regions = allRegions.filter((region) => region.status === 1);
            } catch (error) {
                console.error('Error fetching regions:', error);
            }
        },
        async createServer() {
            if (!this.validateIP(this.newServer.ipAgent)) {
                this.error = 'Invalid IP address';
                return;
            }
            try {
                const serverData = {
                    agentName: this.newServer.agentName,
                    ipAgent: this.newServer.ipAgent,
                    webServiceUrl: this.newServer.webServiceUrl,
                    pathArchive: this.newServer.pathArchive,
                    regionId: this.newServer.regionId ? Number(this.newServer.regionId) : null
                };
                await serverService.createServer(serverData);
                alert('Server created successfully');
                this.resetNewServerForm();
                await this.fetchServers();
                this.closeCreateServerDialog();
            } catch (err) {
                console.error('Error creating server:', err.message);
                this.error = err.message || 'Creation failed';
            }
        },
        resetNewServerForm() {
            this.newServer = {
                agentName: '',
                ipAgent: '',
                webServiceUrl: '',
                pathArchive: '',
                regionId: null
            };
        },
        closeCreateServerDialog() {
            this.isCreateServerDialogVisible = false;
        },
        validateIP(ip) {
            const ipAgent = /^(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)$/;
            return ipAgent.test(ip);
        }
    }
};
</script>

<template>
    <div class="flex flex-col h-screen p-4">
        <div class="flex-2 overflow-auto">
            <div class="card p-4 flex flex-col gap-4 h-full">
                <div class="font-semibold text-xl">Agents</div>
                <div class="flex justify-between items-center mb-2">
                    <!-- Agrupar los dos botones en un div con clase flex -->
                    <div class="flex gap-2">
                        <Button label="Create Agents" icon="pi pi-plus" @click="openCreateServerDialog" class="p-button-success" />
                        <Button label="Filter All" icon="pi pi-filter" class="p-button-secondary" @click="toggleFilter" />
                    </div>
                    <!-- Input de búsqueda al otro lado -->
                    <InputText v-model="searchQuery" placeholder="Global search..." class="p-inputtext p-component" />
                </div>
                <div class="overflow-x-auto">
                    <DataTable :value="filteredServers" class="p-datatable-sm" :paginator="true" :rows="5" :rowsPerPageOptions="[5, 10, 20]" :totalRecords="servers.length">
                        <Column field="agentName" header="Server Name" />
                        <Column field="ipAgent" header="IP Agent" />
                        <Column field="webServiceUrl" header="WebService URL" />
                        <Column field="pathArchive" header="Path Archive" />

                        <!-- Nueva columna para mostrar la región -->
                        <Column header="Region">
                            <template #body="{ data }">
                                <!-- Muestra el nombre de la región en lugar del ID -->
                                {{ getRegionNameById(data.regionId) }}
                            </template>
                        </Column>

                        <Column field="status" header="Status">
                            <template #body="{ data }">
                                <span :class="data.status ? 'text-green-500' : 'text-red-500'">{{ data.status ? 'Active' : 'Inactive' }}</span>
                            </template>
                        </Column>
                        <Column header="Actions">
                            <template #body="{ data }">
                                <Button icon="pi pi-eye" class="p-button-rounded p-button-success p-button-text" @click="showServerDetails(data)" />
                                <Button icon="pi pi-pencil" class="p-button-rounded p-button-info p-button-text" @click="editServer(data)" />
                                <Button
                                    :icon="data.status ? 'pi pi-power-off' : 'pi pi-power-off'"
                                    :class="data.status ? 'p-button-rounded p-button-danger p-button-text' : 'p-button-rounded p-button-success p-button-text'"
                                    @click="openConfirmation(data, !data.status)"
                                />
                                <Button icon="pi pi-trash" class="p-button-rounded p-button-danger p-button-text" @click="confirmDeleteServer(data.idAgent)" />
                            </template>
                        </Column>
                    </DataTable>
                </div>
            </div>
        </div>

         <!-- Modal de edición de servidor -->
    <Dialog header="Edit Server" v-model:visible="isEditDialogVisible" modal :style="{ 'max-width': '30vw', width: '30vw' }">
        <form @submit.prevent="updateServer">
            <div class="flex gap-4">
                <!-- Sección de Inputs (columna izquierda) -->
                <div class="flex flex-col w-1/2 gap-4">
                    <div class="flex flex-col gap-2">
                        <label for="edit_serverName">Server Name</label>
                        <InputText id="edit_serverName" type="text" v-model="editServerData.agentName" class="p-inputtext-sm input-with-line" placeholder="Enter Server Name" />
                    </div>
                    <div class="flex flex-col gap-2">
                        <label for="edit_ipAgent">IP Address</label>
                        <InputText id="edit_ipAgent" type="text" v-model="editServerData.ipAgent" class="p-inputtext-sm input-with-line" placeholder="Enter IP Address" />
                    </div>
                    <div class="flex flex-col gap-2">
                        <label for="edit_webServiceUrl">Web Service URL</label>
                        <InputText id="edit_webServiceUrl" type="text" v-model="editServerData.webServiceUrl" class="p-inputtext-sm input-with-line" placeholder="Enter Web Service URL" />
                    </div>
                </div>

                <!-- Sección de Inputs (columna derecha) -->
                <div class="flex flex-col w-1/2 gap-4">
                    <div class="flex flex-col gap-2">
                        <label for="edit_pathArchive">Path Archive</label>
                        <InputText id="edit_pathArchive" type="text" v-model="editServerData.pathArchive" class="p-inputtext-sm input-with-line" placeholder="Enter Path Archive" />
                    </div>
                    <div class="flex flex-col gap-2">
                        <label for="edit_regionId">Select Region</label>
                        <Dropdown id="edit_regionId" v-model="editServerData.regionId" :options="regions" optionLabel="nameRegion" optionValue="idRegion" filter filterPlaceholder="Search..." class="custom-dropdown p-dropdown-sm" />
                    </div>
                </div>
            </div>

            <!-- Sección de Botones -->
            <div class="flex gap-4 mt-4">
                <Button type="submit" label="Save" class="p-button-primary" />
            </div>
        </form>
    </Dialog>

        <!-- Diálogo de detalle de agent -->
        <Dialog v-model:visible="isShowDialogVisible" header="Agent Details" modal :style="{ 'max-width': '30vw', width: '30vw' }">
            <div class="flex flex-col gap-4">
                <div><strong>Servername:</strong> {{ detailServerData.agentName }}</div>
                <div><strong>IP Address:</strong> {{ detailServerData.ipAgent }}</div>
                <div><strong>Web Service URL:</strong> {{ detailServerData.webServiceUrl }}</div>
                <div><strong>Archive Path:</strong> {{ detailServerData.pathArchive }}</div>
                <div><strong>Region:</strong> {{ getRegionNameById(detailServerData.regionId) }}</div>
                <div>
                    <strong>Status:</strong>
                    <span :class="detailServerData.status ? 'text-green-500' : 'text-red-500'">
                        {{ detailServerData.status ? 'Active' : 'Inactive' }}
                    </span>
                </div>
            </div>
        </Dialog>

        <!-- Diálogo de creación de servidor -->
        <Dialog header="Create Server" v-model:visible="isCreateServerDialogVisible" modal :style="{ 'max-width': '30vw', width: '30vw' }">
    <form @submit.prevent="createServer">
        <div class="flex gap-4">
            <!-- Inputs columna izquierda -->
            <div class="flex flex-col w-1/2 gap-4">
                <div class="flex flex-col gap-2">
                    <label for="create_serverName">Server Name</label>
                    <InputText id="create_serverName" v-model="newServer.agentName" class="p-inputtext-sm" placeholder="Enter Server Name" />
                </div>
                <div class="flex flex-col gap-2">
                    <label for="create_ipAgent">IP Address</label>
                    <InputText id="create_ipAgent" v-model="newServer.ipAgent" class="p-inputtext-sm" placeholder="Enter IP Address" />
                </div>
                <div class="flex flex-col gap-2">
                    <label for="create_webServiceUrl">Web Service URL</label>
                    <InputText id="create_webServiceUrl" v-model="newServer.webServiceUrl" class="p-inputtext-sm" placeholder="Enter Web Service URL" />
                </div>
            </div>
            <!-- Inputs columna derecha -->
            <div class="flex flex-col w-1/2 gap-4">
                <div class="flex flex-col gap-2">
                    <label for="create_pathArchive">Path Archive</label>
                    <InputText id="create_pathArchive" v-model="newServer.pathArchive" class="p-inputtext-sm" placeholder="Enter Path Archive" />
                </div>
                <div class="flex flex-col gap-2">
                    <label for="create_regionId">Select Region</label>
                    <Dropdown id="create_regionId" v-model="newServer.regionId" :options="regions" optionLabel="nameRegion" optionValue="idRegion" filter filterPlaceholder="Search..." class="custom-dropdown p-dropdown-sm" />
                </div>
            </div>
        </div>
        <div class="flex justify-end mt-4">
            <Button label="Cancel" class="p-button-text" @click="closeCreateServerDialog" />
            <Button label="Create" type="submit" class="p-button-success" />
        </div>
    </form>
</Dialog>


        <!-- Diálogo de confirmación borrar -->
        <Dialog v-model:visible="displayDeleteConfirmation" header="Delete Confirmation" modal class="max-w-sm">
            <p>Are you sure you want to delete this user?</p>
            <template #footer>
                <div class="flex justify-end gap-2">
                    <Button label="No" icon="pi pi-times" @click="closeDeleteConfirmation" class="p-button-text p-button-secondary" />
                    <Button label="Yes" icon="pi pi-check" @click="deleteAgent" class="p-button-text p-button-danger" />
                </div>
            </template>
        </Dialog>

        <!-- Modal de confirmación -->
        <!-- Diálogo de confirmación inactivar-->
        <Dialog v-model:visible="displayConfirmation" header="Confirmation" modal class="max-w-sm">
            <p>Are you sure you want to proceed with this action?</p>
            <!-- Mensaje de confirmación -->
            <template #footer>
                <div class="flex justify-end gap-2">
                    <!-- Ajusta la disposición de los botones -->
                    <Button label="No" icon="pi pi-times" @click="closeConfirmation" class="p-button-text p-button-secondary" />
                    <Button label="Yes" icon="pi pi-check" @click="changeServerStatus" class="p-button-text p-button-danger" />
                </div>
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
.input-with-line {
    border: none;
    border-bottom: 1px solid #d1d5db; /* Línea gris clara */
    padding: 0.5rem 0.4rem;
    background: transparent; /* Fondo transparente */
    outline: none;
    box-shadow: none;
    margin-bottom: 0.5rem;
}

.w-full {
    width: 100%; /* Ancho completo */
}

.custom-dropdown {
    height: calc(2rem + 2.5px); /* Altura total del Dropdown */
    line-height: 2rem; /* Altura de la línea del Dropdown */
    padding: 0 0.5rem; /* Padding ajustado para alinear el texto verticalmente */
    font-size: 0.875rem; /* Tamaño de fuente del texto dentro del Dropdown */
    border: 0.5px solid #ccc; /* Borde del Dropdown */
    border-radius: 6px; /* Radio del borde del Dropdown */
    display: flex; /* Usa flexbox para alinear el contenido */
    align-items: center; /* Alinea el contenido verticalmente en el centro */
}

.p-dropdown {
    height: 100%; /* Usa el 100% de la altura definida */
    line-height: 2rem; /* Alinea la altura de línea para el contenido del Dropdown */
}

.p-dropdown .p-dropdown-label {
    height: 100%; /* Usa toda la altura disponible */
    line-height: 2rem; /* Alinea el texto dentro de la etiqueta */
}

.p-dropdown .p-dropdown-items {
    font-size: 0.875rem; /* Tamaño de fuente de las opciones */
}

</style>