<script setup>
import ActuatorService from '@/services/ActuatorService';
import { serverService } from '@/services/AgentService';
import { regionService } from '@/services/RegionService';
import { BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Title, Tooltip } from 'chart.js';
import { onMounted, onUnmounted, ref } from 'vue';

// Registro de componentes necesarios para Chart.js
ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

const status200 = ref(0);
const status400 = ref(0);
const status404 = ref(0);
const status500 = ref(0);
const lastUpdated200 = ref('');
const lastUpdated400 = ref('');
const lastUpdated404 = ref('');
const lastUpdated500 = ref('');
const requests = ref([]);
const healthInfo = ref({});
const uptime = ref(0);
const audits = ref([]); // Aquí se almacenan los datos de auditoría
const filteredAudits = ref([]); // Datos filtrados de auditoría

// Variables para los gráficos
const regionCounts = ref({}); // Contador de uso por regiones
const agentCounts = ref({}); // Contador de uso por agentes
const regions = ref([]); // Lista de regiones disponibles
const agents = ref([]); // Lista de agentes disponibles
const chartDataRegions = ref(null); // Datos para gráfica de regiones
const chartDataAgents = ref(null); // Datos para gráfica de agentes
const chartOptionsAudits = ref(null); // Opciones comunes para gráficos

// Función para obtener regiones y agentes
async function fetchRegionAndAgentData() {
    try {
        regions.value = await regionService.getAllRegions();
        agents.value = await serverService.getAllServers(); // Obtener servidores (agentes)
    } catch (error) {
        console.error('Error:', error);
    }
}

// Función para convertir bytes a gigas
function formatBytes(bytes) {
    if (bytes === 0) return '0 GB';
    const gigas = bytes / 1073741824;
    return gigas.toFixed(2);
}

