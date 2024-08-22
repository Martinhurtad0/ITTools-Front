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
      sortOrder: 'asc', // Ordenamiento (ascendente o descendente)
      sortColumn: 'dateTime', // Columna por la cual ordenar
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
    sortByColumn(column) {
      if (this.sortColumn === column) {
        this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
      } else {
        this.sortColumn = column;
        this.sortOrder = 'asc';
      }
    },
    getSortIcon(column) {
      if (this.sortColumn === column) {
        return this.sortOrder === 'asc' ? 'pi pi-arrow-up' : 'pi pi-arrow-down';
      }
      return '';
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
          <Button label="Filter" icon="pi pi-filter" class="p-button-secondary" @click="toggleSortOrder" />
          <InputText v-model="searchQuery" placeholder="Search..." class="p-inputtext p-component" />
        </div>
       
        <DataTable :value="filteredAudits" class="p-datatable-sm" :paginator="true" :rows="5" :rowsPerPageOptions="[5, 10, 20]" :totalRecords="audits.length">
          <Column field="userName" header="User Name" sortable>
            <template #header>
              <span @click="sortByColumn('userName')" class="cursor-pointer">
                User Name <i :class="getSortIcon('userName')"></i>
              </span>
            </template>
          </Column>
          <Column field="userAction" header="Action" sortable>
            <template #header>
              <span @click="sortByColumn('userAction')" class="cursor-pointer">
                Action <i :class="getSortIcon('userAction')"></i>
              </span>
            </template>
          </Column>
          <Column field="dateTime" header="Date & Time" sortable>
            <template #header>
              <span @click="sortByColumn('dateTime')" class="cursor-pointer">
               
              </span>
            </template>
            <template #body="slotProps">
              {{ formatDateTime(slotProps.data.dateTime) }}
            </template>
          </Column>
          <Column field="userIP" header="User IP" sortable>
            <template #header>
              <span @click="sortByColumn('userIP')" class="cursor-pointer">
              
              </span>
            </template>
          </Column>
        </DataTable>
      </div>
    </div>
  </div>
</template>
