<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import ActuatorService from '@/services/ActuatorService';
import { regionService } from '@/services/RegionService';
import { serverService } from '@/services/AgentService';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js';

// Registro de componentes necesarios para Chart.js
ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

// Variables reactivas
const status200 = ref(0);
const status400 = ref(0);
const status404 = ref(0);
const status500 = ref(0);
const lastUpdated200 = ref('');
const lastUpdated400 = ref('');
const lastUpdated404 = ref('');
const lastUpdated500 = ref('');
const requests = ref([]);
const lastUpdated = ref('');
const healthInfo = ref({});
const uptime = ref(0);
const audits = ref([]);  // Aquí se almacenan los datos de auditoría
const filteredAudits = ref([]); // Datos filtrados de auditoría

// Variables para los gráficos
const regionCounts = ref({});  // Contador de uso por regiones
const agentCounts = ref({});   // Contador de uso por agentes
const regions = ref([]);       // Lista de regiones disponibles
const agents = ref([]);        // Lista de agentes disponibles
const chartDataRegions = ref(null);  // Datos para gráfica de regiones
const chartDataAgents = ref(null);   // Datos para gráfica de agentes
const chartOptionsAudits = ref(null);  // Opciones comunes para gráficos

// Función para obtener regiones y agentes
async function fetchRegionAndAgentData() {
    try {
        regions.value = await regionService.getAllRegions();
        agents.value = await serverService.getAllServers();  // Obtener servidores (agentes)
    } catch (error) {
        console.error('Error al obtener datos de regiones o agentes:', error);
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
    await fetchRegionAndAgentData();  // Obtener nombres de regiones y agentes
    await fetchData();  // Obtener datos generales
    const interval = setInterval(updateUptime, 1000);  // Actualiza uptime cada segundo
    onUnmounted(() => clearInterval(interval));  // Limpiar intervalo al desmontar
    await fetchAuditData();  // Llamar a la función para obtener los datos de auditoría
});

// Función para analizar los mensajes de auditoría
function parseAuditMessage(userAction = '') {
    if (typeof userAction !== 'string') {
        console.error('El mensaje no es una cadena válida:', userAction);
        return {
            regionId: null,
            agentId: null,
        };
    }

    // Usar expresiones regulares para encontrar los IDs de región y agente
    const regionMatch = userAction.match(/Region ID: (\d+)/i);
    const agentMatch = userAction.match(/Agent ID: (\d+)/i);

    // Si no se encuentra el ID de región o agente, retornamos null
    return {
        regionId: regionMatch ? parseInt(regionMatch[1]) : null,
        agentId: agentMatch ? parseInt(agentMatch[1]) : null,
    };
}


// Función para obtener y filtrar los datos de auditoría
async function fetchAuditData() {
    try {
        const response = await ActuatorService.getAuditData();
        audits.value = response.data;  // Almacenar los datos de auditoría
        filteredAudits.value = audits.value;  // Filtro de auditoría si se requiere

        processAuditData();  // Procesar los datos de auditoría
    } catch (error) {
        console.error('Error al obtener los datos de auditoría:', error);
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
            console.error('El registro de auditoría no contiene un campo userAction válido:', audit);
            return;
        }

        // Desglosar el campo userAction para obtener los IDs de región y agente
        const parsedData = parseAuditMessage(audit.userAction);

        // Contar regiones
        if (parsedData.regionId !== null) {
            const regionName = getRegionNameById(parsedData.regionId);  // Obtener el nombre de la región

            // Inicializa el contador si es la primera vez que aparece la región
            if (!regionCountMap[regionName]) {
                regionCountMap[regionName] = 0;
            }
            regionCountMap[regionName]++;
        }

        // Contar agentes
        if (parsedData.agentId !== null) {
            const agentName = getAgentNameById(parsedData.agentId);  // Obtener el nombre del agente

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



// Función para configurar los datos del gráfico de auditoría
function setAuditChartData(counts, label) {
    return {
        labels: Object.keys(counts),
        datasets: [
            {
                type: 'bar',
                label: `Usage of ${label}`,
                backgroundColor: '#25e4b4',
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

// Opciones del gráfico de auditoría
chartOptionsAudits.value = {
    responsive: true,
    plugins: {
        legend: {
            position: 'top'
        },
        title: {
            display: true,
            text: 'Most Used Regions and Agents'
        }
    }
};

// Función para obtener datos generales
async function fetchData() {
    try {
        const responseData = await ActuatorService.getRequest();
        const response = await ActuatorService.getHealth();
        healthInfo.value = response;
        requests.value = responseData;
        uptime.value = Math.floor(await ActuatorService.getUptime());

        const currentDate = new Date().toLocaleString();
        status200.value = requests.value.filter((request) => request.statusCode === 200).length;
        lastUpdated200.value = currentDate;
        status400.value = requests.value.filter((request) => request.statusCode === 400).length;
        lastUpdated400.value = currentDate;
        status404.value = requests.value.filter((request) => request.statusCode === 404).length;
        lastUpdated404.value = currentDate;
        status500.value = requests.value.filter((request) => request.statusCode === 500).length;
        lastUpdated500.value = currentDate;
        lastUpdated.value = currentDate;
    } catch (error) {
        console.error('Error al obtener los datos:', error);
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
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0 bg-green-100">
                <div class="flex justify-between mb-4">
                    <div>
                        <span class="block text-muted-color font-medium mb-4">200 Response</span>
                        <div class="text-surface-900 font-medium text-xl">{{ status200 }}</div>
                        <div class="text-gray-600">Updated: {{ lastUpdated200 }}</div>
                        <!-- Cambiado aquí -->
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
                        <div class="text-gray-600">Updated: {{ lastUpdated404 }}</div>
                        <!-- Cambiado aquí -->
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
                        <div class="text-gray-600">Updated: {{ lastUpdated400 }}</div>
                        <!-- Cambiado aquí -->
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
                        <div class="text-gray-600">Updated: {{ lastUpdated500 }}</div>
                        <!-- Cambiado aquí -->
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
                <DataTable :value="requests" :rows="6" :paginator="true" responsiveLayout="scroll" >
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

            <div class="card">
                <div class="font-semibold text-xl mb-4">Activity</div>
                <DataTable :value="filteredAudits" class="p-datatable-sm" :paginator="true" :rows="5" :rowsPerPageOptions="[5, 10, 20]" :totalRecords="audits.length" sortMode="multiple">
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
            <div class="card">
                <div class="font-semibold text-xl mb-2">Regions Usage</div>
                <!-- Aquí usamos chartDataRegions, que ahora contiene los nombres de las regiones -->
                <Chart type="bar" :data="chartDataRegions" :options="chartOptionsAudits" class="h-70" />
            </div>
        </div>

        <!-- Gráfica de agentes más utilizados -->
        <div class="col-span-12 xl:col-span-6">
            <div class="card">
                <div class="font-semibold text-xl mb-2">Agents Usage</div>
                <!-- Aquí usamos chartDataAgents, que ahora contiene los nombres de los agentes -->
                <Chart type="bar" :data="chartDataAgents" :options="chartOptionsAudits" class="h-70" />
            </div>
        </div>
    </div>
</template>

<style scoped></style>
