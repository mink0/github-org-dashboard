export const state = () => ({
  apiUrl: '/api',

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
