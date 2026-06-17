import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'rs.bytewizard.financetracker',
  appName: 'Finance Tracker',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  }
};

export default config;