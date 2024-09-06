<template>
    <ul class="layout-menu">
        <template v-for="(item, i) in model" :key="item.label">
            <app-menu-item v-if="!item.separator" :item="item" :index="i" />
            <li v-if="item.separator" class="menu-separator"></li>
        </template>
    </ul>
</template>

<script setup>
import { ref } from 'vue';
import AppMenuItem from './AppMenuItem.vue';

const model = ref([
    {
        label: 'Home',
        icon: 'pi pi-fw pi-home',
        to: '/home'
    },
    {
        label: 'Tools',
        icon: 'pi pi-fw pi-cog',
        items: [
            { label: 'Users', icon: 'pi pi-fw pi-users', to: '/uikit/Users' },
            { label: 'Roles', icon: 'pi pi-fw pi-shield', to: '/uikit/Roles' },
            { label: 'Regions', icon: 'pi pi-fw pi-globe', to: '/uikit/RegionList' },
            { label: 'Services', icon: 'pi pi-fw pi-cog', to: '/uikit/Services' }
        ]
    },
    {
        label: 'Servers',
        icon: 'pi pi-fw pi-server',
        items: [
            { label: 'ServersDB', icon: 'pi pi-fw pi-database', to: '/uikit/ServersDB' },
            { label: 'Agents', icon: 'pi pi-fw pi-cloud', to: '/uikit/Agents' }
        ]
    },
    {
        label: 'Logs',
        icon: 'pi pi-fw pi-folder', // Icono actualizado para Logs
        items: [
            { label: 'Find Log Transactions', icon: 'pi pi-fw pi-search', to: '/uikit/FindLogTran' },
            { label: 'Log Transfer', icon: 'pi pi-fw pi-share-alt', to: '/uikit/LogTran' },
            { label: 'Find in a log file', icon: 'pi pi-fw pi-search-plus', to: '/uikit/FindLog' },
            { label: 'Archive logs', icon: 'pi pi-fw pi-clock', to: '/uikit/ArchiveLog' }
        ]
    },
    {
        label: 'Audit',
        icon: 'pi pi-fw pi-chart-line', // Icono actualizado para Audit
        to: '/uikit/Audit'
    },
]);
</script>

<style lang="scss" scoped>
.layout-menu {
    padding: 0;
    margin: 0;
    list-style: none;
    margin-top: 7%;
    margin-left: 5%;
}
</style>
