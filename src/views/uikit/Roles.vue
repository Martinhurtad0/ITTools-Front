<script>
import { roleService } from '@/services/RoleService';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Dialog from 'primevue/dialog';
import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';
import { ref } from 'vue';

export default {
    components: {
        InputText,
        Button,
        DataTable,
        Column,
        Dialog
    },
    setup() {
        const toast = useToast();
        const error = ref('');

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
            error
        };
    },
    data() {
        return {
            role: {
                authority: '',
                description: ''
            },
            roles: [],
            filteredRoles: [], // Usado para el filtrado de roles
            selectedRoleId: null,
            isEditDialogVisible: false,
            isCreateRoleDialogVisible: false,
            roleToChangeStatus: null,
            isActivating: false,
            editRoleData: {
                authority: '',
                description: ''
            },
            displayDeleteConfirmation: false,
            roleToDelete: null,
            displayConfirmation: false,
            searchQuery: '', // Consulta de búsqueda
            filters: {
                global: { value: null, matchMode: FilterMatchMode.CONTAINS }
            },
            showAll: false // Controla la visualización de todos los roles o solo activos
        };
    },
    async created() {
        await this.loadRoles();
    },
    methods: {
        openCreateRoleDialog() {
            this.resetForm(); // Limpia el formulario al abrir el diálogo de creación
            this.isCreateRoleDialogVisible = true;
        },
        async registerRole() {
            try {
                await roleService.registerRole(this.role);
                this.showSuccess('Role registered successfully');
                await this.loadRoles();
                this.isCreateRoleDialogVisible = false;
            } catch (err) {
                this.showError(err.message || 'Registration failed');
            }
        },
        async loadRoles() {
            try {
                this.roles = await roleService.getRoles();
                this.filterRoles(); // Aplica el filtro sin modificar showAll
            } catch (error) {
                this.showError('Error fetching roles');
                console.error('Error fetching roles:', error);
            }
        },
        resetForm() {
            this.role = {
                authority: '',
                description: ''
            };
            this.editRoleData = { ...this.role }; // Restablece el formulario de edición también
        },
        editRole(role) {
            this.editRoleData = { ...role };
            this.isEditDialogVisible = true;
        },
        confirmDeleteRole(roleId) {
            this.roleToDelete = roleId;
            this.displayDeleteConfirmation = true;
        },
        async updateRole() {
            try {
                await roleService.updateRole(this.editRoleData.id, this.editRoleData);
                this.showSuccess('Role updated successfully');
                await this.loadRoles();
                this.isEditDialogVisible = false;
            } catch (err) {
                this.showError(err.message || 'Update failed');
            }
        },
        async deleteRole() {
            try {
                await roleService.deleteRole(this.roleToDelete);
                this.showSuccess('Role deleted successfully');
                await this.loadRoles();
                this.displayDeleteConfirmation = false;
                this.roleToDelete = null;
            } catch (err) {
                // Muestra el mensaje del backend si está presente
                this.showError(err.message || 'Deletion failed');
                this.displayDeleteConfirmation = false;
            }
        },

        openConfirmation(role, isActivating) {
            this.roleToChangeStatus = { ...role, status: isActivating };
            this.isActivating = isActivating;
            this.displayConfirmation = true;
        },
        async changeRoleStatus() {
            try {
                await roleService.updateRole(this.roleToChangeStatus.id, this.roleToChangeStatus);
                this.showSuccess('Role status changed successfully');
                await this.loadRoles();
                this.displayConfirmation = false;
                this.roleToChangeStatus = null;

                // Aplica el filtro según el valor actual de showAll
                this.filterRoles();
            } catch (err) {
                this.showError(this.error || 'Status change failed');
            }
        },
        closeConfirmation() {
            this.displayConfirmation = false;
            this.roleToChangeStatus = null;
        },
        closeDeleteConfirmation() {
            this.displayDeleteConfirmation = false;
            this.roleToDelete = null;
        },
        filterRoles() {
            this.filteredRoles = this.roles.filter((role) => {
                const globalFilter = this.filters.global.value;
                if (!globalFilter) return this.showAll || role.status; // Muestra todos si showAll es true, o solo activos si false

                const roleString = `${role.authority} ${role.description}`.toLowerCase();
                return roleString.includes(globalFilter.toLowerCase()) && (this.showAll || role.status);
            });
        },
        toggleFilter() {
            this.showAll = !this.showAll; // Alterna el estado de showAll
            this.filterRoles(); // Aplica el filtro actualizado
        }
    },
    watch: {
        searchQuery() {
            this.filters.global.value = this.searchQuery;
            this.filterRoles();
        }
    }
};
</script>

