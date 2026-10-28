import {defineConfig,devices} from '@playwright/test';
export default defineConfig({
  testDir:'tests/e2e',fullyParallel:false,workers:1,retries:0,timeout:90000,
  expect:{timeout:20000},
  reporter:[['list'],['html',{outputFolder:'artifacts/e2e-report',open:'never'}]],
  outputDir:'artifacts/e2e-results',
  use:{baseURL:'http://127.0.0.1:3000',trace:'retain-on-failure',screenshot:'only-on-failure',launchOptions:{executablePath:process.env.ATLAS_E2E_CHROMIUM||undefined}},
  projects:[{name:'desktop',use:{...devices['Desktop Chrome']}},{name:'mobile',use:{...devices['iPhone 13'],defaultBrowserType:'chromium'}}],
  webServer:{command:'node scripts/e2e-server.mjs',url:'http://127.0.0.1:3000/api/atlas/bootstrap',reuseExistingServer:process.env.ATLAS_E2E_REUSE==='1',timeout:120000},
});