// Función para formatear uptime (segundos) a HH:MM:SS
function formatUptime(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// Actualiza el tiempo de actividad (uptime) en tiempo real
function updateUptime() {
    uptime.value += 1;
}

// Al montar el componente
onMounted(async () => {
    const interval = setInterval(updateUptime, 1000); // Inicializa el intervalo aquí

    // Llama a las funciones asincrónicas
    await fetchRegionAndAgentData();
    await fetchData();

    // Limpia el intervalo al desmontar
    onUnmounted(() => clearInterval(interval));

    await fetchAuditData();
});

// Función para analizar los mensajes de auditoría
function parseAuditMessage(userAction = '') {
    if (typeof userAction !== 'string') {
        console.error('No valid:', userAction);
        return {
            regionId: null,
            agentId: null
        };
    }

    // Usar expresiones regulares para encontrar los IDs de región y agente
    const regionMatch = userAction.match(/Region ID: (\d+)/i);
    const agentMatch = userAction.match(/Agent ID: (\d+)/i);

    // Si no se encuentra el ID de región o agente, retornamos null
    return {
        regionId: regionMatch ? parseInt(regionMatch[1]) : null,
        agentId: agentMatch ? parseInt(agentMatch[1]) : null
    };
}

// Función para obtener y filtrar los datos de auditoría
async function fetchAuditData() {
    try {
        const response = await ActuatorService.getAuditData();
        audits.value = response.data; // Almacenar los datos de auditoría
        filteredAudits.value = audits.value; // Filtro de auditoría si se requiere

        processAuditData(); // Procesar los datos de auditoría
    } catch (error) {
        console.error('Error:', error);
    }
}

// Función para obtener el nombre de una región por su ID
function getRegionNameById(regionId) {
    const region = regions.value.find((region) => region.idRegion === regionId);
    return region ? region.nameRegion : 'Unknown Region';
}

// Función para obtener el nombre de un agente por su ID
function getAgentNameById(agentId) {
    const agent = agents.value.find((agent) => agent.idAgent === agentId);
    return agent ? agent.agentName : 'Unknown Agent';
}

// Función para procesar los datos de auditoría y contar las regiones y agentes
function processAuditData() {
    const regionCountMap = {};
    const agentCountMap = {};

    // Itera sobre los registros de auditoría
    audits.value.forEach((audit) => {
        // Verifica que audit.userAction esté definido antes de procesarlo
        if (!audit.userAction) {
            console.error('Invalid action:', audit);
            return;
        }

        // Desglosar el campo userAction para obtener los IDs de región y agente
        const parsedData = parseAuditMessage(audit.userAction);

        // Contar regiones
        if (parsedData.regionId !== null) {
            const regionName = getRegionNameById(parsedData.regionId); // Obtener el nombre de la región

            // Inicializa el contador si es la primera vez que aparece la región
            if (!regionCountMap[regionName]) {
                regionCountMap[regionName] = 0;
            }
            regionCountMap[regionName]++;
        }

        // Contar agentes
        if (parsedData.agentId !== null) {
            const agentName = getAgentNameById(parsedData.agentId); // Obtener el nombre del agente

            // Inicializa el contador si es la primera vez que aparece el agente
            if (!agentCountMap[agentName]) {
                agentCountMap[agentName] = 0;
            }
            agentCountMap[agentName]++;
        }
    });

    // Actualiza los contadores
    regionCounts.value = regionCountMap;
    agentCounts.value = agentCountMap;

    // Actualiza los datos de las gráficas para regiones y agentes
    chartDataRegions.value = setAuditChartData(regionCounts.value, 'Regions');
    chartDataAgents.value = setAuditChartData(agentCounts.value, 'Agents');
}

// Función para configurar los datos del gráfico de auditoría con estilos personalizados
function setAuditChartData(counts, label) {
    const documentStyle = getComputedStyle(document.documentElement); // Obtener estilos del documento

    return {
        labels: Object.keys(counts),
        datasets: [
            {
                type: 'bar',
                label: `Usage of ${label}`,
                backgroundColor: 'color-mix(in srgb, ' + documentStyle.getPropertyValue('--p-primary-300') + ' 100%, #fff)',
                data: Object.values(counts),
                barThickness: 32,
                borderRadius: {
                    topLeft: 8,
                    topRight: 8
                }
            }
        ]
    };
}

// Opciones del gráfico de auditoría con escalas y colores personalizados
function setAuditChartOptions() {
    const documentStyle = getComputedStyle(document.documentElement);
    const borderColor = documentStyle.getPropertyValue('--surface-border');
    const textMutedColor = documentStyle.getPropertyValue('--text-color-secondary');

    return {
        responsive: true,
        maintainAspectRatio: false, // Permitir que el gráfico ocupe el espacio disponible
        aspectRatio: 1.5, // Ajustar la relación de aspecto (1.5 es solo un ejemplo)
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    color: textMutedColor
                }
            },
            title: {
                display: true,
                text: 'Most Used Regions and Agents',
                color: textMutedColor
            }
        },
        scales: {
            x: {
                stacked: true,
                ticks: {
                    color: textMutedColor
                },
                grid: {
                    color: 'transparent',
                    borderColor: 'transparent'
                }
            },
            y: {
                stacked: true,
                ticks: {
                    color: textMutedColor
                },
                grid: {
                    color: borderColor,
                    borderColor: 'transparent',
                    drawTicks: false
                }
            }
        }
    };
}

// Asignar las opciones a chartOptionsAudits
chartOptionsAudits.value = setAuditChartOptions();

// Función para obtener datos generales
function updateStatusCounter(statusCode, count, lastTimestamp) {
    switch (statusCode) {
        case 200:
            if (status200.value !== count) {  // Solo actualiza si el valor ha cambiado
                status200.value = count;
                lastUpdated200.value = formatDateTime(lastTimestamp); // Formatea la fecha
            }
            break;
        case 400:
            if (status400.value !== count) {  // Solo actualiza si el valor ha cambiado
                status400.value = count;
                lastUpdated400.value = formatDateTime(lastTimestamp); // Formatea la fecha
            }
            break;
        case 404:
            if (status404.value !== count) {  // Solo actualiza si el valor ha cambiado
                status404.value = count;
                lastUpdated404.value = formatDateTime(lastTimestamp); // Formatea la fecha
            }
            break;
        case 500:
            if (status500.value !== count) {  // Solo actualiza si el valor ha cambiado
                status500.value = count;
                lastUpdated500.value = formatDateTime(lastTimestamp); // Formatea la fecha
            }
            break;
        default:
            console.warn(`Code error: ${statusCode}`);
            break;
    }
}



