import { log } from '../lib/helpers'
import reposJob from './repos_job'

const worker = async (fn, interval) => {
  try {
    await fn()
  } catch (err) {
    log(err)
  }

  setTimeout(() => worker(fn, interval), interval)
}

// pass context on import
export default function(ctx) {
  worker(reposJob(ctx), 5000)
}
