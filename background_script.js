const tabStore = {}
const injectStore = new Set
let currentWindowId

const noop = () => {}

// Initial
chrome.tabs.query({active: true}, (tabs) => {
  for (let tab of tabs) {
    createStoreForWindow(tab.windowId)
    setCurrentTab(tab.id, tab.windowId)
  }
})

chrome.runtime.onInstalled.addListener(() => {
  chrome.runtime.openOptionsPage()
})

// Create new window
chrome.windows.onCreated.addListener((window) => {
  createStoreForWindow(window.id)

  console.info(`Window:${window.id} was created`)
})

// Close the window
chrome.windows.onRemoved.addListener((windowId) => {
  removeWindowFromStore(windowId)

  console.info(`Window:${windowId} was removed`)
})

chrome.windows.onFocusChanged.addListener((windowId) => {
  currentWindowId = windowId
})

chrome.tabs.onActivated.addListener((activeInfo) => {
  console.log('activated')

  // If close a window with two or more tabs,
  // for some reason this event is triggered (with
  // data of killed window) before chrome.windows.onRemoved
  try {
    currentWindowId = activeInfo.windowId
    setCurrentTab(activeInfo.tabId, currentWindowId)

    console.info(`Tab:${activeInfo.tabId} was activated into Window:${activeInfo.windowId}`)
  } catch (err) {

  }
})

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  console.log('removed')

  if (injectStore.has(getCurrentTab())) {
    injectStore.delete(getCurrentTab())
  }

  if (removeInfo.isWindowClosing) {
    return removeWindowFromStore(removeInfo.windowId)
  }

  clearStoreFromKilledTabId(tabId, removeInfo.windowId)
})

// Case: open new tab, then go to google.com
chrome.tabs.onReplaced.addListener((addedTabId, removedTabId) => {
  // todo: if open 2 tabs with google.com, it dont help
  createStoreForWindow(currentWindowId)
  // then onActivated
})

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'complete' && injectStore.has(tabId)) {
    injectContentScriptToTab(tabId, noop)
  }
})

// Click on "Browser Action"
chrome.browserAction.onClicked.addListener(() => {
  updateCurrentWindowId()
  doToggle()
})
// Press a hot key
chrome.commands.onCommand.addListener((command) => {
  updateCurrentWindowId()

  // (-1) is window of devtools
  if (command === 'toggle-tab') {
    doToggle()
  }
})

function updateCurrentWindowId () {
  // why then sometimes the focus is lost
  // for example, the variable can have -1,
  // although in focus there is actually another window
  chrome.tabs.query({active: true, lastFocusedWindow: true}, (tabs) => {
    if (tabs.length) currentWindowId = tabs[0].windowId
  })

  if (currentWindowId === chrome.tabs.TAB_ID_NONE) return
}

function doToggle () {
  if (getPreviousTab()) {
    chrome.tabs.update(getPreviousTab(), {active: true})
  } else {
    // injecting content script to tab
    let currentTab = getCurrentTab()

    if (!injectStore.has(currentTab)) {
      injectContentScriptToTab(currentTab, () => {
        sendMessageToContent()
        injectStore.add(currentTab)
      })
    } else {
      sendMessageToContent()
    }
  }
}

function createStoreForWindow (windowId) {
  tabStore[windowId] = {
    previousTabId: null,
    currentTabId: null,
  }
}

function removeWindowFromStore (windowId) {
  delete tabStore[windowId]
}

function getCurrentTab () {
  return tabStore[currentWindowId].currentTabId
}

function getPreviousTab () {
  return tabStore[currentWindowId].previousTabId
}

function setCurrentTab (tabId, windowId) {
  tabStore[windowId].previousTabId = tabStore[windowId].currentTabId
  tabStore[windowId].currentTabId = tabId
}

function clearStoreFromKilledTabId (tabId, windowId) {
  if (getPreviousTab() === tabId) {
    tabStore[windowId].previousTabId = null
  }

  if (getCurrentTab() === tabId) {
    tabStore[windowId].currentTabId = null
  }
}

function sendMessageToContent () {
  try {
    chrome.tabs.sendMessage(getCurrentTab(), {action: 'show-notification'})
  } catch (e) {}
}

function injectContentScriptToTab (tabId, cb) {
  try {
    chrome.tabs.executeScript(tabId, {file: 'content_script.js', matchAboutBlank: true}, cb)
  } catch (e) {}
}
