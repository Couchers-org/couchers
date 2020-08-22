<template>
  <div>
    <v-btn
      class="mx-2"
      fab
      dark
      color="error"
      small
      @click.stop="dialog = true"
    >
      <v-icon dark>mdi-alert-decagram</v-icon>
    </v-btn>

    <v-dialog v-model="dialog" max-width="490">
      <v-card>
        <v-card-title class="headline">Report a problem</v-card-title>
        <v-card-text>
          <error-alert :error="error" />
          <v-text-field
            label="Brief description of the bug"
            v-model="subject"
          ></v-text-field>
          <v-textarea
            label="What's the problem?"
            v-model="description"
          ></v-textarea>
          <v-textarea
            label="What did you do to trigger the bug?"
            v-model="steps"
          ></v-textarea>
          <v-textarea
            label="What happened? What did you expect should have happened?"
            v-model="results"
          ></v-textarea>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="warning" text @click="dialog = false">Cancel</v-btn>
          <v-btn color="success" text @click="sendReport" :loading="loading"
            >Submit</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts">
import Vue, { PropType } from "vue"

import { mapState } from "vuex"

import ErrorAlert from "./ErrorAlert.vue"
import { bugsClient } from "../api"
import { ReportBugReq } from "../pb/bugs_pb"

export default Vue.extend({
  components: {
    ErrorAlert,
  },

  data: () => ({
    subject: "",
    description: "",
    steps: "",
    results: "",

    dialog: false,
    sent: false,
    error: null as null | Error | Array<Error>,
    loading: false,
  }),

  methods: {
    sendReport() {
      this.error = []

      if (this.subject.length < 1) {
        this.error.push(Error("Enter a subject."))
      }

      if (this.error.length > 0) return

      this.loading = true

      const req = new ReportBugReq()
      req.setSubject(this.subject)
      req.setDescription(this.description)
      req.setSteps(this.steps)
      req.setResults(this.results)
      req.setFrontendVersion(process.env.VUE_APP_VERSION)
      req.setUserAgent(navigator.userAgent)
      req.setPage(window.location.href)
      req.setUserId(this.user.userId)
      bugsClient
        .reportBug(req)
        .then((res) => {
          console.log(res.getReportIdentifier())
          this.loading = false
          this.dialog = false
          this.sent = true
        })
        .catch((err: Error) => {
          this.loading = false
          this.error = err
        })
    },
  },

  computed: {
    ...mapState(["user"]),
  },
})
</script>
