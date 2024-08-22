<script setup>
import FloatingConfigurator from '@/components/FloatingConfigurator.vue';
import { ref } from 'vue';
import { authService } from '@/services/AuthService';
import { useRouter } from 'vue-router';
import { GoogleLogin } from 'vue3-google-login';

const email = ref('');
const password = ref('');
const router = useRouter();

const handleLogin = async () => {
  try {
    const { token } = await authService.login(email.value, password.value);
    if (token) {
      router.push('/home');
    } else {
      throw new Error('Token not found');
    }
  } catch (error) {
    console.error('Login failed:', error);
    alert('Login failed: ' + (error.message || 'Invalid credentials'));
  }
};

const callback = async (response) => {
  try {
    const googleToken = response.credential;
    const { token } = await authService.loginWithGoogle(googleToken);
    if (token) {
      router.push('/home');
    } else {
      throw new Error('Token not found');
    }
  } catch (error) {
    console.error('Google login failed:', error);
    alert('Google login failed: ' + (error.message || 'Invalid credentials'));
  }
};
</script>

<template>
  <FloatingConfigurator />
  <div class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-[100vw] overflow-hidden">
    <div class="flex flex-col items-center justify-center">
      <div style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)">
        <div class="w-full bg-surface-0 dark:bg-surface-900 py-20 px-8 sm:px-20" style="border-radius: 53px">
          <div class="text-center mb-8">
            <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">Welcome to ITTools</div>
            <span class="text-muted-color font-medium">Sign in to continue</span>
          </div>
          <!-- Formulario de inicio de sesión -->
          <form @submit.prevent="handleLogin" class="flex flex-col items-center">
            <div class="w-full">
              <!-- Campo de email -->
              <label for="email1" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Email</label>
              <InputText 
                id="email1" 
                type="text" 
                placeholder="Email address" 
                class="w-full md:w-[30rem] mb-4" 
                v-model="email" 
              />

              <!-- Campo de contraseña -->
              <label for="password1" class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2">Password</label>
              <Password 
                id="password1" 
                v-model="password" 
                placeholder="Password" 
                :toggleMask="true" 
                class="mb-4" 
                fluid 
                :feedback="false" 
              />


              <!-- Botón de inicio de sesión -->
              <Button 
                label="Sign In" 
                type="submit" 
                class="w-full mb-4"
              />
            </div>
          </form>

          <!-- Sección para inicio de sesión con Google -->
          <div class="flex flex-col items-center">
            <div>
              <GoogleLogin 
                :callback="callback" 
                auto-login 
                class="mt-4" 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pi-eye {
  transform: scale(1.6);
  margin-right: 1rem;
}

.pi-eye-slash {
  transform: scale(1.6);
  margin-right: 1rem;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  background-color: var(--primary-color);
  color: #fff;
  cursor: pointer;
}

.btn-primary {
  background-color: var(--primary-color);
}
</style>