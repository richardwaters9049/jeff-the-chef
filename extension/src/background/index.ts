// Starts the Manifest V3 service worker and coordinates UI, alarms, and local services.
import { routeRequest } from './router';
import { completeTimer, reconcileTimers, timerIdFromAlarm } from './timers';

async function summonJeff(tab?: chrome.tabs.Tab): Promise<void> {
  if (tab?.windowId !== undefined) {
    await chrome.sidePanel.open({ windowId: tab.windowId });
  }
  if (tab?.id === undefined || !tab.url?.startsWith('http')) return;

  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js'],
    });
    await chrome.tabs.sendMessage(tab.id, { type: 'avatar.show' });
  } catch {
    // Protected pages still retain the fully functional side-panel fallback.
  }
}

chrome.action.onClicked.addListener((tab) => void summonJeff(tab));

chrome.commands.onCommand.addListener((command) => {
  if (command !== 'summon-jeff') return;
  void chrome.tabs
    .query({ active: true, currentWindow: true })
    .then(([tab]) => summonJeff(tab));
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (sender.id && sender.id !== chrome.runtime.id) {
    sendResponse({ ok: false, error: 'Unauthorised message sender.' });
    return false;
  }
  void routeRequest(message).then(sendResponse);
  return true;
});

chrome.alarms.onAlarm.addListener((alarm) => {
  const id = timerIdFromAlarm(alarm.name);
  if (id) void completeTimer(id);
});

chrome.runtime.onInstalled.addListener(() => void reconcileTimers());
chrome.runtime.onStartup.addListener(() => void reconcileTimers());
void reconcileTimers();
