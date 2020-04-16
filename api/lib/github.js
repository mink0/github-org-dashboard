import { graphql } from '@octokit/graphql'
import { panic } from './helpers'

const token = process.env.GITHUB_TOKEN

if (!token || token.length === 0) {
  panic('You should set $GITHUB_TOKEN environment variable')
}

const graphqlWithAuth = graphql.defaults({
  headers: {
    authorization: `token ${token}`
  }
})

export default graphqlWithAuth
