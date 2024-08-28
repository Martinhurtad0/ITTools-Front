<script>
import { regionService } from '@/services/RegionService';
import { FilterMatchMode } from '@primevue/core/api';
import Button from 'primevue/button';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import { useToast } from 'primevue/usetoast';

export default {
    components: {
        InputText,
        Button,
        DataTable,
        Column,
        Dialog,
    },
    setup() {
        const toast = useToast();

        const showSuccess = (detail) => {
            toast.add({ severity: 'success', summary: 'Success', detail, life: 3000 });
        };

        const showError = (detail) => {
            toast.add({ severity: 'error', summary: 'Error', detail, life: 3000 });
        };

        return {
            toast,
            showSuccess,
            showError,
        };
    },
    data() {
        return {
            region: {
                nameRegion: '',
                description: '',
                status: 1
            },
            regions: [],
            filteredRegions: [],
            searchQuery: '',
            filters: {
                global: { value: null, matchMode: FilterMatchMode.CONTAINS }
            },
            isEditDialogVisible: false,
            isRegionDialogVisible: false,
            isShowDialogVisible: false,
            editRegionData: {
                idRegion: null,
                nameRegion: '',
                description: '',
                status: 1
            },
            displayConfirmation: false,
            regionToChangeStatus: null,
            isActivating: false,
            detailRegionData: {},
            filterActiveOnly: true,
            displayDeleteConfirmation: false,
            regionToDelete: null,
        };
    },
    async created() {
        await this.loadRegions();
        this.applyFilter();
    },
    methods: {
        async loadRegions() {
            try {
                this.regions = await regionService.getAllRegions();
                this.applyFilter();
            } catch (error) {
                this.showError('Error fetching regions');
                console.error('Error fetching regions:', error);
            }
        },
        async registerRegion() {
            try {
                await regionService.createRegion(this.region);
                this.showSuccess('Region created successfully');
                await this.loadRegions();
                this.resetForm();
                this.isRegionDialogVisible = false; // Cerrar el diálogo después de la creación
            } catch (err) {
                const errorMessage = err.response && err.response.status === 409
                    ? err.response.data
                    : err.message || 'Creation failed';
                this.showError(errorMessage);
                this.isRegionDialogVisible = false; // Cerrar el diálogo
            }
        },
        resetForm() {
            this.region = {
                nameRegion: '',
                description: '',
                status: 1
            };
        },
        editRegion(region) {
            this.editRegionData = { ...region };
            this.isEditDialogVisible = true;
        },
        async updateRegion() {
            try {
                await regionService.updateRegion(this.editRegionData.idRegion, this.editRegionData);
                this.showSuccess('Region updated successfully');
                await this.loadRegions();
                this.isEditDialogVisible = false;
            } catch (err) {
                this.showError(err.message || 'Update failed');
            }
        },
        openConfirmation(region, isActivating) {
            this.regionToChangeStatus = region;
            this.isActivating = isActivating;
            this.displayConfirmation = true;
        },
        openCreateRegionDialog() {
            this.resetForm();
            this.isRegionDialogVisible = true;
        },
        openDeleteConfirmation(region) {
            this.regionToDelete = region;
            this.displayDeleteConfirmation = true; // Mostrar el diálogo de confirmación
        },
        async deleteRegion() {
            if (!this.regionToDelete || this.regionToDelete.idRegion == null) {
                this.showError('Region ID is missing');
                return;
            }

            try {
                const response = await regionService.deleteRegion(this.regionToDelete.idRegion);

                if (response.status === 409) { // Supongamos que el backend devuelve 409 si la región está en uso
                    this.showError('Cannot delete region: it is currently assigned to a server or agent.');
                } else {
                    this.showSuccess('Region deleted successfully');
                    await this.loadRegions(); // Recargar las regiones para reflejar los cambios
                    this.displayDeleteConfirmation = false; // Cerrar el diálogo de confirmación
                    this.regionToDelete = null; // Limpiar la región a eliminar
                }
            } catch (error) {
                this.showError(error.response?.data || 'Deletion failed');
                this.displayDeleteConfirmation = false; // Cerrar el diálogo de confirmación
            }
        },
        closeDeleteConfirmation() {
            this.displayDeleteConfirmation = false;
            this.regionToDelete = null;
        },
        showRegionDetails(region) {
            this.detailRegionData = { ...region };
            this.isShowDialogVisible = true;
        },
        async changeRegionStatus() {
            if (!this.regionToChangeStatus || this.regionToChangeStatus.idRegion == null) {
                this.showError('Region ID is missing');
                return;
            }

            try {
                await regionService.updateRegionStatus(this.regionToChangeStatus.idRegion, this.isActivating ? 1 : 0);
                this.showSuccess(`Region ${this.isActivating ? 'activated' : 'deactivated'} successfully`);
                await this.loadRegions();
                this.displayConfirmation = false;
                this.regionToChangeStatus = null;
            } catch (err) {
                this.showError(err.message || 'Status change failed');
            }
        },
        closeConfirmation() {
            this.displayConfirmation = false;
            this.userToChangeStatus = null;
        },
        applyFilter() {
            this.filteredRegions = this.regions.filter(region => {
                const globalFilter = this.filters.global.value;
                const isActive = this.filterActiveOnly ? region.status === 1 : true;

                if (!globalFilter) {
                    return isActive;
                }

                const regionString = `${region.nameRegion} ${region.description}`.toLowerCase();
                return isActive && regionString.includes(globalFilter.toLowerCase());
            });
        },
        toggleFilter() {
            this.filterActiveOnly = !this.filterActiveOnly;
            this.applyFilter();
        }
    },
    watch: {
        searchQuery() {
            this.filters.global.value = this.searchQuery;
            this.applyFilter();
        }
    }
};
</script>



