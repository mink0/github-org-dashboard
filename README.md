# github-org-dashboard

Github organizations dashboard.

Mockup was made with [Nuxt.js](https://nuxtjs.org/) framework.

## Technology stack

- [Server Side Rendering (SSR)](https://nuxtjs.org/guide/#server-rendered-universal-ssr-) by [Nuxt.js](https://nuxtjs.org/)
- [Server-Sent Events (SSE)](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events) for realtime data stream from server
- [Github Graphql API](https://developer.github.com/v4/) using [octokit/graphql.js](https://github.com/octokit/graphql.js)

## Setup

```sh
# clone this repo
$ git clone ...

# install dependencies
$ npm install
```

### Create github token

- [Create personal access token](https://help.github.com/en/articles/creating-a-personal-access-token-for-the-command-line)

- To enable search at `Users` page give following grants to token:

      ['admin:org', 'repo']

- [Authorize token if needed](https://help.github.com/en/articles/authorizing-a-personal-access-token-for-use-with-a-saml-single-sign-on-organization)

### Set environment variables

```sh
cp env.sample .env
vi .env
```

## Start

### Dev mode

```sh
npm run dev
```

### Production mode using Docker

```sh
docker-compose build
docker-compose up
```

Open http://localhost:3000/ in your browser.

## Build Setup

```bash
# install dependencies
$ npm install

# serve with hot reload at localhost:3000
$ npm run dev

# build for production and launch server
$ npm run build
$ npm run start

# generate static project
$ npm run generate
```

For detailed explanation on how things work, check out [Nuxt.js docs](https://nuxtjs.org).
