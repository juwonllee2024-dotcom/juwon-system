import { startApplication } from './bootstrap';
import { registerTestIpcHandlers } from './ipc/register-test';

startApplication(registerTestIpcHandlers, (stage) => console.error(`[JUWON_TEST_STAGE] ${stage}`), true);
