// Background service worker orchestrator. Modules under `./background`
// handle the actual work; this file just boots them.
import { setupMessageListener } from './background/message-router';
import { setupPopupBridge } from './background/popup-bridge';

setupMessageListener();
setupPopupBridge();
