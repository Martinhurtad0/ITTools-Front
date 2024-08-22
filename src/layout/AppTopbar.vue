<script setup>
import { useLayout } from '@/layout/composables/layout';
import { useRouter } from 'vue-router'; // Importa useRouter para redireccionar
import AppConfigurator from './AppConfigurator.vue';
import logo from '@/assets/emida-logo-square.png'; // Importa la imagen

const { onMenuToggle, toggleDarkMode, isDarkTheme } = useLayout();
const router = useRouter();

const logout = () => {
  localStorage.removeItem('token');
  router.push('/'); // Redirige al usuario a la página de inicio de sesión
};
</script>

<template>
  <div class="layout-topbar">
    <div class="layout-topbar-logo-container">
      <router-link to="/home" class="layout-topbar-logo">
        <img :src="logo" alt="Logo" width="150px" /> <!-- Usa la imagen importada -->
      </router-link>
    </div>

    <button class="layout-menu-button layout-topbar-action" @click="onMenuToggle">
      <i class="pi pi-bars"></i>
    </button>

    <div class="layout-topbar-actions">
      <div class="layout-config-menu">
        <button type="button" class="layout-topbar-action" @click="toggleDarkMode">
          <i :class="['pi', { 'pi-moon': isDarkTheme, 'pi-sun': !isDarkTheme }]"></i>
        </button>
        <div class="relative">
          <button
            v-styleclass="{ selector: '@next', enterFromClass: 'hidden', enterActiveClass: 'animate-scalein', leaveToClass: 'hidden', leaveActiveClass: 'animate-fadeout', hideOnOutsideClick: true }"
            type="button"
            class="layout-topbar-action layout-topbar-action-highlight"
          >
            <i class="pi pi-palette"></i>
          </button>
          <AppConfigurator />
        </div>
      </div>

      <button
        class="layout-topbar-menu-button layout-topbar-action"
        v-styleclass="{ selector: '@next', enterFromClass: 'hidden', enterActiveClass: 'animate-scalein', leaveToClass: 'hidden', leaveActiveClass: 'animate-fadeout', hideOnOutsideClick: true }"
      >
        <i class="pi pi-ellipsis-v"></i>
      </button>

      <div class="layout-topbar-menu hidden lg:block">
        <div class="layout-topbar-menu-content">
          <button type="button" class="layout-topbar-action">
            <i class="pi pi-calendar"></i>
            <span>Calendar</span>
          </button>
          <button type="button" class="layout-topbar-action">
            <i class="pi pi-inbox"></i>
            <span>Messages</span>
          </button>
          <button type="button" class="layout-topbar-action">
            <i class="pi pi-user"></i>
            <span>Profile</span>
          </button>
        </div>
      </div>

      <!-- Botón de Logout -->
      <button type="button" class="layout-topbar-action" @click="logout">
        <i class="pi pi-power-off"></i>
        <span>Logout</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
/* Puedes agregar estilos aquí si es necesario */
</style>
