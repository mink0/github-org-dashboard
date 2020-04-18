<template>
  <!-- eslint-disable vue/no-v-html -->
  <div class="animated fadeIn">
    <b-row>
      <b-col md="3" offset-md="6">
        <b-card bg-variant="light" no-body>
          <b-card-body class="pb-0">
            <h4 class="mb-0">{{ teamsCount }}</h4>
            <p>Teams Count</p>
          </b-card-body>
        </b-card>
      </b-col>

      <b-col md="3">
        <b-card bg-variant="light" no-body>
          <b-card-body class="pb-0">
            <h4 class="mb-0">{{ samlUsersCount }}</h4>
            <p>Users Count</p>
          </b-card-body>
        </b-card>
      </b-col>
    </b-row>

    <b-row class="mt-5">
      <b-col lg="6" offset-lg="6" sm="10" offset-sm="2">
        <b-form-group>
          <b-input-group prepend="filter">
            <b-form-input
              v-model.trim="qteams"
              placeholder="Team name"
              @input="getTeamUsers(qteams, qusers)"
            ></b-form-input>
            <b-form-input
              v-model.trim="qusers"
              placeholder="User name"
              @input="getTeamUsers(qteams, qusers)"
            ></b-form-input>
          </b-input-group>
        </b-form-group>
      </b-col>
    </b-row>

    <b-row v-if="samlTable.length > 0">
      <b-col lg="12">
        <b-card>
          <b-table
            stacked="sm"
            small
            :busy="teamsIsBusy"
            :items="samlTable"
            :tbody-transition-props="{ name: 'slide-fade' }"
            caption-top
          >
            <template slot="table-caption">
              <div class="row">
                <div class="col">
                  <h4>Org Users</h4>
                </div>
                <div class="col text-right">
                  <b-button-group>
                    <b-button
                      class="btn-sm"
                      :disabled="true"
                      variant="dark"
                      @click="getTeamUsersNoWait(qteams, qusers, -1)"
                      >&lt;</b-button
                    >
                    <b-button
                      class="btn-sm"
                      :disabled="true"
                      variant="dark"
                      @click="getTeamUsersNoWait(qteams, qusers, 1)"
                      >&gt;</b-button
                    >
                  </b-button-group>
                </div>
              </div>
            </template>

            <template v-slot:cell(user)="data"><span v-html="data.value"/></template>
          </b-table>
        </b-card>
      </b-col>
    </b-row>

    <b-row class="mt-1">
      <b-col lg="12">
        <b-card>
          <b-table
            stacked="sm"
            small
            :busy="teamsIsBusy"
            :items="teamsTable"
            :fields="teamsFields"
            :tbody-transition-props="{ name: 'slide-fade' }"
            caption-top
          >
            <template slot="table-caption">
              <div class="row">
                <div class="col">
                  <h4>Org Teams</h4>
                </div>
                <div class="col text-right">
                  <b-button-group>
                    <b-button
                      class="btn-sm"
                      :disabled="teamsIsBusy || !teamsPage.hasPreviousPage"
                      variant="dark"
                      @click="getTeamUsersNoWait(qteams, qusers, -1)"
                      >&lt;</b-button
                    >
                    <b-button
                      class="btn-sm"
                      :disabled="teamsIsBusy || !teamsPage.hasNextPage"
                      variant="dark"
                      @click="getTeamUsersNoWait(qteams, qusers, 1)"
                      >&gt;</b-button
                    >
                  </b-button-group>
                </div>
              </div>
            </template>
            <template v-slot:cell(name)="data"><span v-html="data.value"/></template>

            <template v-slot:cell(details)="row">
              <b-button size="sm" @click="row.item._showDetails = !row.item._showDetails">
                {{ row.detailsShowing ? 'Hide' : 'Details' }}
              </b-button>
            </template>

            <template slot="row-details" slot-scope="row">
              <b-card>
                <b-table
                  responsive="sm"
                  small
                  hover
                  striped
                  :items="row.item.members"
                  :tbody-transition-props="{ name: 'slide-fade' }"
                  caption="Team members"
                  caption-top
                >
                  <template v-slot:cell(user)="data"><span v-html="data.value"/></template>
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
import debounce from 'lodash.debounce'
import get from 'lodash.get'

export default {
  data() {
    return {
      usersCancel: null,
      teamsTable: [],
      samlTable: [],
      teamsCount: '-',
      samlUsersCount: '-',
      teamsIsBusy: false,
      qteams: '',
      qusers: '',
      teamsPage: {},
      teamsFields: [
        {
          key: 'name',
          sortable: true
        },
        {
          key: 'description'
        },
        {
          key: 'membersCount',
          class: 'text-right',
          sortable: true
        },
        {
          key: 'updatedAt',
          label: 'Updated',
          class: 'text-right'
        },
        {
          key: 'details',
          class: 'text-right'
        }
      ]
    }
  },

  mounted() {
    this.getTeamUsers(this.qteams, '')
  },

  methods: {
    fetchUsers,
    loadOptions,
    getTeamUsers: debounce(getTeamUsers, 700),
    getTeamUsersNoWait: getTeamUsers
  }
}

async function fetchUsers(params) {
  if (this.usersCancel) {
    this.usersCancel.cancel('Previous fetchUsers request was canceled by user')
  }

  const url = this.$store.state.apiUrl
  this.usersCancel = this.$axios.CancelToken.source()
  const res = await this.$axios
    .$get(`${url}/users`, {
      cancelToken: this.usersCancel.token,
      params
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

  return res || null
}

async function loadOptions(opts) {
  if (opts.action === 'ASYNC_SEARCH') {
    let qteams
    let qusers

    qteams = opts.searchQuery
    if (this.qteams) {
      ;({ qteams } = this)
      qusers = opts.searchQuery
    }

    const res = await this.getTeamUsers(qteams, qusers)

    opts.callback(null, res.options)
  }
}

async function getTeamUsers(qteams, qusers, page) {
  let cursor
  let reverse

  if (page === -1) {
    reverse = true
    cursor = this.teamsPage.startCursor
  } else if (page === 1) {
    cursor = this.teamsPage.endCursor
  }

  this.teamsIsBusy = true
  const data = await this.fetchUsers({
    qteams,
    qusers,
    cursor,
    reverse
  })
  this.teamsIsBusy = false

  if (!data) return

  // auto open details on user search
  data.teamsTable.forEach((row) => {
    row._showDetails = !!this.qusers
  })

  this.teamsTable = get(data, 'teamsTable', [])
  this.teamsCount = get(data, 'teamsCount', 0)
  this.samlUsersCount = get(data, 'usersCount', 0)
  this.teamsPage = get(data, 'teamsPage', {})
  this.samlTable = get(data, 'samlTable', [])
}
</script>