<template>
     <div class="flex flex-col h-screen p-4">
        <div class="flex-2">
            <div class="card p-4 flex flex-col gap-4 h-full">
                <div class="font-semibold text-xl">Regions</div>
                <div class="flex justify-between items-center mb-2">
                    <div class="flex gap-2">
                        <Button label="Create Region" icon="pi pi-plus" @click="openCreateRegionDialog" class="p-button-success" />
                        <Button label="Filter All" icon="pi pi-filter" @click="toggleFilter" class="p-button-secondary" />
                    </div>
                    <InputText v-model="searchQuery" placeholder="Global search..." class="p-inputtext p-component" />
                </div>
                <div class="table-container">
                    <DataTable 
                        :value="filteredRegions" 
                        class="p-datatable-sm" 
                        :paginator="true" 
                        :rows="10" 
                        :rowsPerPageOptions="[5, 10, 20]" 
                        :totalRecords="regions.length"
                        sortMode="multiple"
                    >
                        <Column 
                            field="nameRegion" 
                            header="Name" 
                            sortable 
                        />
                        <Column 
                            field="description" 
                            header="Description" 
                            sortable 
                        />
                        <Column 
                            field="status" 
                            header="Status" 
                            sortable
                        >
                            <template #body="{ data }">
                                <span :class="data.status ? 'text-green-500' : 'text-red-500'">
                                    {{ data.status ? 'Active' : 'Inactive' }}
                                </span>
                            </template>
                        </Column>
                        <Column header="Actions">
                            <template #body="{ data }">
                                <Button icon="pi pi-eye" class="p-button-rounded p-button-success p-button-text" @click="showRegionDetails(data)" />
                                <Button icon="pi pi-pencil" class="p-button-rounded p-button-info p-button-text" @click="editRegion(data)" />
                                <Button
                                    :icon="data.status ? 'pi pi-power-off' : 'pi pi-power-off'"
                                    :class="data.status ? 'p-button-rounded p-button-danger p-button-text' : 'p-button-rounded p-button-success p-button-text'"
                                    @click="openConfirmation(data, !data.status)"
                                />
                                <Button icon="pi pi-trash" class="p-button-rounded p-button-danger p-button-text" @click="openDeleteConfirmation(data)" />
                            </template>
                        </Column>
                    </DataTable>
                </div>
            </div>
        </div>
        
      

        <!-- Diálogo de confirmación eliminar -->
        <Dialog v-model:visible="displayDeleteConfirmation" header="Delete Confirmation" modal class="max-w-sm">
            <p>Are you sure you want to delete this region?</p>
            <template #footer>
                <div class="flex justify-end gap-2">
                    <Button label="No" icon="pi pi-times" @click="closeDeleteConfirmation" class="p-button-text p-button-secondary" />
                    <Button label="Yes" icon="pi pi-check" @click="deleteRegion" class="p-button-text p-button-danger" />
                </div>
            </template>
        </Dialog>
   
        
      <Dialog v-model:visible="displayConfirmation" header="Confirmation" modal class="max-w-sm">
            <p>Are you sure you want to proceed with this action?</p>
            <template #footer>
                <div class="flex justify-end gap-2">
                    <Button label="No" icon="pi pi-times" @click="closeConfirmation" class="p-button-text p-button-secondary" />
                    <Button label="Yes" icon="pi pi-check" @click="changeRegionStatus" class="p-button-text p-button-danger" />
                </div>
            </template>
        </Dialog>
     

        <!-- Diálogo de creación de región -->
        <Dialog v-model:visible="isRegionDialogVisible" modal header="Create Region">
            <form @submit.prevent="registerRegion">
                <div class="flex gap-4">
                    <div class="flex flex-wrap gap-4">
                        <div class="flex flex-col grow basis-0 gap-2">
                            <label for="nameCreate">Name</label>
                            <InputText id="nameCreate" type="text" v-model="region.nameRegion" class="p-inputtext-sm input-with-line" placeholder="Enter name" required />
                        </div>
                        <div class="flex flex-col grow basis-0 gap-2">
                            <label for="descriptionCreate">Description</label>
                            <InputText id="descriptionCreate" type="text" v-model="region.description" class="p-inputtext-sm input-with-line" placeholder="Enter description" required />
                        </div>
                    </div>
                </div>
                <Button type="submit" label="Create" class="p-button-primary mt-3" />
            </form>
        </Dialog>
     

        <!-- Diálogo de detalles de región -->
        <Dialog v-model:visible="isShowDialogVisible" header="Region Details" modal :style="{ 'max-width': '20vw', width: '20vw' }"> 
            <div v-if="detailRegionData" class="flex flex-col gap-4">
                <p><strong>Name:</strong> {{ detailRegionData.nameRegion }}</p>
                <p><strong>Description:</strong> {{ detailRegionData.description }}</p>
                <p><strong>Status:</strong> <span :class="detailRegionData.status ? 'text-green-500' : 'text-red-500'">{{ detailRegionData.status ? 'Active' : 'Inactive' }}</span></p>
            </div>
        </Dialog>

       

        <!-- Diálogo de edición de región -->
        <Dialog v-model:visible="isEditDialogVisible" modal header="Edit Region">
            <form @submit.prevent="updateRegion">
                <div class="flex gap-4">
                    <div class="flex flex-wrap gap-4">
                        <div class="flex flex-col grow basis-0 gap-2">
                            <label for="nameEdit">Name</label>
                            <InputText id="nameEdit" type="text" v-model="editRegionData.nameRegion" class="p-inputtext-sm input-with-line" placeholder="Enter name" required />
                        </div>
                        <div class="flex flex-col grow basis-0 gap-2">
                            <label for="descriptionEdit">Description</label>
                            <InputText id="descriptionEdit" type="text" v-model="editRegionData.description" class="p-inputtext-sm input-with-line" placeholder="Enter description" required />
                        </div>
                    </div>
                </div>
                <Button type="submit" label="Save" class="p-button-primary mt-3" />
            </form>
        </Dialog>
        </div>
   
</template>

<style scoped>
.input-with-line {
    border: none;
    border-bottom: 1px solid #d1d5db; /* Línea de color gris claro */
    padding: 0.5rem 0.4rem; /* Ajustar el padding vertical */
    background: transparent; /* Fondo transparente */
    outline: none; /* Eliminar el borde de enfoque predeterminado */
    box-shadow: none; /* Eliminar la sombra del campo de entrada */
}

/* Opcional: para añadir algo de espacio debajo del input */
.input-with-line {
    margin-bottom: 0.5rem; /* Espacio debajo del campo de entrada */
}
</style>
