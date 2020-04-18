import { log } from '../lib/helpers'
import reposJob from './repos_job'
import usersJob from './users_job'

const worker = async (job, interval) => {
  try {
    await job()
  } catch (err) {
    log(err)
  }

  setTimeout(() => worker(job, interval), interval)
}

// pass context on import
export default function(ctx) {
  worker(reposJob(ctx), 5000)
  worker(usersJob(ctx), 10000)
}
