<template>
  <!-- eslint-disable vue/no-v-html -->

  <div class="animated fadeIn">
    <b-row>
      <b-col md="4">
        <b-card bg-variant="light" no-body>
          <b-card-body class="pb-0">
            <h4 class="mb-0">{{ repos.totalCount }}</h4>
            <p>Total repos</p>
          </b-card-body>
        </b-card>
      </b-col>

      <b-col md="4">
        <b-card no-body :bg-variant="repos.isPublic ? 'warning' : 'light'">
          <b-card-body class="pb-0">
            <h4 class="mb-0">{{ repos.publicCount }}</h4>
            <p>Public repos</p>
          </b-card-body>
        </b-card>
      </b-col>

      <b-col md="4">
        <b-card no-body bg-variant="light">
          <b-card-body class="pb-0">
            <h4 class="mb-0">{{ repos.totalDiskUsage }}</h4>
            <p>Total size</p>
          </b-card-body>
        </b-card>
      </b-col>
    </b-row>

    <b-row class="mt-5">
      <b-col lg="6" sm="2">
        <b-button-group>
          <b-button
            :disabled="reposIsBusy || !pagination.hasPreviousPage"
            variant="dark"
            @click="getReposThrottled(repoFilter, -1)"
            >&lt;</b-button
          >
          <b-button
            :disabled="reposIsBusy || !pagination.hasNextPage"
            variant="dark"
            @click="getReposThrottled(repoFilter, 1)"
            >&gt;</b-button
          >
        </b-button-group>
      </b-col>

      <b-col lg="6" sm="10">
        <b-form-group>
          <b-input-group>
            <b-form-input
              v-model.trim="repoFilter"
              placeholder="Type to Search"
              @input="getReposThrottled(repoFilter)"
            />
            <b-input-group-append>
              <b-button
                variant="success"
                :disabled="!repoFilter"
                @click="
                  repoFilter = ''
                  getRepos()
                "
                >Search</b-button
              >
            </b-input-group-append>
          </b-input-group>
        </b-form-group>
      </b-col>
    </b-row>

    <b-row>
      <b-col lg="12">
        <b-card>
          <b-table
            id="repos"
            stacked="sm"
            small
            :busy="reposIsBusy"
            :items="reposTable"
            :fields="repoFields"
            :tbody-transition-props="{ name: 'slide-fade' }"
          >
            <template v-slot:cell(name)="data"><span v-html="data.value"/></template>

            <template v-slot:cell(details)="row">
              <b-button :variant="row.item.loading ? 'info' : ''" size="sm" @click="getRepoRow(row)">
                {{ row.detailsShowing ? 'Hide' : 'Details' }}
              </b-button>
            </template>

            <template slot="row-details" slot-scope="row">
              <b-card>
                <b-table
                  v-if="row.item.commitsTable.length > 0"
                  :items="row.item.commitsTable"
                  responsive="sm"
                  small
                  hover
                  striped
                  caption="Latest commits"
                  caption-top
                >
                  <template v-slot:cell(author)="data"><span v-html="data.value"/></template>
                  <template v-slot:cell(oid)="data"><span v-html="data.value"/></template>
                  <template v-slot:cell(branch)="data"><span v-html="data.value"/></template>
                </b-table>

                <b-table
                  v-if="row.item.topContribTable.length > 0"
                  :items="row.item.topContribTable"
                  responsive="sm"
                  small
                  hover
                  striped
                  caption="Latest top contributors"
                  caption-top
                >
                  <template v-slot:cell(author)="data"><span v-html="data.value"/></template>
                </b-table>

                <b-table
                  v-if="row.item.prTable.length > 0"
                  :items="row.item.prTable"
                  responsive="sm"
                  small
                  hover
                  striped
                  caption="Pull Requests"
                  caption-top
                >
                  <template v-slot:cell(author)="data"><span v-html="data.value"/></template>
                  <template v-slot:cell(title)="data"><span v-html="data.value"/></template>
                </b-table>
              </b-card>
            </template>
          </b-table>
        </b-card>
      </b-col>
    </b-row>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import debounce from 'lodash.debounce'

async function getAll(filter, cursor, reverse) {
  if (this.reposCancel) {
    this.reposCancel.cancel('Previous fetchRepos request was canceled by user')
  }

  this.reposCancel = this.$axios.CancelToken.source()

  const res = await this.$axios
    .$get('/api/repos', {
      cancelToken: this.reposCancel.token,
      params: {
        q: filter,
        cur: cursor,
        rev: reverse
      }
    })
    .catch((err) => {
      if (this.$axios.isCancel(err)) {
        // eslint-disable-next-line no-console
        console.error('Request canceled', err)
      } else {
        // eslint-disable-next-line no-console
        console.error(err)
      }
    })

  return res || {}
}

async function getRepoRow(row) {
  if (row.detailsShowing) {
    row.toggleDetails()
    return
  }

  const { id } = row.item

  row.item.loading = true
  const data = await this.$axios.$get(`/api/repos/${id}`)

  row.item.commitsTable = data.commitsTable
  row.item.topContribTable = data.topContribTable
  row.item.prTable = data.prTable
  row.item.colTable = data.colTable

  row.item.loading = false
  row.toggleDetails()
}

async function getRepos(filter, page) {
  this.reposIsBusy = true

  let cursor
  let reverse
  if (page) {
    if (page === -1) {
      reverse = true
      cursor = this.reposTableStartCursor
    } else if (page === 1) {
      cursor = this.reposTableEndCursor
    }
  }

  const data = await this.getAll(filter, cursor, reverse)

  this.reposTable = data.table

  this.reposTableTotalRows = data.pagination.total
  this.reposTablePerPage = data.pagination.repoPerPage
  this.reposTableStartCursor = data.pagination.startCursor
  this.reposTableEndCursor = data.pagination.endCursor

  this.pagination = data.pagination

  this.reposIsBusy = false
}

export default {
  data() {
    return {
      reposCancel: null,
      reposTable: [],
      reposTableTotalRows: 0,
      reposTableCurrentPage: 1,
      reposTablePerPage: 0,
      repoFilter: '',
      reposIsBusy: true,
      pagination: {},
      activeRepoId: null,
      repoInfo: null,
      repoFields: [
        {
          key: 'name',
          sortable: true
        },
        {
          key: 'description'
        },
        {
          key: 'language'
        },
        {
          key: 'usersCount',
          label: 'Users'
        },
        {
          key: 'createdAt',
          label: 'Created',
          class: 'text-right'
        },
        {
          key: 'updatedAt',
          label: 'Updated',
          class: 'text-right'
        },
        {
          key: 'diskUsage',
          class: 'text-right',
          label: 'Disk'
        },
        {
          key: 'details',
          class: 'text-right'
        }
      ]
    }
  },

  computed: {
    ...mapState(['repos'])
  },

  mounted() {
    this.getRepos(this.repoFilter)
    // this.repos = this.$store.sate.repos
  },

  methods: {
    getAll,
    getRepos,
    getRepoRow,
    getReposThrottled: debounce(getRepos, 700)
  }
}
</script>
