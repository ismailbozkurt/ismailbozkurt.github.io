Now I'm going to implement frontend. The implementations are going to really messy. I am going to use Vue.js and Vite. I have things in my mind for frontend. I think it would be better working with Vue.

Configure Vite (`packages/frontend/vite.config.ts`):

```typescript
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";

export default defineConfig({
  plugins: [vue(), vueDevTools()],
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
  },
});
```

### Login Page Implementation

Create Login View (`packages/frontend/src/views/LoginView.vue`):

```vue
<template>
  <div class="login-container">
    <div class="login-box">
      <h1>Welcome Back</h1>
      <p class="subtitle">Please enter your details to sign in</p>
      <form @submit.prevent="handleLogin">...</form>
    </div>
  </div>
</template>
```

Update Root App (`packages/frontend/src/App.vue`):

```vue
<template>
  <div class="app">
    <router-view />
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    Oxygen, Ubuntu, Cantarell, sans-serif;
  background-color: #1a1a1a;
  min-height: 100vh;
}
</style>
```

Configure Router (`packages/frontend/src/router/router.ts`):

```typescript
import { createRouter, createWebHistory } from "vue-router";
import LoginView from "../views/LoginView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "login",
      component: LoginView,
    },
  ],
});

export default router;
```

Main Entry Point (`packages/frontend/src/main.ts`):

```typescript
import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";

const app = createApp(App);
app.use(router);
app.mount("#app");
```

### Login Component Details (`packages/frontend/src/views/LoginView.vue`)

Component Script:

```vue
<script setup lang="ts">
import { ref } from "vue";

const email = ref("");
const password = ref("");
const rememberMe = ref(false);

const handleLogin = async () => {
  console.log("Login attempt:", {
    email: email.value,
    password: password.value,
    rememberMe: rememberMe.value,
  });
};
</script>
```

Component Styles:

```vue
<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
  background-color: #1a1a1a;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.login-box {
  background: #ffffff;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 360px;
}
/* ... other styles ... */
</style>
```

### State Management

Form State(`packages/frontend/src/views/LoginView.vue`):

```typescript
const email = ref("");
const password = ref("");
const rememberMe = ref(false);
```

Form Handling(`packages/frontend/src/views/LoginView.vue`):

```typescript
const handleLogin = async () => {
  // Form submission logic
  console.log("Login attempt:", {
    email: email.value,
    password: password.value,
    rememberMe: rememberMe.value,
  });
};
```

### Router Configuration

Setup Routes(`packages/frontend/src/router/router.ts`):

```typescript
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "login",
      component: LoginView,
    },
  ],
});
```

### App Layout

Root App Structure(`packages/frontend/src/App.vue`):

```vue
<template>
  <div class="app">
    <router-view />
  </div>
</template>
```

Global Styles:

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: system-ui, -apple-system, ...;
  background-color: #1a1a1a;
  min-height: 100vh;
}
```

### Project Structure

Final frontend structure:

```
packages/frontend/
├── src/
│   ├── App.vue                 # Root component
│   ├── main.ts                 # Application entry point
│   ├── router/
│   │   └── index.ts           # Router configuration
│   ├── views/
│   │   └── LoginView.vue      # Login page component
│   ├── assets/               # Static assets
├── vite.config.ts             # Vite configuration
├── tsconfig.json              # TypeScript configuration
└── package.json               # Project dependencies
```

After installations and configurations, Thats the view of UI.

```bash
npm run dev
```

![Login Page](https://raw.githubusercontent.com/ismailbozkurt/ismailbozkurt.github.io/refs/heads/main/public/images/frontend-running.png)
