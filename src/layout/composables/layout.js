import { computed, reactive, readonly, onMounted } from 'vue';

// Configuración inicial del layout
const layoutConfig = reactive({
    preset: 'Aura',
    primary: 'teal', 
    surface: 'soho',
    darkTheme: false,
    menuMode: 'static'
});

const layoutState = reactive({
    staticMenuDesktopInactive: false,
    overlayMenuActive: false,
    profileSidebarVisible: false,
    configSidebarVisible: false,
    staticMenuMobileActive: false,
    menuHoverActive: false,
    activeMenuItem: null
});

export function useLayout() {
    // Función para aplicar colores al DOM
    const applyColors = () => {
        document.documentElement.style.setProperty('--primary-color', layoutConfig.primary);
        document.documentElement.style.setProperty('--surface-color', layoutConfig.surface);
    };

    onMounted(() => {
        // Recuperar el modo oscuro del almacenamiento local
        const savedDarkMode = localStorage.getItem('darkTheme');
        if (savedDarkMode === 'true') {
            layoutConfig.darkTheme = true;
            document.documentElement.classList.add('app-dark');
        }

        // Recuperar los valores de primary y surface desde el localStorage
        const savedPrimary = localStorage.getItem('primary');
        if (savedPrimary) {
            layoutConfig.primary = savedPrimary;
        }

        const savedSurface = localStorage.getItem('surface');
        if (savedSurface) {
            layoutConfig.surface = savedSurface;
        }

        // Aplicar colores al montar el componente
        applyColors();
    });

    // Guardar y cambiar el color primario
    const setPrimary = (value) => {
        layoutConfig.primary = value || 'teal';
        localStorage.setItem('primary', layoutConfig.primary); // Guardar en localStorage
        applyColors(); // Aplicar colores
    };

    // Guardar y cambiar el surface
    const setSurface = (value) => {
        layoutConfig.surface = value || 'soho';
        localStorage.setItem('surface', layoutConfig.surface); // Guardar en localStorage
        applyColors(); // Aplicar colores
    };

    const setPreset = (value) => {
        layoutConfig.preset = value;
    };

    const setActiveMenuItem = (item) => {
        layoutState.activeMenuItem = item.value || item;
    };

    const setMenuMode = (mode) => {
        layoutConfig.menuMode = mode;
    };

    const toggleDarkMode = () => {
        if (!document.startViewTransition) {
            executeDarkModeToggle();
            return;
        }

        document.startViewTransition(() => executeDarkModeToggle());
    };

    const executeDarkModeToggle = () => {
        layoutConfig.darkTheme = !layoutConfig.darkTheme;
        document.documentElement.classList.toggle('app-dark');
        localStorage.setItem('darkTheme', layoutConfig.darkTheme.toString());
    };

    const onMenuToggle = () => {
        if (layoutConfig.menuMode === 'overlay') {
            layoutState.overlayMenuActive = !layoutState.overlayMenuActive;
        }

        if (window.innerWidth > 991) {
            layoutState.staticMenuDesktopInactive = !layoutState.staticMenuDesktopInactive;
        } else {
            layoutState.staticMenuMobileActive = !layoutState.staticMenuMobileActive;
        }
    };

    const resetMenu = () => {
        layoutState.overlayMenuActive = false;
        layoutState.staticMenuMobileActive = false;
        layoutState.menuHoverActive = false;
    };

    const isSidebarActive = computed(() => layoutState.overlayMenuActive || layoutState.staticMenuMobileActive);

    const isDarkTheme = computed(() => layoutConfig.darkTheme);

    const getPrimary = computed(() => layoutConfig.primary);

    const getSurface = computed(() => layoutConfig.surface);

    return {
        layoutConfig: readonly(layoutConfig),
        layoutState: readonly(layoutState),
        onMenuToggle,
        isSidebarActive,
        isDarkTheme,
        getPrimary,
        getSurface,
        setActiveMenuItem,
        toggleDarkMode,
        setPrimary,
        setSurface,
        setPreset,
        resetMenu,
        setMenuMode
    };
}