<template>
    <div class="flex flex-col h-screen p-4">
        <div class="flex-2">
            <div class="card p-4 flex flex-col gap-4 h-full">
                <div class="font-semibold text-xl">Roles</div>
                <div class="flex justify-between items-center mb-2">
                    <!-- Agrupar los dos botones en un div con clase flex -->
                    <div class="flex gap-2">
                        <Button label="Create Role" icon="pi pi-plus" @click="openCreateRoleDialog" />
                        <Button label="Filter All" icon="pi pi-filter" class="p-button-secondary" @click="toggleFilter" style="background-color: rgb(104, 76, 84); border-color: rgb(104, 76, 84); color: white" />
                    </div>
                    <!-- Input de búsqueda al otro lado -->
                    <InputText v-model="searchQuery" placeholder="Global search..." class="p-inputtext p-component" />
                </div>

                <div class="overflow-x-auto">
                    <DataTable :value="filteredRoles" class="p-datatable-sm" :paginator="true" :rows="10" :rowsPerPageOptions="[5, 10, 20]" :totalRecords="filteredRoles.length" sortMode="multiple">
                        <Column field="authority" header="Name" sortable />
                        <Column field="description" header="Description" sortable />
                        <Column field="status" header="Status" sortable>
                            <template #body="{ data }">
                                <span :class="data.status ? 'text-green-500' : 'text-red-500'">{{ data.status ? 'Active' : 'Inactive' }}</span>
                            </template>
                        </Column>
                        <Column header="Actions">
                            <template #body="{ data }">
                                <Button icon="pi pi-pencil" class="p-button-rounded p-button-info p-button-text" @click="editRole(data)" />
                                <Button
                                    :icon="data.status ? 'pi pi-power-off' : 'pi pi-power-off'"
                                    :class="data.status ? 'p-button-rounded p-button-danger p-button-text' : 'p-button-rounded p-button-success p-button-text'"
                                    @click="openConfirmation(data, !data.status)"
                                />
                                <Button icon="pi pi-trash" class="p-button-rounded p-button-danger p-button-text" @click="confirmDeleteRole(data.id)" />
                            </template>
                        </Column>
                    </DataTable>
                </div>
            </div>
        </div>

        <!-- Diálogo de creación de rol -->
        <Dialog v-model:visible="isCreateRoleDialogVisible" modal header="Create Role">
            <form @submit.prevent="registerRole">
                <div class="flex gap-4">
                    <div class="flex flex-wrap gap-4">
                        <div class="flex flex-col grow basis-0 gap-2">
                            <label for="nameCreate">Name</label>
                            <InputText id="nameCreate" type="text" v-model="role.authority" class="p-inputtext-sm input-with-line" placeholder="Enter Role Name" required />
                        </div>
                        <div class="flex flex-col grow basis-0 gap-2">
                            <label for="descriptionCreate">Description</label>
                            <InputText id="descriptionCreate" type="text" v-model="role.description" class="p-inputtext-sm input-with-line" placeholder="Enter Role Description" required />
                        </div>
                    </div>
                </div>
                <!-- Contenedor para alinear el botón al final -->
                <div class="flex justify-end mt-4">
                    <Button type="submit" label="Create" class="p-button-primary" />
                </div>
            </form>
        </Dialog>

        <!-- Diálogo de edición de rol -->
        <Dialog v-model:visible="isEditDialogVisible" modal header="Edit Role">
            <form @submit.prevent="updateRole">
                <div class="flex gap-4">
                    <div class="flex flex-wrap gap-4">
                        <div class="flex flex-col grow basis-0 gap-2">
                            <label for="nameEdit">Name</label>
                            <InputText id="nameEdit" type="text" v-model="editRoleData.authority" class="p-inputtext-sm input-with-line" placeholder="Enter Role Name" required />
                        </div>
                        <div class="flex flex-col grow basis-0 gap-2">
                            <label for="descriptionEdit">Description</label>
                            <InputText id="descriptionEdit" type="text" v-model="editRoleData.description" class="p-inputtext-sm input-with-line" placeholder="Enter Role Description" required />
                        </div>
                    </div>
                </div>
                <!-- Contenedor para alinear el botón al final -->
                <div class="flex justify-end mt-4">
                    <Button type="submit" label="Save" class="p-button-primary" />
                </div>
            </form>
        </Dialog>

        <!-- Diálogo de confirmación borrar -->
        <Dialog v-model:visible="displayDeleteConfirmation" header="Delete Confirmation" modal class="max-w-sm">
            <p>Are you sure you want to delete this role?</p>
            <template #footer>
                <div class="flex justify-end gap-2">
                    <Button label="No" icon="pi pi-times" @click="closeDeleteConfirmation" class="p-button-text p-button-secondary" />
                    <Button label="Yes" icon="pi pi-check" @click="deleteRole" class="p-button-text p-button-danger" />
                </div>
            </template>
        </Dialog>

        <!-- Diálogo de confirmación inactivar-->
        <Dialog v-model:visible="displayConfirmation" header="Confirmation" modal class="max-w-sm">
            <p>Are you sure you want to proceed with this action?</p>
            <!-- Mensaje de confirmación -->
            <template #footer>
                <div class="flex justify-end gap-2">
                    <!-- Ajusta la disposición de los botones -->
                    <Button label="No" icon="pi pi-times" @click="closeConfirmation" class="p-button-text p-button-secondary" />
                    <Button label="Yes" icon="pi pi-check" @click="changeRoleStatus" class="p-button-text p-button-danger" />
                </div>
            </template>
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
