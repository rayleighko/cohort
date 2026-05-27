// W4 Thu notification module — default ProviderRegistry init
// KakaoAlimtalkProvider lands in ST4 (stub only for V1; 사업자 verify gating real send).

import { ProviderRegistry } from './provider';
import { WebPushProvider } from './web-push';

export const defaultRegistry = new ProviderRegistry();
defaultRegistry.register(new WebPushProvider());

export { WebPushProvider } from './web-push';
export type { NotificationProvider } from './provider';
