const currentEnv = import.meta.env.VITE_ENV
const appURL = import.meta.env.VITE_APP_URL


if (!currentEnv || !appURL) {
    console.warn("App base environment missing. Check your .env file!")
}

export const appEnv = {
    env: currentEnv,
    appURL: appURL,
}