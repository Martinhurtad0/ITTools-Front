<template>
    <li :class="{'active-menuitem': active}" class="layout-menuitem">
        <a v-if="!item.items" :href="item.to" class="menu-link">
            <i :class="item.icon" class="menu-icon"></i>
            <span class="menu-label">{{ item.label }}</span>
        </a>
        <a v-else href="#" @click.prevent="toggleMenu" class="menu-link">
            <i :class="item.icon" class="menu-icon"></i>
            <span class="menu-label">{{ item.label }}</span>
            <i class="pi pi-fw pi-angle-down layout-submenu-toggler"></i>
        </a>
        <ul v-if="item.items && active" class="layout-submenu">
            <app-menu-item 
                v-for="(child, index) in item.items" 
                :key="index" 
                :item="child" 
                :index="index"
            />
        </ul>
    </li>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
    item: Object,
    index: Number
});

const active = ref(false);

function toggleMenu() {
    active.value = !active.value;
}
</script>

<style scoped>
.layout-menuitem {
    list-style: none;
}

.menu-link {
    display: flex;
    align-items: center;
    text-decoration: none;
    padding: 0.75rem 1rem;
    color: inherit;
    width: 100%;
}

.menu-icon {
    font-size: 1.5rem;
    margin-right: 1rem;
}

.menu-label {
    font-size: 1rem;
    margin-right: auto;
}

.layout-submenu {
    list-style: none;
    padding: 0;
    margin: 0;
    padding-left: 1rem;
}

.layout-submenu .menu-link {
    padding-left: 2rem;
    font-size: 0.875rem;
}
</style>