// Luego en tu función fetchData puedes usar esta función para actualizar los valores
async function fetchData() {
    try {
        const responseData = await ActuatorService.getRequest(); // Obtener datos de las solicitudes
        const response = await ActuatorService.getHealth(); // Obtener datos de salud
        healthInfo.value = response; // Almacenar la información de salud
        requests.value = responseData; // Almacenar las solicitudes
        uptime.value = Math.floor(await ActuatorService.getUptime()); // Obtener y almacenar el uptime

        // Inicializar contadores y timestamps
        const statusCountMap = {
            200: { count: 0, lastTimestamp: '' },
            400: { count: 0, lastTimestamp: '' },
            404: { count: 0, lastTimestamp: '' },
            500: { count: 0, lastTimestamp: '' },
        };

        // Procesar cada solicitud para contar códigos de estado y obtener el último timestamp
        requests.value.forEach((request) => {
            const statusCode = request.statusCode; // Código de estado
            const timestamp = request.timestamp; // Timestamp de la solicitud

            // Si el código de estado es manejado, incrementar el contador
            if (statusCountMap[statusCode]) {
                statusCountMap[statusCode].count++;
                // Actualizar el último timestamp si es más reciente
                if (timestamp > statusCountMap[statusCode].lastTimestamp) {
                    statusCountMap[statusCode].lastTimestamp = timestamp;
                }
            }
        });

        // Actualizar los contadores y los timestamps
        updateStatusCounter(200, statusCountMap[200].count, statusCountMap[200].lastTimestamp);
        updateStatusCounter(400, statusCountMap[400].count, statusCountMap[400].lastTimestamp);
        updateStatusCounter(404, statusCountMap[404].count, statusCountMap[404].lastTimestamp);
        updateStatusCounter(500, statusCountMap[500].count, statusCountMap[500].lastTimestamp);

    } catch (error) {
        console.error('Error:', error);
    }
}


// Función para formatear la fecha y hora
function formatDateTime(dateTime) {
    const date = new Date(dateTime);
    return date.toLocaleString();
}
</script>

