//
// Backend as the express serverMiddleware
// Could be easily refactored to a separate express server when it will become heavy
//

import EventEmitter from 'events'
import express from 'express'
import { log } from './lib/helpers'
import github from './lib/github'
import runJobs from './async_jobs'
import sse from './routes/sse'
import repos from './routes/repos'
import users from './routes/users'

const app = express()

//
// Routes
//

app.get('/repos', repos.getAll)
app.get('/repos/:id', repos.getById)
app.get('/users', users)
app.get('/sse', sse)

//
// Error handler
//

app.use((err, req, res, next) => {
  log(err)
  if (typeof err === 'object') {
    // eslint-disable-next-line no-console
    console.dir(err)
  }

  const message = {
    message: err.message || 'Error'
  }

  // don't show stack trace on production
  if (app.get('env') === 'development') {
    message.error = err
  }

  res.status(err.status || 500)
  res.send(message)
})

//
// Github API
//

app.locals.github = github
app.locals.org = process.env.GITHUB_ORG

//
// Start async jobs with app.locals context
//

app.locals.sseEvents = new EventEmitter()
runJobs(app.locals)

//
// Export
//

export default {
  path: '',
  handler: app
}
