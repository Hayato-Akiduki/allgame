// ================================================================
// INIT
// ================================================================
let deferredInstallPrompt = null;
const installButton = document.getElementById('install-btn');

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  installButton?.classList.add('visible');
});

installButton?.addEventListener('click', async () => {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  installButton.classList.remove('visible');
});

window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;
  installButton?.classList.remove('visible');
  showToast('アプリをインストールしました！', '#6bcb77');
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch(() => {});
  });
}

