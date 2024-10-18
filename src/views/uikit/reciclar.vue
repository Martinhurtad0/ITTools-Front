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
import FileUpload from 'primevue/fileupload';
import Breadcrumb from 'primevue/breadcrumb';
import InputNumber from 'primevue/inputnumber';
import { ref, watch, onMounted } from 'vue';
import * as XLSX from 'xlsx';


export default {
    components: {
        Dropdown,
        DataTable,
        Column,
        RadioButton,
        Card,
        Button,
        Dialog,
        ProgressSpinner,
        FileUpload,
        Breadcrumb,
        InputNumber
    },
    setup() {
        const regions = ref([]);  
        const serversDB = ref([]);  
        const filteredServers = ref([]);  
        const pins = ref([]);  
        const consultedPins = ref([]);  
        const isLoading = ref(false);
        const selectedRegion = ref(null);  
        const selectedServerDB = ref(null);  
        const selectedPin = ref(null);  
        const ticket = ref('');  
        const approvedBy = ref('');  
        const rowsPerPage = ref(5);  
        const uploadSuccess = ref(false);
        const successMessage = ref('');
        const errorMessage = ref('');

        // Rastro de navegación
        const breadcrumbItems = ref([
            { label: 'Home', icon: 'pi pi-home', url: '/' },
            { label: 'Database', icon: 'pi pi-database' },
            { label: 'Recycling Pins', icon: 'pi pi-refresh', route: { name: 'RecyclingPins' } }
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
                errorMessage.value = 'Error fetching regions: ' + error.message;
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
                errorMessage.value = 'Error fetching servers: ' + error.message;
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

        async function uploadPins(event) {
            showLoading();

            if (!event.files.length) {
                errorMessage.value = 'No file selected.';
                hideLoading();
                return;
            }

            if (!selectedServerDB.value) {
                errorMessage.value = 'No server selected.';
                hideLoading();
                return;
            }

            const formData = new FormData();
            formData.append('file', event.files[0]); 
            formData.append('serverId', selectedServerDB.value); 

            try {
                const response = await axios.post('/api/pins/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                if (Array.isArray(response.data)) {
                    pins.value = response.data; // Actualiza los pines subidos
                    uploadSuccess.value = true;
                    successMessage.value = 'File uploaded successfully';
                    uploadedFileName.value = event.files[0].name; 
                } else {
                    throw new Error('Unexpected response format');
                }

            } catch (error) {
                errorMessage.value = `Error uploading pins: ${error.response?.data?.message || error.message}`;
                console.error('Error uploading pins:', error.message);
            } finally {
                hideLoading();
            }
        }

        async function listPin() {
            if (!selectedPin.value || selectedPin.value.trim() === '') {
                errorMessage.value = 'El pin no puede estar vacío o compuesto solo de espacios en blanco';
                return; 
            }

            showLoading();
            try {
                const response = await axios.get(`/api/pins/list?pin=${selectedPin.value}&serverId=${selectedServerDB.value}`);
                
                if (response.data && Array.isArray(response.data)) {
                    consultedPins.value = response.data.map(pin => ({
                        pin: pin.pin,
                        status: pin.status,
                        consultedDate: pin.consultedDate || new Date().toLocaleDateString(),
                        productId: pin.productId,
                        controlNo: pin.controlNo,
                        amount: pin.amount,
                        insertDate: pin.insertDate,
                        activationDate: pin.activationDate,
                        recycleDate: pin.recycleDate,
                        transactionCount: pin.transactionCount,
                        batchID: pin.batchID,
                        expirationDate: pin.expirationDate
                    }));
                    
                    if (consultedPins.value.length === 0) {
                        errorMessage.value = 'No pins found for the specified criteria.';
                    }
                    
                } else {
                    errorMessage.value = 'Unexpected response format';
                }

            } catch (error) {
                errorMessage.value = 'Error listing pins: ' + error.message;
                console.error('Error listing pins:', error.message);
            } finally {
                hideLoading();
            }
        }

        function resetInputs() {
            selectedPin.value = null;
            ticket.value = '';
            approvedBy.value = '';
        }

        watch(selectedRegion, filterServersByRegion);

        onMounted(async () => {
            await loadRegions();
            await loadServersDB();
        });

        return {
            regions,
            filteredServers,
            pins,
            consultedPins, 
            selectedRegion,
            selectedServerDB,
            selectedPin,
            ticket,
            approvedBy,
            rowsPerPage,
            isLoading,
            uploadSuccess,
            successMessage,
            errorMessage,
            breadcrumbItems,
            uploadPins,
            listPin,
            resetInputs
        };
    },
};
</script>



<template>
    <div class="flex flex-col h-screen p-4 space-y-5">
        <!-- Mensajes de éxito o error -->
        <div v-if="uploadSuccess" class="alert alert-success">
            Pins uploaded successfully!
        </div>
        <div v-if="errorMessage" class="alert alert-danger">
            {{ errorMessage }}
        </div>
        <div v-if="uploadSuccess" class="alert alert-success">
            {{ successMessage }}
        </div>

        <!-- Card para el título y Breadcrumb -->
        <div class="w-full card p-1 mb-4">
            <div class="header-container">
                <div class="title font-semibold text-xl ml-4">Recycling Pins</div>
                <div class="breadcrumb-section mr-2">
                    <Breadcrumb :model="breadcrumbItems" class="breadcrumb-item" />
                </div>
            </div>
        </div>

        <!-- Selección de región y servidores -->
        <div class="flex space-x-6">
            <div class="w-1/2 card p-4 flex flex-col max-h-96 overflow-auto">
                <h2>Select Region</h2>
                <Dropdown v-model="selectedRegion" :options="regions" option-label="name" option-value="id"
                    placeholder="Select Region" class="w-full" filter />

                <h2>Available Servers</h2>
                <div v-if="filteredServers.length === 0">
                    No servers found for the selected region
                </div>
                <div v-else>
                    <div v-for="server in filteredServers" :key="server.idServer">
                        <RadioButton v-model="selectedServerDB" :value="server.idServer" />
                        <span>{{ server.serverName }} || </span>
                        <span>{{ server.ipServer }} || </span>
                        <span>{{ server.description }} || </span>
                    </div>
                </div>
            </div>

            <!-- Nuevo Div para Ver Pines -->
            <div class="w-1/2 card p-4 flex flex-col max-h-96 overflow-auto">
                <h2>Ver Pines</h2>
                <div class="flex space-x-4 mt-4">
                    <Button label="Cargar Pines por Excel" class="p-button-warning" @click="showUploadModal" />
                    <Button label="Reciclar Pines" class="p-button-success" @click="showRecycleModal" />
                </div>
            </div>
        </div>

        <!-- Modal para Cargar Pines por Excel -->
        <Dialog v-model:visible="isUploadModalVisible" modal :showHeader="false">
            <div class="p-4">
                <h3>Cargar Pines por Excel</h3>
                <FileUpload ref="fileUpload" mode="basic" name="file" accept=".xlsx, .xls"
                    @upload="uploadPins" chooseLabel="Choose File" />
                
                <input v-model="ticket" placeholder="Ticket" class="w-full p-inputtext mt-2 mb-2"/>
                <input v-model="approvedBy" placeholder="Approved By" class="w-full p-inputtext mb-2"/>
                
                <Button label="Enviar" @click="submitUpload" />
            </div>
        </Dialog>

        <!-- Modal para Reciclar Pines -->
        <Dialog v-model:visible="isRecycleModalVisible" modal :showHeader="false">
            <div class="p-4">
                <h3>Pin Information</h3>
                <!-- DataTable para Recycling Pins Special Cases -->
                <DataTable :value="consultedPins" class="mb-4 custom-datatable"
                    :paginator="true"
                    :rowsPerPageOptions="[5, 10, 20]" :rows="5">
                    <!-- Checkbox para seleccionar pines -->
                    <Column header="" body="{rowData}">
                        <template #body="{ rowData }">
                            <Checkbox v-model='rowData.selected' />
                        </template>
                    </Column>
                    <Column field="pin" header="Pin" sortable />
                    <!-- Agrega aquí más columnas según sea necesario -->
                    <!-- Por ejemplo: productId, controlNo, etc. -->
                </DataTable>

                <!-- Botón para reciclar pines seleccionados -->
                <Button label="Reciclar Pines" @click="recycleSelectedPins"/>
            </div>
        </Dialog>

        <!-- Loading Modal -->
        <Dialog v-model:visible="isLoading" modal :showHeader="false" :closable="false">
            <!-- Contenido del modal de carga -->
            <div class="flex items-center justify-center">
                <ProgressSpinner />
                <p>Loading...</p>
            </div>
        </Dialog>

    </div>
</template>
<style scoped>
/* Estilo general de las DataTables */
.datatable-container {
    background-color: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
    margin-bottom: 20px;
}

.header-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.custom-datatable {
    border-collapse: separate;
    border-spacing: 0 10px;
}

.custom-datatable .p-datatable-thead>tr>th {
    background-color: #f8f9fa;
    padding: 10px;
    font-weight: bold;
    border-top-left-radius: 10px;
    border-top-right-radius: 10px;
}

.custom-datatable .p-datatable-tbody>tr {
    background-color: #ffffff;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
    border-radius: 10px;
}

.custom-datatable .p-datatable-tbody>tr>td {
    padding: 15px;
    border-bottom: none;
}

.custom-datatable .p-paginator {
    margin-top: 15px;
}

.p-inputtext-sm.input-with-line {
    border-bottom: 1px solid #ced4da;
    border-radius: 0;
    box-shadow: none;
    width: 100%;
}

h2 {
    font-size: 1.5rem;
    margin-bottom: 1rem;
}

.alert {
    padding: 10px;
    margin-bottom: 10px;
    border-radius: 5px;
}

.alert-success {
    background-color: #d4edda;
    color: #155724;
}

.alert-danger {
    background-color: #f8d7da;
    color: #721c24;
}
</style>
