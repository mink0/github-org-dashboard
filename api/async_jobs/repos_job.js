import get from 'lodash.get'
import Debug from 'debug'
import { formatBytes, log } from '../lib/helpers'

const debug = Debug('job:repos')

export default (ctx) => () => fetchRepos(ctx)

async function fetchRepos(ctx) {
  const gqlRepos = `query listRepos($owner: String!, $first: Int!) {
    rateLimit {
      cost
      remaining
      resetAt
    }
    organization(login: $owner) {
      avatarUrl
      repositories(first: $first) {
        totalCount
        totalDiskUsage
      }
    }
  }`

  const gqlPubRepos = `query findPubRepos($owner: String!, $first: Int!) {
    rateLimit {
      cost
      remaining
      resetAt
    }
    organization(login: $owner) {
      repositories(first: $first, privacy: PUBLIC){
        totalCount
        edges {
          node {
            name
            createdAt
            url
          }
        }
      }
    }
  }`

  const owner = ctx.org

  const repos = await ctx
    .github(gqlRepos, {
      first: 1,
      owner
    })
    .catch(log)

  debug('repos:', repos)

  const pubRepos = await ctx
    .github(gqlPubRepos, {
      first: 10,
      owner
    })
    .catch(log)

  debug('public repos:', pubRepos)

  // store result at app.locals
  ctx.bgRepos = {
    avatarUrl: get(repos, 'organization.avatarUrl', ''),
    totalCount: get(repos, 'organization.repositories.totalCount'),
    totalDiskUsage: formatBytes(get(repos, 'organization.repositories.totalDiskUsage', 0) * 1024),
    isPublic: !!get(pubRepos, 'organization.repositories.edges', []).length,
    publicCount: get(pubRepos, 'organization.repositories.totalCount'),
    publicList: get(pubRepos, 'organization.repositories.edges')
  }

  ctx.sseEvents.emit('event', {
    type: 'repos',
    data: JSON.stringify(ctx.bgRepos)
  })
}
