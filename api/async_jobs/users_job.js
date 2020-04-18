import get from 'lodash.get'
import Debug from 'debug'
import { log } from '../lib/helpers'

const debug = Debug('job:users')
const USERS_LIMIT = 100

export default (ctx) => () => {
  ctx.samlUsers = []
  ctx.samlUsersCount = 0

  fetchUsers(ctx)
}

async function fetchUsers(ctx) {
  const gqlUsers = `query listUsers($org: String!, $first: Int, $cursor: String) {
    rateLimit {
      cost
      remaining
      resetAt
    }

    organization(login: $org) {
      samlIdentityProvider {
        externalIdentities(first: $first, after: $cursor) {
          totalCount
          pageInfo {
            endCursor
            hasNextPage
          }
          edges {
            node {
              samlIdentity {
                nameId
              }
              user {
                login
                name
                url
                avatarUrl
                company
              }
            }
          }
        }
      }
    }
  }`

  const owner = ctx.org
  const users = []

  async function fetch(cursor) {
    const res = await ctx
      .github(gqlUsers, {
        first: USERS_LIMIT,
        org: owner,
        cursor
      })
      .catch(log)

    const cur = get(res, 'organization.samlIdentityProvider.externalIdentities.pageInfo.endCursor')
    const eUsers = get(res, 'organization.samlIdentityProvider.externalIdentities.edges', [])

    eUsers.forEach((e) => {
      users.push({
        login: get(e, 'node.user.login'),
        email: get(e, 'node.samlIdentity.nameId'),
        name: get(e, 'node.user.name'),
        url: get(e, 'node.user.url'),
        avatarUrl: get(e, 'node.user.avatarUrl'),
        company: get(e, 'node.user.company')
      })
    })

    if (get(res, 'organization.samlIdentityProvider.externalIdentities.pageInfo.hasNextPage', false)) {
      return fetch(cur)
    }

    ctx.samlUsersCount = get(res, 'organization.samlIdentityProvider.externalIdentities.totalCount', 0)
  }

  await fetch()

  debug(`Found ${users.length} users:`, users)
  ctx.samlUsers = users
}
