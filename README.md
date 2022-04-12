# github-org-dashboard

Github organizations dashboard mockup based on [Nuxt.js](https://nuxtjs.org/) framework.

## Tech stack

- [Github Graphql API](https://developer.github.com/v4/) using [octokit/graphql.js](https://github.com/octokit/graphql.js)
- [Server Side Rendering (SSR)](https://nuxtjs.org/guide/#server-rendered-universal-ssr-) by [Nuxt.js](https://nuxtjs.org/)
- [Server-Sent Events (SSE)](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events)
- [Dotenv for Nuxt.js](https://github.com/nuxt-community/dotenv-module)
- [BootstrapVue](https://bootstrap-vue.org/)

## Screenshots

![repos-1](/docs/images/repos.png)

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

### Development mode

```sh
npm run dev
```

### Production mode

```sh
docker-compose build
docker-compose up
```

Open http://localhost:3000/ in your browser.

## Build

```bash
# build for production
$ npm run build

# generate static project
$ npm run generate
```

For detailed explanation on how things work please check the official [Nuxt.js docs](https://nuxtjs.org).
