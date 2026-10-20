import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.proasi.absensi',
  appName: 'PROASI Mobile',
  webDir: 'public',
  server: {
    url: 'https://boyor-web.vercel.app',
    cleartext: true
  }
};

export default config;
