document.querySelector('#configure-commands').addEventListener('click', () => {
  chrome.tabs.create({'url': 'chrome://extensions/configureCommands'})
})