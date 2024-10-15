<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import ActuatorService from '@/services/ActuatorService';

const status200 = ref(0);
const status400 = ref(0);
const status404 = ref(0);
const status500 = ref(0);
const requests = ref([]); // Datos para la tabla
const lastUpdated = ref(''); // Fecha y hora de la última actualización
const healthInfo = ref({}); // Información de salud
const uptime = ref(0); // Tiempo de actividad en segundos

// Función para convertir bytes a gigas
function formatBytes(bytes) {
    if (bytes === 0) return '0 GB';
    const gigas = bytes / 1073741824; // 1 GB = 1024^3 bytes
    return gigas.toFixed(2); // Redondea a 2 decimales
}

// Función para formatear el uptime en HH:MM:SS
function formatUptime(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    // Asegurarse de que siempre haya dos dígitos
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// Función para actualizar el tiempo de actividad en tiempo real
function updateUptime() {
    uptime.value += 1; // Incrementar el uptime cada segundo
}

onMounted(async () => {
    await fetchData(); // Llama a la función para obtener datos inicialmente

    // Iniciar intervalo para actualizar el uptime cada segundo
    const interval = setInterval(updateUptime, 1000);

    // Limpiar el intervalo al desmontar el componente
    onUnmounted(() => {
        clearInterval(interval);
    });
});

async function fetchData() {
    try {
        const responseData = await ActuatorService.getRequest(); // Obtener datos de las solicitudes
        const response = await ActuatorService.getHealth(); // Obtener información de salud
        healthInfo.value = response; // Almacena la respuesta en healthInfo
        requests.value = responseData; // Asignar el array directamente
        uptime.value = Math.floor(await ActuatorService.getUptime()); // Obtener uptime inicial en segundos y truncar a entero

        // Contar los códigos de estado después de que se haya asignado requests
        status200.value = requests.value.filter((request) => request.statusCode === 200).length;
        status400.value = requests.value.filter((request) => request.statusCode === 400).length;
        status404.value = requests.value.filter((request) => request.statusCode === 404).length;
        status500.value = requests.value.filter((request) => request.statusCode === 500).length;

        // Actualizar la fecha y hora de la última actualización
        const currentDate = new Date();
        lastUpdated.value = currentDate.toLocaleString(); // Formato de fecha y hora
    } catch (error) {
        console.error('Error al obtener los datos:', error);
    }
}
</script>

<template>
    <div class="grid grid-cols-12 gap-8">
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0 bg-green-100">
                <div class="flex justify-between mb-4">
                    <div>
                        <span class="block text-muted-color font-medium mb-4">200 Response</span>
                        <div class="text-surface-900 font-medium text-xl">{{ status200 }}</div>
                        <div class="text-gray-600">Updated: {{ lastUpdated }}</div>
                    </div>
                    <div class="flex items-center justify-center bg-green-400 rounded-border" style="width: 2.5rem; height: 2.5rem">
                        <i class="pi pi-check text-white !text-xl"></i>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0 bg-blue-100">
                <div class="flex justify-between mb-4">
                    <div>
                        <span class="block text-muted-color font-medium mb-4">404 Response</span>
                        <div class="text-surface-900 font-medium text-xl">{{ status404 }}</div>
                        <div class="text-gray-600">Updated: {{ lastUpdated }}</div>
                    </div>
                    <div class="flex items-center justify-center bg-blue-400 rounded-border" style="width: 2.5rem; height: 2.5rem">
                        <i class="pi pi-exclamation-triangle text-white !text-xl"></i>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0 bg-orange-100">
                <div class="flex justify-between mb-4">
                    <div>
                        <span class="block text-muted-color font-medium mb-4">400 Response</span>
                        <div class="text-surface-900 font-medium text-xl">{{ status400 }}</div>
                        <div class="text-gray-600">Updated: {{ lastUpdated }}</div>
                    </div>
                    <div class="flex items-center justify-center bg-orange-400 rounded-border" style="width: 2.5rem; height: 2.5rem">
                        <i class="pi pi-times text-white !text-xl"></i>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0 bg-red-100">
                <div class="flex justify-between mb-4">
                    <div>
                        <span class="block text-muted-color font-medium mb-4">500 Response</span>
                        <div class="text-surface-900 font-medium text-xl">{{ status500 }}</div>
                        <div class="text-gray-600">Updated: {{ lastUpdated }}</div>
                    </div>
                    <div class="flex items-center justify-center bg-red-400 rounded-border" style="width: 2.5rem; height: 2.5rem">
                        <i class="pi pi-server text-white !text-xl"></i>
                    </div>
                </div>
            </div>
        </div>

        <!-- Tabla con las solicitudes -->
        <div class="col-span-12 xl:col-span-6">
            <div class="card">
                <div class="font-semibold text-xl mb-4">Http response</div>
                <DataTable :value="requests" :rows="5" :paginator="true" responsiveLayout="scroll">
                    <Column field="clientIp" header="Client IP" :sortable="true" style="width: 25%"></Column>
                    <Column field="requestUri" header="Request URI" :sortable="true" style="width: 25%"></Column>
                    <Column field="method" header="Method" :sortable="true" style="width: 20%"></Column>
                    <Column field="statusCode" header="Status Code" :sortable="true" style="width: 15%"></Column>
                    <Column field="timestamp" header="Timestamp" :sortable="true" style="width: 20%"></Column>
                </DataTable>
            </div>
        </div>

        <!-- Información del sistema -->
        <div class="col-span-12 xl:col-span-6">
            <div class="card flex flex-col">
                <div class="flex flex-wrap items-start justify-between">
                    <div class="flex items-center mr-8 mb-2">
                        <i class="pi pi-server text-gray-700 mr-1"></i>
                        <strong>System:</strong>
                        <span class="ml-1">{{ healthInfo.status }}</span>
                    </div>
                    <div class="flex items-center mr-8 mb-2">
                        <i class="pi pi-database text-gray-700 mr-1"></i>
                        <strong>DB:</strong>
                        <span class="ml-1">{{ healthInfo.components?.db?.details?.database }} - {{ healthInfo.components?.db?.status }}</span>
                    </div>
                </div>

                <div class="flex flex-wrap items-center justify-between mt-2">
                    <div class="flex items-center mr-8 mb-2">
                        <i class="pi pi-desktop text-gray-700 mr-1"></i>
                        <strong>Disk space:</strong>
                        <span class="ml-1">{{ formatBytes(healthInfo.components?.diskSpace?.details?.total) }} GB</span>
                    </div>
                    <div class="flex items-center mr-8 mb-2">
                        <i class="pi pi-desktop text-gray-700 mr-1"></i>
                        <strong>Disk free:</strong>
                        <span class="ml-1">{{ formatBytes(healthInfo.components?.diskSpace?.details?.free) }} GB</span>
                    </div>
                </div>

                <div class="flex items-center mt-2">
                    <i class="pi pi-clock text-gray-700 mr-1"></i>
                    <strong>Uptime:</strong>
                    <span class="ml-1">{{ formatUptime(uptime) }} h</span>
                </div>
            </div>
            <div class="col-span-12 xl:col-span-6">
                <div class="card">
                    <div class="font-semibold text-xl mb-4">Most wanted region</div>
                    <Chart type="bar" :data="chartData" :options="chartOptions" class="h-80" />
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped></style>
