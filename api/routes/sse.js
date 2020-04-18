import Debug from 'debug'

const debug = Debug('api:sse')
const SSE_HEARTBEAT_TIMEOUT = process.env.SSE_HEARTBEAT_TIMEOUT || 15 * 1000

export default events

function events(req, res, next) {
  if (!('sseEvents' in req.app.locals)) {
    return next(new Error('SSE stream is not ready'))
  }

  // create event stream connection
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive'
  })

  const heartbeat = setInterval(() => res.write('\n'), SSE_HEARTBEAT_TIMEOUT)

  const onEvent = (data) => {
    debug('sending data:', data)

    res.write('event: event\n')
    res.write(`data: ${JSON.stringify(data)}\n\n`)
  }

  req.app.locals.sseEvents.on('event', onEvent)

  // wait for client to close connection
  req.on('close', function closeSse() {
    debug(`client disconnected: ${req.hostname}`)

    clearInterval(heartbeat)
    req.app.removeListener('event', onEvent)
  })
}
