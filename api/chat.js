import { handleChatProxy } from "../server/chatProxy.mjs";

export default async function handler(req, res) {
  await handleChatProxy(req, res);
}
