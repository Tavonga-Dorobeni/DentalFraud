import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import { router } from "./router";
import { useAuthStore } from "./stores/auth.store";
import "./assets/styles/main.css";

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);

// Initialize auth state before mounting
const authStore = useAuthStore();
authStore.initialize().then(() => {
  app.use(router);
  app.mount("#app");
});
