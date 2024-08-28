<template>
    <li :class="menuItemClasses" class="layout-menuitem">
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
import { ref, computed } from 'vue';

const props = defineProps({
    item: Object,
    index: Number
});

const active = ref(false);

function toggleMenu() {
    active.value = !active.value;
}

const menuItemClasses = computed(() => ({
    'active-menuitem': active.value
}));
</script>

<style scoped>
.layout-menuitem {
    list-style: none;
}

.menu-link {
    display: flex;
    align-items: center;
    text-decoration: none;
    padding: var(--menu-link-padding, 0.75rem 1rem);
    color: var(--menu-link-color, inherit);
    width: 100%;
    transition: color 0.3s ease;
}

.menu-link:hover {
    color: var(--primary-color, teal); /* Cambiar color al pasar el mouse */
}

.menu-icon {
    font-size: var(--menu-icon-size, 1.5rem);
    margin-right: var(--menu-icon-margin-right, 1rem);
}

.menu-label {
    font-size: var(--menu-label-size, 1rem);
    margin-right: auto;
}

.layout-submenu {
    list-style: none;
    padding: 0;
    margin: 0;
    padding-left: var(--submenu-padding-left, 1rem);
}

.layout-submenu .menu-link {
    padding-left: var(--submenu-link-padding-left, 2rem);
    font-size: var(--submenu-link-size, 0.875rem);
}
</style>
