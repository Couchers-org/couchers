<template>
  <v-content>
    <h1>Search results for "{{ query }}"</h1>
    <div v-if="!loading">
      <user-search-result v-for="user in users" :key="user.id" :user="user" />
    </div>
    <v-container fill-height>
      <v-col class="mx-auto" cols="12" sm="10" md="8" lg="6" xl="4">
        <div v-if="loading">
          <p class="subtitle-1 text-center">Loading...</p>
          <v-progress-linear indeterminate color="primary"></v-progress-linear>
        </div>
      </v-col>
    </v-container>
  </v-content>
</template>

<script lang="ts">
import Vue from 'vue'

import { SearchReq } from '../pb/api_pb'
import { client } from '../api'

import UserSearchResult from '../components/UserSearchResult.vue'

export default Vue.extend({
  data: () => ({
    loading: false,
    users: null
  }),

  components: {
    UserSearchResult
  },

  computed: {
    query: function () {
      return this.$route.query.q
    },
  },

  created () {
    this.fetchData()
  },

  watch: {
    '$route': 'fetchData'
  },

  methods: {
    fetchData: function () {
      this.loading = true

      const req = new SearchReq()
      req.setQuery(this.query)
      client.search(req).then(res => {
        this.loading = false
        this.users = res.toObject().usersList
        console.log(res.toObject())
      }).catch(err => {
        this.loading = false
        console.error(err)
      })
    },
  },
})
</script>
