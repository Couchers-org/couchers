<template>
  <div>
    <v-snackbar v-model="successVisible" color="success" top>
      <b>Thank you</b> for reporting that bug, it was sent to the devs! The bug
      ID is <b>{{ reportIdentifier }}</b
      >.
      <template v-slot:action="{ attrs }">
        <v-btn dark text v-bind="attrs" @click="successVisible = false"
          >Close</v-btn
        >
      </template>
    </v-snackbar>

    <v-btn
      class="mx-2 d-sm-none"
      fab
      dark
      color="error"
      small
      @click.stop="dialog = true"
      :disabled="sent"
    >
      <v-icon dark>mdi-alert-decagram</v-icon>
    </v-btn>

    <v-btn
      class="mx-2 d-none d-sm-block"
      rounded
      dark
      color="error"
      @click.stop="dialog = true"
      :disabled="sent"
    >
      <v-icon dark left>mdi-alert-decagram</v-icon> Report a bug
    </v-btn>

    <v-dialog v-model="dialog" max-width="490">
      <v-card>
        <v-form ref="form" @submit.prevent="sendReport" v-model="formValid">
          <v-card-title class="headline">Report a problem</v-card-title>
          <v-card-text>
            <error-alert :error="error" />
            <v-text-field
              label="Brief description of the bug"
              v-model="subject"
              :rules="[rules.required]"
            ></v-text-field>
            <v-textarea
              label="What's the problem?"
              v-model="description"
              :rules="[rules.required]"
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
            <v-btn
              color="success"
              text
              @click="sendReport"
              :loading="loading"
              :disabled="!formValid"
              >Submit</v-btn
            >
          </v-card-actions>
        </v-form>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts">
import Vue from "vue"

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

    successVisible: false,
    reportIdentifier: "",

    formValid: false,
    rules: {
      required: (value: string) => !!value || "Required.",
    },
  }),

  watch: {
    $route(to, from) {
      this.sent = false
    },
  },

  methods: {
    sendReport() {
      this.error = []

      // there are no types for VForm :/
      const form = this.$refs.form as any

      if (!form.validate()) {
        // this shouldn't happen since the button should be disabled if invalid
        this.error = Error("Please fill in all required fields")
        return
      }

      this.loading = true

      const req = new ReportBugReq()
      req.setSubject(this.subject)
      req.setDescription(this.description)
      req.setSteps(this.steps)
      req.setResults(this.results)
      req.setFrontendVersion(process.env.VUE_APP_VERSION)
      req.setUserAgent(navigator.userAgent)
      req.setPage(window.location.href)
      if (this.user) {
        req.setUserId(this.user.userId)
      }
      bugsClient
        .reportBug(req)
        .then((res) => {
          this.reportIdentifier = res.getReportIdentifier()
          this.successVisible = true
          this.loading = false
          this.dialog = false
          this.sent = true
          form.reset()
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
