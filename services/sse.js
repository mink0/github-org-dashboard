export default sseStream

function sseStream(store) {
  let eSrc

  eSrcConnect(eSrc)

  const eSrcEventHandler = (event) => {
    let payload
    let data
    try {
      payload = JSON.parse(event.data)
      data = JSON.parse(payload.data)
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e)
      return
    }

    if (payload.type === 'repos') {
      store.commit('repos', data)
    }
  }

  const eSrcErrorHandler = (event) => {
    // eslint-disable-next-line default-case
    switch (event.readyState) {
      case EventSource.CONNECTING:
        // eslint-disable-next-line no-console
        console.log('SSE: Reconnecting...')
        break
      case EventSource.CLOSED:
        setTimeout(() => {
          eSrcConnect(eSrc)
        }, 5000)
        break
    }
  }

  function eSrcConnect() {
    if (eSrc) {
      eSrc.removeEventListener('event', (event) => eSrcEventHandler(event))
      eSrc.removeEventListener('error', (event) => eSrcErrorHandler(event))
      eSrc.close()
    }

    const url = `${store.state.apiUrl}/sse`
    // eslint-disable-next-line no-console
    console.log(`SSE: Connecting to ${url}`)
    eSrc = new EventSource(url)

    eSrc.addEventListener('event', (event) => eSrcEventHandler(event), false)
    eSrc.addEventListener('error', (event) => eSrcErrorHandler(event), false)
  }
}
