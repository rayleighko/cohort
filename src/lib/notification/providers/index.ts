// W4 Thu notification module — default ProviderRegistry init
// KakaoAlimtalkProvider is registered as a V1 stub (사업자 verify pending);
// real send activation lands in a V1.1+ commit.

import { ProviderRegistry } from './provider';
import { WebPushProvider } from './web-push';
import { KakaoAlimtalkProvider } from './kakao-alimtalk';

export const defaultRegistry = new ProviderRegistry();
defaultRegistry.register(new WebPushProvider());
defaultRegistry.register(new KakaoAlimtalkProvider());

export { WebPushProvider } from './web-push';
export { KakaoAlimtalkProvider } from './kakao-alimtalk';
export type { NotificationProvider } from './provider';
