export const state = () => ({
  sse: {
    url: '/api/sse'
  },
  repos: {
    totalCount: '-',
    totalDiskUsage: '-',
    publicCount: '-'
  }
})

export const mutations = {
  repos(store, data) {
    store.repos = data
  }
}
