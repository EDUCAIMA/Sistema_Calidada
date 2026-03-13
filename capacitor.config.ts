import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.sgc.saas',
    appName: 'SGC SaaS',
    webDir: 'out',
    server: {
        url: 'http://localhost:3000', // Apunta al servidor de desarrollo de Next.js
        cleartext: true
    }
};

export default config;
