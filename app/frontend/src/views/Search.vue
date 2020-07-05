<template>
  <v-content>
    You searched for "{{ query }}"
    {{ results }}
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

export default Vue.extend({
  data: () => ({
    loading: false,
    results: null
  }),

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
        this.results = res.toObject()
        console.log(res.toObject())
      }).catch(err => {
        this.loading = false
        console.error(err)
      })
    },
  },
})
</script>
