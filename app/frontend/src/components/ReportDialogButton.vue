<template>
  <v-row justify="center">
    <v-btn text @click.stop="dialog = true" :disabled="sent">{{
      sent ? "Report sent" : "Report"
    }}</v-btn>

    <v-dialog v-model="dialog" max-width="490">
      <v-card>
        <v-card-title class="headline">Report {{ name }}</v-card-title>

        <v-card-text>
          <error-alert :error="error" />
          <p>
            You can anonymously report {{ name || "this user" }} to moderators.
            Give as much detail as you can and are comfortable with.
          </p>
          <v-text-field label="Reason" v-model="reason"></v-text-field>
          <v-textarea label="Details" v-model="description"></v-textarea>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>

          <v-btn color="warning" text @click="dialog = false">Cancel</v-btn>

          <v-btn color="success" text @click="sendReport" :loading="loading"
            >Send</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-row>
</template>

<script lang="ts">
import Vue from "vue"
import { ReportReq } from "@/pb/api_pb"

import ErrorAlert from "./ErrorAlert.vue"
import { client } from "@/api"

export default Vue.extend({
  props: {
    name: {
      type: String,
      required: true,
    },
    userId: {
      type: Number,
      required: true,
    },
  },

  components: {
    ErrorAlert,
  },

  data: () => ({
    dialog: false,
    sent: false,
    reason: "",
    description: "",
    error: null as null | Error,
    loading: false,
  }),

  methods: {
    sendReport() {
      this.loading = true
      const req = new ReportReq()
      req.setReportedUserId(this.userId)
      req.setReason(this.reason)
      req.setDescription(this.description)

      client
        .report(req)
        .then(() => {
          this.loading = false
          this.dialog = false
          this.sent = true
        })
        .catch((err) => {
          this.loading = false
          this.error = err
        })
    },
  },
})
</script>
