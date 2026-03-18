import axios from "axios";

export const api = axios.create({
    baseURL: typeof window !== 'undefined' ? "/api" : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"),
    withCredentials: true,
});

// Interceptor de requisição para definir o modo da sessão
api.interceptors.request.use((config) => {
    if (typeof window !== "undefined") {
        const path = window.location.pathname;
        if (path.startsWith("/admin") || path.startsWith("/area-restrita")) {
            config.headers["X-Session-Mode"] = "admin";
        }
    }
    return config;
});

// Fila para gerenciar múltiplas requisições durante o refresh do token
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });

    failedQueue = [];
};

// Interceptor para tratar expiração de token e refresh automático
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Verifica se é 401 e se não é uma tentativa de retry do próprio refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
            // Se já estiver renovando, adiciona esta requisição à fila
            if (isRefreshing) {
                return new Promise(function (resolve, reject) {
                    failedQueue.push({ resolve, reject });
                })
                    .then(() => {
                        return api(originalRequest);
                    })
                    .catch((err) => {
                        return Promise.reject(err);
                    });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                console.log("[API] Iniciando refresh automático do token...");
                // Usamos axios puro aqui para não entrar no interceptor da nossa própria instância da api
                const refreshResponse = await axios.post(
                    `${api.defaults.baseURL}/auth/refresh`,
                    {},
                    {
                        withCredentials: true,
                        // Evita que o axios lance erro no console para 401/403 durante o refresh
                        validateStatus: (status) => status < 500
                    }
                );

                if (refreshResponse.status !== 200) {
                    throw { response: refreshResponse };
                }

                console.log("[API] Token renovado com sucesso. Processando fila...");
                isRefreshing = false;
                processQueue(null);

                return api(originalRequest);
            } catch (refreshError: any) {
                // Só logamos erro real se não for 401 (que é apenas sessão expirada)
                if (refreshError.response?.status !== 401) {
                    console.error("[API] Falha ao renovar token:", refreshError);
                }

                processQueue(refreshError, null);
                isRefreshing = false;

                // Redireciona para o login apenas se houver uma falha real no refresh 
                // e não for uma requisição interna de sistema
                if (
                    typeof window !== "undefined" &&
                    !window.location.pathname.includes("/login") &&
                    !window.location.pathname.includes("/area-restrita") &&
                    !originalRequest._skipRedirect
                ) {
                    const currentPath = window.location.pathname + window.location.search;
                    window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
                }
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
