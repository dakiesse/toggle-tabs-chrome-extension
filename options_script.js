document.querySelector('#configure-commands').addEventListener('click', () => {
  chrome.tabs.create({'url': 'chrome://extensions/configureCommands'})
})

const mainHeight = document.querySelector('main').clientHeight
document.querySelector('body').style.minHeight = `${mainHeight}px`