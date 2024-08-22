import AppLayout from '@/layout/AppLayout.vue';
import Login from '@/views/pages/auth/Login.vue';
import { createRouter, createWebHistory } from 'vue-router';
import { authService } from '@/services/AuthService'; // Asegúrate de importar tu servicio de autenticación

const routes = [
    {
        path: '/',
        name: 'login',
        component: Login,
        meta: { guest: true } // Añadir meta para identificar rutas de invitados
    },
    {
        path: '/',
        component: AppLayout,
        children: [
            {
                path: '/home',
                name: 'dashboard',
                component: () => import('@/views/Dashboard.vue'),
                meta: { requiresAuth: true }
            },
            {
                path: '/uikit/users',
                name: 'formlayout',
                component: () => import('@/views/uikit/Users.vue'),
                meta: { requiresAuth: true }
            },
            {
                path: '/uikit/RegionList',
                name: 'RegionList',
                component: () => import('@/views/uikit/RegionList.vue'),
                meta: { requiresAuth: true }
            },
            {
                path: '/uikit/ServersDB',
                name: 'ServersDB',
                component: () => import('@/views/uikit/ServersDB.vue'),
                meta: { requiresAuth: true }
            },
            {
                path: '/uikit/Agents',
                name: 'Agents',
                component: () => import('@/views/uikit/Agents.vue'),
                meta: { requiresAuth: true }
            },
            {
                path: '/uikit/Services',
                name: 'Services',
                component: () => import('@/views/uikit/Services.vue'),
                meta: { requiresAuth: true }
            },
            {
                path: '/uikit/Roles',
                name: 'Roles',
                component: () => import('@/views/uikit/Roles.vue'),
            },
            {
                path: '/uikit/Audit',
                name: 'Audit',
                component: () => import('@/views/uikit/Audit.vue'),
                meta: { requiresAuth: true }
            },
        ]
    },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

// Route guard to check authentication
router.beforeEach(async (to, from, next) => {
    const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
    const isAuthenticated = !!authService.getToken(); // Check if token exists
    const isGuestRoute = to.matched.some(record => record.meta.guest);

    if (requiresAuth && !isAuthenticated) {
        // Redirect to login if not authenticated and route requires authentication
        next('/');
    } else if (isAuthenticated && to.path === '/') {
        // Redirect to home if authenticated and trying to access login page
        next('/home');
    } else {
        // Proceed to route
        next();
    }
});

export default router;
