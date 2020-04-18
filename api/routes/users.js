import Debug from 'debug'
import get from 'lodash.get'
import { getDs, userUrl } from '../lib/helpers'

const debug = Debug('api:users')

export default getUsers

async function getUsers(req, res, next) {
  const gql = `query users(
    $org: String!,
    $qteams: String,
    $qusers: String
    $first: Int,
    $last: Int,
    $pCursorFwd: String,
    $pCursorBwd: String
    $uFirst: Int) {

    rateLimit {
      cost
      remaining
      resetAt
    }

    organization(login: $org) {
      avatarUrl
      name
      teams(
        query: $qteams
        first: $first,
        last: $last,
        after: $pCursorFwd,
        before: $pCursorBwd) {

        totalCount

        pageInfo {
          startCursor
          endCursor
          hasNextPage
          hasPreviousPage
        }

        edges {
          node {
            name
            description
            membersUrl
            avatarUrl
            updatedAt
            organization {
              login
            }

            members(first: $uFirst, query: $qusers) {
              totalCount
              edges {
                node {
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
    }
  }`

  const { org } = req.app.locals
  const perPage = 10

  const qteams = get(req, 'query.qteams')
  const qusers = get(req, 'query.qusers')

  const cursor = get(req, 'query.cursor')
  const reverse = get(req, 'query.reverse')

  const fromDate = new Date()
  fromDate.setMonth(fromDate.getMonth() - 1)

  let pCursorFwd
  let pCursorBwd
  let first
  let last
  if (cursor) {
    if (!reverse) {
      pCursorFwd = cursor
      first = perPage
    } else {
      pCursorBwd = cursor
      last = perPage
    }
  } else {
    first = perPage
  }

  const uFirst = perPage * 2

  const params = {
    org,
    qteams,
    qusers,
    first,
    last,
    pCursorFwd,
    pCursorBwd,
    uFirst
  }
  debug('params:', params)

  const result = await req.app.locals.github(gql, params).catch((err) => next(err))
  debug('result:', result)

  const samlTable = []
  let samlMaxLen = 10
  if (qusers) {
    const users = get(req, 'app.locals.samlUsers', [])
    for (let u = 0; u < users.length; u++) {
      const user = users[u]

      let found = false
      Object.values(user).forEach((v) => {
        if (v !== null && v !== undefined && v.toString().includes(qusers)) found = true
      })
      if (!found) continue

      samlTable.push({
        user: userUrl(user),
        email: user.email,
        userName: user.name,
        company: user.company
      })

      if (!--samlMaxLen) break
    }
  }

  const { samlUsers } = req.app.locals
  const options = []
  const teamsTable = []
  const teams = get(result, 'organization.teams.edges', [])
  teams.forEach((e) => {
    // FIXME
    const orow = {
      id: get(e, 'node.name'),
      label: get(e, 'node.name'),

      children: get(e, 'node.members.edges', []).map((obj) => ({
        id: get(obj, 'node.login'),
        label: get(obj, 'node.login')
      }))
    }

    // FIXME
    if (!qusers) delete orow.children

    options.push(orow)

    const trow = {
      name: userUrl({
        login: get(e, 'node.name'),
        avatarUrl: get(e, 'node.avatarUrl'),
        url: get(e, 'node.membersUrl')
      }),
      description: get(e, 'node.description'),
      organization: get(e, 'node.organization.login'),
      updatedAt: getDs(get(e, 'node.updatedAt', null)),
      membersCount: get(e, 'node.members.totalCount', 0),
      members: []
    }

    // filter teams without users
    if (qusers && trow.membersCount.toString() === '0') return

    trow.members = get(e, 'node.members.edges', []).map((ec) => {
      const login = get(ec, 'node.login')
      let email = ''

      for (let i = 0; i < samlUsers.length; i++) {
        if (samlUsers[i].login === login) {
          ;({ email } = samlUsers[i])
          break
        }
      }

      return {
        user: userUrl(get(ec, 'node')),
        email,
        userName: get(ec, 'node.name'),
        company: get(ec, 'node.company'),
        commits: get(ec, 'node.contributionsCollection.totalCommitContributions', 'TODO')
      }
    })

    teamsTable.push(trow)
  })

  res.send({
    samlTable,
    options,
    teamsTable,
    teamsCount: get(result, 'organization.teams.totalCount', NaN),
    teamsPage: get(result, 'organization.teams.pageInfo'),
    usersCount: get(req, 'app.locals.samlUsersCount', NaN)
  })
}
