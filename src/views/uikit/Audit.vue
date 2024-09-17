<script>
import { AuditService } from '@/services/AuditService';
import dayjs from 'dayjs';
import Button from 'primevue/button';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Calendar from 'primevue/calendar';
import Dropdown from 'primevue/dropdown';

export default {
  components: {
      DataTable,
      Column,
      Dialog,
      InputText,
      Button,
      Calendar,
      Dropdown
  },
  data() {
      return {
          audits: [], // Datos de auditorías
          searchQuery: '', // Query para búsqueda
          sortOrder: 'desc', // Ordenamiento (inicialmente descendente)
          sortColumn: 'dateTime', // Columna por la cual ordenar (fecha y hora)
          startDate: null, // Fecha de inicio para el filtro
          endDate: null, // Fecha de fin para el filtro
          selectedMethod: '', // Método seleccionado para el filtro
          methods: [
              { label: 'Create', value: 'Create' },
              { label: 'Update', value: 'Update' },
              { label: 'Delete', value: 'Delete' }
          ]
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

          return sortedAudits.filter((audit) => {
              const formattedDateTime = this.formatDateTime(audit.dateTime);
              const auditDate = dayjs(audit.dateTime);

              // Filtro de búsqueda global
              const matchesSearchQuery =
                  audit.userName.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                  audit.userAction.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                  formattedDateTime.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                  audit.userIP.toLowerCase().includes(this.searchQuery.toLowerCase());

              // Filtro por rango de fechas
              const matchesDateRange = (!this.startDate || auditDate.isAfter(dayjs(this.startDate).startOf('day'))) && (!this.endDate || auditDate.isBefore(dayjs(this.endDate).endOf('day')));

              // Filtro por método
              const matchesMethod = !this.selectedMethod || audit.userAction.toLowerCase().includes(this.selectedMethod.toLowerCase());
              return matchesSearchQuery && matchesDateRange && matchesMethod;
          });
      }
  },

  async created() {
      this.audits = await AuditService.getAllAudits();
  },
  methods: {
      formatDateTime(value) {
          return value ? dayjs(value).format('DD/MMM/YYYY HH:mm:ss') : '';
      }
  }
};
</script>


<template>
  <div class="flex flex-col h-screen p-4">
      <!-- Contenedor de la DataTable -->
      <div class="flex-2">
          <div class="card p-4 flex flex-col gap-4 h-full">
              <div class="font-semibold text-xl">Audits</div>

              <!-- Contenedor de búsqueda y filtros alineados a la derecha -->
              <div class="flex justify-between items-center mb-2">
                  <InputText v-model="searchQuery" placeholder="Global search..." class="p-inputtext p-component" />

                  <!-- Filtros de fecha -->
                  <div class="flex gap-2">
                      <Calendar v-model="startDate" placeholder="Start Date" showIcon dateFormat="dd/mm/yy" />
                      <Calendar v-model="endDate" placeholder="End Date" showIcon dateFormat="dd/mm/yy" />
                  </div>

                  <!-- Filtro por método -->
                  <div>
                      <Dropdown 
                          v-model="selectedMethod" 
                          :options="methods" 
                          optionLabel="label" 
                          optionValue="value" 
                          placeholder="Categories"
                          class="p-dropdown"
                      />
                  </div>
              </div>

              <DataTable :value="filteredAudits" class="p-datatable-sm" :paginator="true" :rows="10" :rowsPerPageOptions="[5, 10, 20]" :totalRecords="audits.length" sortMode="multiple">
                  <Column field="userName" header="User Name" sortable />
                  <Column field="userAction" header="Action" sortable />
                  <Column field="dateTime" header="Date & Time" sortable>
                      <template #body="slotProps">
                          {{ formatDateTime(slotProps.data.dateTime) }}
                      </template>
                  </Column>
                  <Column field="userIP" header="User IP" sortable />
              </DataTable>
          </div>
      </div>
  </div>
</template>

