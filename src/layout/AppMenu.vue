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
        label: 'Home',
        items: [{ label: 'Dashboard', icon: 'pi pi-fw pi-home', to: '/home' }]
    },
    {
        label: 'UI Components',
        items: [
            { label: 'Users', icon: 'pi pi-fw pi-id-card', to: '/uikit/users' },
            { label: 'Roles', icon: 'pi pi-fw pi-id-card', to: '/uikit/Roles' },
            { label: 'Regions', icon: 'pi pi-globe', to: '/uikit/RegionList' },
          
        ]
    },
    {
        label: 'Servers',
        items: [
            { label: 'ServersDB', icon: 'pi pi-database', to: '/uikit/ServersDB' },
            { label: 'Agents', icon: 'pi pi-database', to: '/uikit/Agents' },
        ]
    },
    {
        label: 'Audit',
        items: [
            { label: 'Audit', icon: 'pi pi-file', to: '/uikit/Audit' },
        ]
    },
    {
        label: 'Services',
        items: [
            { label: 'Services', icon: 'pi pi-cog', to: '/uikit/Services' },
        ]
    }
]);
</script>

<style lang="scss" scoped>
.layout-menu {
    padding: 0;
    margin: 0;
    list-style: none;
}

.menu-separator {
    margin: 1rem 0;
    border-bottom: 1px solid #ddd;
}
</style>