<template>
    <div class="grid grid-cols-12 gap-8">
        <div class="col-span-12 lg:col-span-2 xl:col-span-3">
            <div class="card mb-0 bg-green-100 shadow-custom">
                <div class="flex justify-between mb-2">
                    <div>
                        <span class="block text-surface-900 font-medium mb-2">200 Response</span>
                        <div class="text-surface-900 font-medium text-xl">{{ status200 }}</div>
                        <div class="text-gray-600">Updated: {{ lastUpdated200 }}</div>
                    </div>
                    <div class="flex items-center justify-center bg-green-400 rounded-border" style="width: 2.5rem; height: 2.5rem">
                        <i class="pi pi-check text-white !text-xl"></i>
                    </div>
                </div>
            </div>
        </div>

        <!-- Respuesta 404 -->
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0 bg-blue-100 shadow-custom">
                <div class="flex justify-between mb-2">
                    <div>
                        <span class="block text-surface-900 font-medium mb-2">404 Response</span>
                        <div class="text-surface-900 font-medium text-xl">{{ status404 }}</div>
                        <div class="text-gray-600">Updated: {{ lastUpdated404 }}</div>
                    </div>
                    <div class="flex items-center justify-center bg-blue-400 rounded-border" style="width: 2.5rem; height: 2.5rem">
                        <i class="pi pi-exclamation-triangle text-white !text-xl"></i>
                    </div>
                </div>
            </div>
        </div>

        <!-- Respuesta 400 -->
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0 bg-orange-100 shadow-custom">
                <div class="flex justify-between mb-2">
                    <div>
                        <span class="block text-surface-900 font-medium mb-2">400 Response</span>
                        <div class="text-surface-900 font-medium text-xl">{{ status400 }}</div>
                        <div class="text-gray-600">Updated: {{ lastUpdated400 }}</div>
                    </div>
                    <div class="flex items-center justify-center bg-orange-400 rounded-border" style="width: 2.5rem; height: 2.5rem">
                        <i class="pi pi-times text-white !text-xl"></i>
                    </div>
                </div>
            </div>
        </div>

        <!-- Respuesta 500 -->
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0 bg-red-100 shadow-custom">
                <div class="flex justify-between mb-2">
                    <div>
                        <span class="block text-surface-900 font-medium mb-2">500 Response</span>
                        <div class="text-surface-900 font-medium text-xl">{{ status500 }}</div>
                        <div class="text-gray-600">Updated: {{ lastUpdated500 }}</div>
                    </div>
                    <div class="flex items-center justify-center bg-red-400 rounded-border" style="width: 2.5rem; height: 2.5rem">
                        <i class="pi pi-server text-white !text-xl"></i>
                    </div>
                </div>
            </div>
        </div>

        <!-- Tabla con las solicitudes -->
        <div class="col-span-12 xl:col-span-6">
            <div class="card shadow-custom">
                <div class="font-semibold text-xl mb-4">Http response</div>
                <DataTable :value="requests" class="p-datatable-sm" :paginator="true" :rows="10" :totalRecords="requests.length" :sortField="'timestamp'" :sortOrder="-1" :emptyMessage="'No requests found'">
                    <Column field="requestUri" header="Request URI" :sortable="true" style="width: 25%"></Column>
                    <Column field="method" header="Method" :sortable="true" style="width: 20%"></Column>
                    <Column field="statusCode" header="Status Code" :sortable="true" style="width: 15%"></Column>
                    <Column field="timestamp" header="Timestamp" :sortable="true" style="width: 20%">
                        <template #body="slotProps">
                            {{ formatDateTime(slotProps.data.timestamp) }}
                        </template>
                    </Column>
                </DataTable>
            </div>
        </div>

        <!-- Información del sistema -->
        <div class="col-span-12 xl:col-span-6">
            <div class="card flex flex-col shadow-custom">
                <div class="flex flex-wrap items-start justify-between">
                    <div class="flex items-center mr-8 mb-2">
                        <i class="pi pi-server mr-2 mt-1"></i>
                        <strong>System:</strong>
                        <span class="ml-1">{{ healthInfo.status }}</span>
                    </div>
                    <div class="flex items-center mr-8 mb-2">
                        <i class="pi pi-database mr-2 mt-1"></i>
                        <strong>DB:</strong>
                        <span class="ml-1">{{ healthInfo.components?.db?.details?.database }} - {{ healthInfo.components?.db?.status }}</span>
                    </div>
                </div>

                <div class="flex flex-wrap items-center justify-between mt-2">
                    <div class="flex items-center mr-8 mb-2">
                        <i class="pi pi-desktop mr-2 mt-1"></i>
                        <strong>Disk space:</strong>
                        <span class="ml-1">{{ formatBytes(healthInfo.components?.diskSpace?.details?.total) }} GB</span>
                    </div>
                    <div class="flex items-center mr-8 mb-2">
                        <i class="pi pi-desktop mr-2 mt-1"></i>
                        <strong>Disk free:</strong>
                        <span class="ml-1">{{ formatBytes(healthInfo.components?.diskSpace?.details?.free) }} GB</span>
                    </div>
                </div>

                <div class="flex items-center mt-2">
                    <i class="pi pi-clock mr-2 mt-1"></i>
                    <strong>Uptime:</strong>
                    <span class="ml-1">{{ formatUptime(uptime) }} h</span>
                </div>
            </div>

            <div class="card shadow-custom">
                <div class="font-semibold text-xl mb-4">Activity</div>
                <DataTable :value="filteredAudits" class="p-datatable-sm" :paginator="true" :rows="5" :totalRecords="audits.length"  :sortField="'dateTime'" 
    :sortOrder="-1" 
    :emptyMessage="'No requests found'" >
                    <Column field="userAction" header="Action" sortable />
                    <Column field="dateTime" header="Date & Time" sortable>
                        <template #body="slotProps">
                            {{ formatDateTime(slotProps.data.dateTime) }}
                        </template>
                    </Column>
                </DataTable>
            </div>
        </div>

        <!-- Gráfica de regiones más utilizadas -->
        <div class="col-span-12 xl:col-span-6">
            <div class="card shadow-custom">
                <div class="font-semibold text-xl mb-2">Regions Usage</div>
                <!-- Ajustar la altura de la gráfica -->
                <Chart type="bar" :data="chartDataRegions" :options="chartOptionsAudits" class="h-96" />
            </div>
        </div>

        <!-- Gráfica de agentes más utilizados -->
        <div class="col-span-12 xl:col-span-6">
            <div class="card shadow-custom">
                <div class="font-semibold text-xl mb-2">Agents Usage</div>
                <!-- Ajustar la altura de la gráfica -->
                <Chart type="bar" :data="chartDataAgents" :options="chartOptionsAudits" class="h-96" />
            </div>
        </div>
    </div>
</template>

<style scoped>
.shadow-custom {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    border-radius: 8px; /* Opcional: redondear bordes */
}
</style>
