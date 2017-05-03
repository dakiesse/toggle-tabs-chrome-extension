(() => {
  const styles = `
    position: fixed;
    z-index: 2147483647;
    left: 50%;
    top: 50%;
    transform: translate(-50%,-50%);
    border-radius: 4px;
    background: rgba(0, 0, 0, .8);
    font-size: 24px;
    color: #fff;
    padding: 20px 20px;
  `
  const html = `
    <div id="chrome-plugin__toggle-tabs" style="${styles}">
      No tab for toggle
    </div>
  `

  const animationSteps = [
    {opacity: 1},
    {opacity: 0}
  ]

  const animationOptions = {
    duration: 1000,
    delay: 500,
    fill: 'forwards'
  }

  chrome.extension.onMessage.addListener((message) => {
    if (message.action === 'show-notification') {
      showNotification()
    }
  })

  function showNotification () {
    removeNotification()
    document.body.insertAdjacentHTML('beforeend', html)
    document
      .querySelector('#chrome-plugin__toggle-tabs')
      .animate(animationSteps, animationOptions)
      .addEventListener('finish', removeNotification)
  }

  function removeNotification () {
    let element = document.querySelector('#chrome-plugin__toggle-tabs')
    if (element) {
      element.getAnimations()[0].cancel()
      element.removeEventListener('finish', removeNotification)
      element.remove()
    }
  }
})()
