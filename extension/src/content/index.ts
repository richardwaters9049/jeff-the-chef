// Injects an isolated, dismissible Jeff status avatar without reading host-page content.
const JEFF_HOST_ID = 'jeff-the-chef-avatar-host';
const contentState = globalThis as typeof globalThis & {
  __jeffTheChefLoaded?: boolean;
};

function showAvatar(): void {
  document.getElementById(JEFF_HOST_ID)?.remove();
  const host = document.createElement('div');
  host.id = JEFF_HOST_ID;
  const shadow = host.attachShadow({ mode: 'closed' });
  shadow.innerHTML = `
    <style>
      :host { all: initial; }
      .jeff {
        align-items: center; background: #fffaf0; border: 2px solid #213a2c;
        border-radius: 999px; bottom: 24px; box-shadow: 0 10px 30px #0003;
        color: #213a2c; display: flex; font: 600 14px/1.2 system-ui, sans-serif;
        gap: 10px; padding: 8px 12px 8px 8px; position: fixed; right: 24px;
        z-index: 2147483647;
      }
      img { height: 42px; width: 42px; }
      button { background: transparent; border: 0; color: inherit; cursor: pointer; font-size: 20px; }
    </style>
    <aside class="jeff" aria-label="Jeff The Chef is ready">
      <img src="${chrome.runtime.getURL('icons/chef.svg')}" alt="" />
      <span>Jeff is ready</span>
      <button type="button" aria-label="Dismiss Jeff">×</button>
    </aside>
  `;
  shadow
    .querySelector('button')
    ?.addEventListener('click', () => host.remove());
  document.documentElement.append(host);
  window.setTimeout(() => host.remove(), 8_000);
}

if (!contentState.__jeffTheChefLoaded) {
  contentState.__jeffTheChefLoaded = true;
  chrome.runtime.onMessage.addListener((message: unknown) => {
    if (
      typeof message === 'object' &&
      message !== null &&
      'type' in message &&
      message.type === 'avatar.show'
    ) {
      showAvatar();
    }
  });
}

showAvatar();
