import Debug from 'debug'
import get from 'lodash.get'
import { formatBytes, getDs, truncStr, userUrl } from '../lib/helpers'

export default { getAll, getById }

async function getAll(req, res, next) {
  const debug = Debug('api:repos:all')

  const reposGql = `query repos(
    $queryString: String!,
    $first: Int,
    $last: Int,
    $pCursorFwd: String,
    $pCursorBwd: String) {

      rateLimit {
        cost
        remaining
        resetAt
      }

      search(
        query: $queryString,
        type: REPOSITORY,
        first: $first,
        last: $last,
        after: $pCursorFwd,
        before: $pCursorBwd) {

          repositoryCount

          pageInfo {
            startCursor
            endCursor
            hasNextPage
            hasPreviousPage
          }

          edges {
            cursor
            node {
              ... on Repository {
                id
                name
                description
                url
                createdAt
                updatedAt
                diskUsage

                primaryLanguage {
                  name
                }

                licenseInfo{
                  key
                }

                assignableUsers{
                  totalCount
                }
              }
            }
          }
        }
  }`

  const queryPrefix = `org:${req.app.locals.org}`
  const perPage = 10

  let queryString = queryPrefix
  if (get(req, 'query.q')) queryString += ` ${req.query.q}`

  let pCursorFwd
  let pCursorBwd
  let first
  let last
  if (get(req, 'query.cur')) {
    if (get(req, 'query.rev')) {
      pCursorBwd = req.query.cur
      last = perPage
    } else {
      pCursorFwd = req.query.cur
      first = perPage
    }
  } else {
    first = perPage
  }

  debug('gqlQuery:', reposGql)
  let data
  try {
    data = await req.app.locals.github(reposGql, {
      queryString,
      first,
      last,
      pCursorFwd,
      pCursorBwd
    })
  } catch (err) {
    return next(err)
  }

  debug('result:', data)
  const table = []
  let row
  let e
  for (let i = 0; i < data.search.edges.length; i++) {
    e = data.search.edges[i]

    row = {
      id: get(e, 'node.id'),
      name: `<a href="${get(e, 'node.url')}">${get(e, 'node.name')}</a>`,
      createdAt: getDs(get(e, 'node.createdAt', null)),
      updatedAt: getDs(get(e, 'node.updatedAt', null)),
      language: get(e, 'node.primaryLanguage.name'),
      description: get(e, 'node.description'),
      diskUsage: formatBytes(get(e, 'node.diskUsage', 0) * 1024),
      usersCount: get(e, 'node.assignableUsers.totalCount'),
      loading: false,
      comTable: [],
      prTable: [],
      colTable: []
    }

    table.push(row)
  }

  res.send({
    table,
    pagination: Object.assign({}, data.search.pageInfo, {
      total: data.search.repositoryCount,
      perPage
    })
  })
}

async function getById(req, res, next) {
  const debug = Debug('api:repos:id')

  const repoInfoGql = `query repoInfo($id: ID!, $first: Int) {
    rateLimit {
      cost
      remaining
      resetAt
    }

    node(id: $id) {
      ... on Repository {
        id
        name
        url

        assignableUsers {
          totalCount
        }

        pullRequests(states: OPEN, first: $first) {
          edges {
            node {
              id
              title
              url
              createdAt
              bodyText
              author {
                url
                avatarUrl
                login
              }
            }
          }
        }

        refs(refPrefix: "refs/heads/", orderBy: { field: TAG_COMMIT_DATE, direction: ASC }, first: 100) {
          totalCount
          edges {
            node {
              name
              target {
                ... on Commit {
                  history(first: $first) {
                    edges {
                      node {
                        abbreviatedOid
                        commitUrl
                        messageHeadline
                        committedDate
                        author {
                          name
                          email
                          user {
                            url
                            login
                            avatarUrl
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }`

  const { id } = req.params
  const first = 10
  debug('gqlQuery:', repoInfoGql)
  let data
  try {
    data = await req.app.locals.github(repoInfoGql, {
      id,
      first
    })
  } catch (err) {
    return next(err)
  }
  debug('result:', data)

  const prTable = get(data, 'node.pullRequests.edges', []).map((e) => ({
    title: `<a href="${get(e, 'node.url')}">${truncStr(get(e, 'node.title'), 10)}</a>`,
    description: truncStr(get(e, 'node.bodyText'), 10),
    author: userUrl(get(e, 'node.author')),
    date: getDs(get(e, 'node.createdAt', null))
  }))

  const branches = get(data, 'node.refs.edges', [])
  const url = get(data, 'node.url')

  let commitsTable = []
  const topContribTable = []
  branches.forEach((branch) => {
    const bname = get(branch, 'node.name')
    const commits = get(branch, 'node.target.history.edges', [])

    commits.forEach((c) => {
      commitsTable.push({
        oid: `<a href="${get(c, 'node.commitUrl')}">${get(c, 'node.abbreviatedOid')}</a>`,
        branch: `<a href="${url}/commits/${bname}">${bname}</a>`,
        message: truncStr(get(c, 'node.messageHeadline'), 80),
        date: get(c, 'node.committedDate', null),
        author: userUrl(get(c, 'node.author.user'))
      })

      const uid = get(c, 'node.author.user.login', '')

      let tcExist = false
      for (let i = 0; i < topContribTable.length; i++) {
        const row = topContribTable[i]

        if (row.id === uid) {
          tcExist = true
          row.commits++

          break
        }
      }

      if (!tcExist) {
        topContribTable.push({
          id: uid,
          author: userUrl(get(c, 'node.author.user')),
          name: get(c, 'node.author.name'),
          email: get(c, 'node.author.email'),
          commits: 1
        })
      }
    })
  })

  commitsTable = commitsTable.sort((a, b) => new Date(b.date) - new Date(a.date))
  commitsTable = commitsTable.slice(0, first).map((v) => {
    v.date = getDs(v.date)
    return v
  })

  topContribTable.sort((a, b) => b.count - a.count)

  res.send({
    id: get(data, 'node.id'),
    name: get(data, 'node.name'),
    usersCount: get(data, 'node.assignableUsers.totalCount'),

    topContribTable: topContribTable.slice(0, 3),
    commitsTable,
    prTable
  })
}
