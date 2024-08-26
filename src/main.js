import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import vue3GoogleLogin from 'vue3-google-login';
import Aura from '@primevue/themes/aura';
import PrimeVue from 'primevue/config';
import ConfirmationService from 'primevue/confirmationservice';
import ToastService from 'primevue/toastservice';

const CLIENT_ID = "45560386020-p8mrmnc39q2v6v6e55ddmmb8gmffvmih.apps.googleusercontent.com";

import '@/assets/styles.scss';
import '@/assets/tailwind.css';

const app = createApp(App);

app.use(vue3GoogleLogin, {
    clientId: CLIENT_ID,
});

app.use(router);
app.use(PrimeVue, {
    theme: {
        preset: Aura,
        options: {
            darkModeSelector: '.app-dark'
        }
    }
});
app.use(ToastService);
app.use(ConfirmationService);

app.mount('#app');
