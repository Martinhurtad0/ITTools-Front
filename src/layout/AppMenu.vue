<template>
    <ul class="layout-menu">
        <template v-for="(item, i) in model" :key="i">
            <app-menu-item v-if="!item.separator" :item="item" :index="i"></app-menu-item>
            <li v-if="item.separator" class="menu-separator"></li>
        </template>
    </ul>
</template>

<script setup>
import { ref } from 'vue';
import AppMenuItem from './AppMenuItem.vue';

const model = ref([
{
        label: 'Dashboard',
        icon: 'pi pi-fw pi-home', /* Icono para el dashboard */
        to: '/home' /* Enlace directo al dashboard */
    },
    {
        label: 'Tools',
        icon: 'pi pi-fw pi-cog', /* Icono para herramientas */
        items: [
            { label: 'Users', icon: 'pi pi-fw pi-users', to: '/uikit/users' }, /* Icono de usuarios */
            { label: 'Roles', icon: 'pi pi-fw pi-shield', to: '/uikit/Roles' }, /* Icono de roles */
            { label: 'Regions', icon: 'pi pi-fw pi-globe', to: '/uikit/RegionList' }, /* Icono de regiones */
            { label: 'Services', icon: 'pi pi-fw pi-cog', to: '/uikit/Services' }, /* Icono de servicios */
        ]
    },
    {
        label: 'Servers',
        icon: 'pi pi-fw pi-server', /* Icono para servidores */
        items: [
            { label: 'ServersDB', icon: 'pi pi-fw pi-database', to: '/uikit/ServersDB' }, /* Icono de base de datos */
            { label: 'Agents', icon: 'pi pi-fw pi-cloud', to: '/uikit/Agents' }, /* Icono de agentes */
        ]
    },
    {
        label: 'Audit',
        icon: 'pi pi-fw pi-file', /* Icono para auditoría */
        items: [
            { label: 'Audit', icon: 'pi pi-fw pi-file', to: '/uikit/Audit' } /* Icono de archivo de auditoría */
        ]
    },
]);


</script>

<style lang="scss" scoped>

.menu-separator {
    margin: 1rem ;
    border-bottom: 1px solid #ddd;
}

.layout-menu {
    padding: 0;
    margin: 0;
    list-style: none;
    margin-top: 1.5rem;
    margin-left:1rem; /* Ajusta el margen a la izquierda */
}

/* Estilo para los iconos predominantes */
.layout-menu .menu-item {
    display: flex;
    align-items: center;
    padding: 0.5rem 1rem;
    font-size: 1rem;
    color: #333;
    text-decoration: none;
}

.layout-menu .menu-item .pi {
    font-size: 1.5rem; /* Tamaño del icono */
    margin-right: 1rem; /* Espacio entre el icono y el texto */
}

.layout-menu .menu-item .menu-label {
    font-size: 1rem;
    font-weight: 500;
}
</style>

