<script>
import { AuditService } from '@/services/AuditService';
import dayjs from 'dayjs';
import Button from 'primevue/button';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';

export default {
  components: {
    DataTable,
    Column,
    Dialog,
    InputText,
    Button,
  },
  data() {
    return {
      audits: [], // Datos de auditorías
      searchQuery: '', // Query para búsqueda
      sortOrder: 'desc', // Ordenamiento (inicialmente descendente)
      sortColumn: 'dateTime', // Columna por la cual ordenar (fecha y hora)
    };
  },
  computed: {
    filteredAudits() {
      let sortedAudits = this.audits.slice().sort((a, b) => {
        let valueA, valueB;
        
        if (this.sortColumn === 'dateTime') {
          valueA = dayjs(a.dateTime);
          valueB = dayjs(b.dateTime);
        } else {
          valueA = a[this.sortColumn].toLowerCase();
          valueB = b[this.sortColumn].toLowerCase();
        }

        if (this.sortOrder === 'asc') {
          return valueA > valueB ? 1 : -1;
        } else {
          return valueA < valueB ? 1 : -1;
        }
      });

      return sortedAudits.filter(audit => {
        const formattedDateTime = this.formatDateTime(audit.dateTime);
        return (
          audit.userName.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          audit.userAction.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          formattedDateTime.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          audit.userIP.toLowerCase().includes(this.searchQuery.toLowerCase())
        );
      });
    },
  },
  async created() {
    this.audits = await AuditService.getAllAudits();
  },
  methods: {
    formatDateTime(value) {
      return value ? dayjs(value).format('DD/MMM/YYYY HH:mm:ss') : '';
    },
  },
};
</script>


<template>
  <div class="flex flex-col h-screen p-4">
    <!-- Contenedor de la DataTable -->
    <div class="flex-2">
      <div class="card p-4 flex flex-col gap-4 h-full">
        <div class="font-semibold text-xl">Audits</div>

        <!-- Contenedor de búsqueda alineado a la derecha -->
        <div class="flex justify-between items-center mb-2">
          <InputText v-model="searchQuery" placeholder="Global search..." class="p-inputtext p-component" />
        </div>
       
        <DataTable :value="filteredAudits" class="p-datatable-sm" :paginator="true" :rows="10" :rowsPerPageOptions="[5, 10, 20]" :totalRecords="audits.length" sortMode="multiple">
          <Column field="userName" header="User Name" sortable>
          </Column>
          <Column field="userAction" header="Action" sortable>
          </Column>
          <Column field="dateTime" header="Date & Time" sortable>
            <template #body="slotProps">
              {{ formatDateTime(slotProps.data.dateTime) }}
            </template>
          </Column>
          <Column field="userIP" header="User IP" sortable>
          </Column>
        </DataTable>
      </div>
    </div>
  </div>
</template>
