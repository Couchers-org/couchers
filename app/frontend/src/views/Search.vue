<template>
  <v-content>
    <error-alert :error="error" />
    <h1>Search results for "{{ query }}"</h1>
    <div v-if="!loading">
      <user-search-result v-for="user in users" :key="user.id" :user="user" />
      <p v-if="!users.length">No results!</p>
    </div>
    <v-container fill-height>
      <loading-circular :loading="loading" />
    </v-container>
  </v-content>
</template>

<script lang="ts">
import Vue from "vue"

import { SearchReq } from "../pb/api_pb"
import { client } from "../api"

import UserSearchResult from "../components/UserSearchResult.vue"
import ErrorAlert from "../components/ErrorAlert.vue"
import LoadingCircular from "../components/LoadingCircular.vue"

export default Vue.extend({
  data: () => ({
    loading: false,
    users: null,
    error: null,
  }),

  components: {
    UserSearchResult,
    ErrorAlert,
    LoadingCircular,
  },

  computed: {
    query() {
      return this.$route.query.q
    },
  },

  created() {
    this.fetchData()
  },

  watch: {
    $route: "fetchData",
  },

  methods: {
    fetchData() {
      this.loading = true

      const req = new SearchReq()
      req.setQuery(this.query)
      client
        .search(req)
        .then((res) => {
          this.loading = false
          this.users = res.toObject().usersList
          console.log(res.toObject())
        })
        .catch((err) => {
          this.loading = false
          this.error = err
        })
    },
  },
})
</script>
