import { DiscordSDK } from '@discord/embedded-app-sdk';
export async function connect() {
  const sdk = new DiscordSDK('1575725019076493332');
  await sdk.ready();
}
