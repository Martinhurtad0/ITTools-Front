<script>
import axios from 'axios';
import Breadcrumb from 'primevue/breadcrumb';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import FileUpload from 'primevue/fileupload';
import InputNumber from 'primevue/inputnumber';
import ProgressSpinner from 'primevue/progressspinner';
import RadioButton from 'primevue/radiobutton';
import { onMounted, ref, watch } from 'vue';
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
        const regions = ref([]);  // Almacenará las regiones
        const serversDB = ref([]);  // Almacenará los servidores filtrados
        const filteredServers = ref([]);  // Almacenará los servidores filtrados por región
        const pins = ref([]);  // Manejo de pins subidos y consultados
        const consultedPins = ref([]);  // Pines consultados que se mostrarán en la tabla
        const isLoading = ref(false);
        const selectedRegion = ref(null);  // Selección actual de región
        const selectedServerDB = ref(null);  // Selección actual de servidor
        const selectedPin = ref(null);  // PIN seleccionado para consultar
        const ticket = ref('');  // Información de ticket
        const approvedBy = ref('');  // Aprobador del pin
        const rowsPerPage = ref(5);  // Paginación
        const uploadSuccess = ref(false);
        const successMessage = ref('');
        const errorMessage = ref('');
        const isUploadModalVisible = ref(false);
        const selectedPinsForRecycle = ref([]);

        // Funciones para mostrar y ocultar loading spinner
        const showLoading = () => isLoading.value = true;
        const hideLoading = () => isLoading.value = false;
        const isRecycleModalVisible = ref(false);


        const excelPins = ref([]);  // Almacena los datos del archivo Excel
        const uploadedFileName = ref(''); // Para almacenar el nombre del archivo subido

        // Rastro de navegación
        const breadcrumbItems = ref([
            { label: 'Home', icon: 'pi pi-home', url: '/' },
            { label: 'Database', icon: 'pi pi-database' },
            { label: 'Recycling Pins', icon: 'pi pi-refresh', route: { name: 'RecyclingPins' } }
        ]);
        const showUploadModal = () => {
            isUploadModalVisible.value = true;
        };
        const closeUploadModal = () => {
            isUploadModalVisible.value = false;
            resetInputs(); // Reiniciar campos al cerrar
        };
        // Manejar la carga del archivo
        const handleFileUpload = (event) => {
            const file = event.target.files[0];
            if (file) {
                selectedFile.value = file; // Almacena el archivo seleccionado
            }
        };


        // Cargar regiones desde la API
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

        async function recycleSelectedPins() {
    if (selectedPinsForRecycle.value.length === 0) {
        errorMessage.value = 'Please select at least one pin to recycle.';
        return;
    }

    const requestData = {
        selectedPins: selectedPinsForRecycle.value, // Asegúrate de que contenga objetos completos
        logTransactionServers: [], // Aquí puedes agregar la lógica para obtener esto
        auditTicket: ticket.value,
        authorization: approvedBy.value
    };

    try {
        const response = await axios.post('/api/pins/recycle', requestData);
        console.log('Response from recyclePins API:', response.data);
        successMessage.value = response.data;
        uploadSuccess.value = true;
        selectedPinsForRecycle.value = []; // Limpiar selección después de reciclar
    } catch (error) {
        console.error('Error recycling pins:', error);
        errorMessage.value = error.response?.data || 'Error recycling pins.';
    }
}


        // Cargar servidores de la base de datos (filtrados por estado activo)
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

        // Filtrar servidores por la región seleccionada
        function filterServersByRegion() {
            if (selectedRegion.value) {
                filteredServers.value = serversDB.value.filter(
                    (server) => server.regionId === selectedRegion.value
                );
            } else {
                filteredServers.value = [];
            }
        }

        function submitPins() {
            if (uploadedFileName.value) {
                uploadPins({ files: [uploadedFileName.value] }); // Llama a uploadPins con el archivo subido
            } else {
                errorMessage.value = "Please select a file to upload.";
            }
        }
        // Subir archivo de pins (vinculado a un servidor específico)
        async function uploadPins(event) {
            showLoading();

            // Verificar si se ha seleccionado un archivo
            if (!event.files.length) {
                errorMessage.value = 'No file selected.';
                hideLoading();
                return;
            }

            // Validar si hay un servidor seleccionado
            if (!selectedServerDB.value) {
                errorMessage.value = 'No server selected.';
                hideLoading();
                return;
            }

            // Preparar el FormData para la subida
            const formData = new FormData();
            formData.append('file', event.files[0]);  // Añadir el archivo seleccionado al FormData
            formData.append('serverId', selectedServerDB.value);  // Añadir el ID del servidor

            try {
                const response = await axios.post('/api/pins/upload', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });

                // Asegúrate de que la respuesta tenga la estructura correcta
                if (Array.isArray(response.data)) {
                    excelPins.value = response.data;  // Asignar los datos a excelPins
                    uploadSuccess.value = true;
                    successMessage.value = 'File uploaded successfully';
                    uploadedFileName.value = event.files[0].name;  // Guardar el nombre del archivo subido
                } else {
                    throw new Error('Unexpected response format');
                }

            } catch (error) {
                errorMessage.value = `Error uploading pins: ${error.response?.data?.message || error.message}`;
                console.error('Error uploading pins:', error.message);
                uploadedFileName.value = '';

            } finally {
                hideLoading();
            }
        }


        function downloadExcel() {
            // Asegúrate de que `pins.value` contenga los datos que deseas exportar
            const worksheet = XLSX.utils.json_to_sheet(pins.value); // Convierte los datos a una hoja
            const workbook = XLSX.utils.book_new(); // Crea un nuevo libro de trabajo
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Recycling Pins'); // Agrega la hoja al libro

            // Genera el archivo Excel y lo descarga
            XLSX.writeFile(workbook, 'recycling_pins.xlsx');
        }

        // Listar pins por servidor y PIN específico
        async function listPin() {
            // Depuración: Verificar el tipo de selectedPin.value
            console.log('Tipo de selectedPin:', typeof selectedPin.value);  // Mostrar el tipo de selectedPin

            // Verificar si el pin es una cadena vacía o solo espacios en blanco
            if (!selectedPin.value || selectedPin.value.trim() === '') {
                errorMessage.value = 'El pin no puede estar vacío o compuesto solo de espacios en blanco';
                console.log('Error: El pin es inválido');
                return;  // Salir de la función si el pin es inválido
            }

            showLoading();
            try {
                const response = await axios.get(`/api/pins/list?pin=${selectedPin.value}&serverId=${selectedServerDB.value}`);
                pins.value = response.data;

                // Actualizar la tabla con los pines consultados
                consultedPins.value = pins.value.map(pin => ({
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
                    expirationDate: pin.expirationDate,
                    state: pin.state
                }));

            } catch (error) {
                errorMessage.value = 'Error listing pins: ' + error.message;
                console.error('Error listing pins:', error.message);
            } finally {
                hideLoading();
            }
        }


        // Reiniciar entradas del formulario
        function resetInputs() {
            selectedPin.value = null;
            ticket.value = '';
            approvedBy.value = '';
        }

        // Monitorear cambios en la selección de región
        watch(selectedRegion, filterServersByRegion);

        // Cargar regiones y servidores cuando el componente se monte
        onMounted(async () => {
            await loadRegions();
            await loadServersDB();
        });


        function showRecycleModal() {
            isRecycleModalVisible.value = true;
            // Aquí podrías cargar los pines consultados si es necesario
            listPin(); // Llama a listPin si necesitas obtener datos antes de mostrar el modal
        }

        return {
            regions,
            filteredServers,
            pins,
            consultedPins,  // Agregar consultedPins aquí
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
            resetInputs,
            excelPins,
            downloadExcel,
            submitPins,
            isRecycleModalVisible,
            showRecycleModal,
            showUploadModal,
            closeUploadModal,
            handleFileUpload,
            isUploadModalVisible,
            selectedPinsForRecycle,
            recycleSelectedPins,

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

            <div class="w-1/2 card p-4 flex flex-col max-h-96 overflow-auto">
                <h2>Ver Pines</h2>
                <div class="flex space-x-4 mt-4">
                    <Button label="Cargar Pines por Excel" class="p-button-warning" @click="showUploadModal" />
                    <Button label="Reciclar Pines" class="p-button-success" @click="showRecycleModal" />
                </div>
            </div>
        </div>

        <!-- Modal para reciclar pines -->
        <Dialog v-model:visible="isRecycleModalVisible" modal :showHeader="false" style="width: 800px;">
            <div class="p-4">
                <h3 class="text-xl font-semibold mb-4">Check Status and Recycle Pins</h3>
                <div class="mb-4">
                    <InputText v-model="selectedPin" placeholder="Enter PIN" class="w-full p-inputtext-sm" />
                    <Button @click="listPin" label="Check Status" class="p-button-primary mt-2" />
                </div>
                <div class="grid grid-cols-2 gap-4 mb-6">
                    <input v-model="ticket" placeholder="Ticket" class="w-full p-inputtext" />
                    <input v-model="approvedBy" placeholder="Approved By" class="w-full p-inputtext" />
                </div>
                <div class="datatable-container mb-6">
                    <h4 class="text-lg font-semibold mb-2">Recycling Pins Special Cases</h4>
                    <DataTable :value="consultedPins" paginator :rows="rowsPerPage" class="p-datatable-striped"
                        selectionMode="multiple" :selection="selectedPinsForRecycle"
                        @update:selection="selectedPinsForRecycle = $event">

                        <!-- Columna para los checkboxes -->
                        <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>

                        <!-- Resto de las columnas -->
                        <Column field="pin" header="PIN"></Column>
                        <Column field="state" header="Estado"></Column>
                        <Column field="consultedDate" header="Fecha de Consulta"></Column>
                        <Column field="productId" header="ID del Producto"></Column>
                        <Column field="amount" header="Monto"></Column>
                        <Column field="insertDate" header="Fecha de Inserción"></Column>
                        <Column field="recycleDate" header="Fecha de Reciclado"></Column>
                    </DataTable>
                </div>
                <div class="flex justify-end space-x-4">
                    <Button label="Descargar Excel" @click="downloadExcel" class="p-button-warning" />
                    <Button label="Reciclar Pin" @click="recycleSelectedPins" class="p-button-success" />

                    <Button label="Cerrar" @click="isRecycleModalVisible = false" class="p-button-secondary" />
                </div>
            </div>
        </Dialog>

        <Dialog v-model:visible="isUploadModalVisible" modal :showHeader="false" style="width: 800px;">
            <div class="p-4">
                <h3 class="text-xl font-semibold mb-4">Upload Pins by Excel</h3>
                <div class="grid grid-cols-2 gap-4 mb-6">
                    <InputText v-model="ticket" placeholder="Ticket" class="w-full p-inputtext" />
                    <InputText v-model="approvedBy" placeholder="Approved By" class="w-full p-inputtext" />
                </div>
                <div class="mb-6">
                    <h4 class="text-lg font-semibold mb-2">Upload Excel File</h4>
                    <input type="file" @change="handleFileUpload" class="w-full" accept=".xls,.xlsx" />
                </div>
                <div class="flex justify-end space-x-4">
                    <Button label="Reciclar Pin" @click="recycleSelectedPins" class="p-button-success" />
                    <Button label="Upload" @click="uploadPins" class="p-button-success" />
                    <Button label="Close" @click="isUploadModalVisible = false" class="p-button-secondary" />
                </div>
            </div>
        </Dialog>

        <div class="card p-4 flex flex-col">
            <h2>Pin Information</h2>
            <div class="datatable-container">
                <h2>Pins Excel</h2>
                <DataTable :value="excelPins" class="custom-datatable" :paginator="true"
                    :rowsPerPageOptions="[5, 10, 20]" :rows="5">
                    <Column field="pin" header="Pin" sortable />
                    <Column field="productId" header="Product ID" sortable />
                    <Column field="controlNo" header="Control No" sortable />
                    <Column field="amount" header="Amount" sortable />
                    <Column field="ani" header="ANI" sortable />
                    <Column field="insertDate" header="Insert Date" sortable />
                    <Column field="activationDate" header="Activation Date" sortable />
                    <Column field="recycleDate" header="Recycle Date" sortable />
                    <Column field="transactionCount" header="Transaction Count" sortable />
                    <Column field="batchID" header="Batch ID" sortable />
                    <Column field="expirationDate" header="Expiration Date" sortable />
                </DataTable>
            </div>
        </div>

        <Dialog v-model:visible="isLoading" modal :showHeader="false" :closable="false">
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

/* Modal styling for consistency */
.modal-content {
    width: 800px;
    max-width: 90%;
}
</style>
