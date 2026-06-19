// Reserves the offscreen media boundary without requesting microphone access before opt-in.
chrome.runtime.onMessage.addListener(
  (message: unknown, _sender, sendResponse) => {
    if (
      typeof message === 'object' &&
      message !== null &&
      'type' in message &&
      message.type === 'media.status'
    ) {
      sendResponse({ ok: true, data: { state: 'disabled' } });
    }
  },
);
