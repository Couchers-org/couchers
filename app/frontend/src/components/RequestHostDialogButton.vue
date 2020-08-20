<template>
  <v-row justify="center">
    <v-btn text @click.stop="dialog = true" :disabled="sent">{{
      sent ? "Request sent" : "Request to stay"
    }}</v-btn>

    <v-dialog v-model="dialog" max-width="490">
      <v-card>
        <v-card-title class="headline"
          >Request to stay with {{ name }}</v-card-title
        >

        <v-card-text>
          <error-alert :error="error" />
          <p>
            Send a host request to {{ name }}. Remember to read their profile
            carefully and give lots of detail!
          </p>
          <v-menu
            v-model="fromDateMenu"
            :close-on-content-click="false"
            max-width="290px"
            min-width="290px"
            offset-y
          >
            <template v-slot:activator="{ on }">
              <v-text-field
                label="From Date"
                prepend-icon="mdi-calendar"
                readonly
                v-on="on"
                :value="
                  fromDate === null
                    ? ''
                    : new Date(fromDate).toLocaleDateString()
                "
              ></v-text-field>
            </template>
            <v-date-picker
              v-model="fromDate"
              @input="fromDateMenu = false"
              no-title
            ></v-date-picker>
          </v-menu>
          <v-menu
            v-model="toDateMenu"
            :close-on-content-click="false"
            max-width="290px"
            min-width="290px"
            offset-y
          >
            <template v-slot:activator="{ on }">
              <v-text-field
                label="To Date"
                prepend-icon="mdi-calendar"
                readonly
                v-on="on"
                :value="
                  toDate === null ? '' : new Date(toDate).toLocaleDateString()
                "
              ></v-text-field>
            </template>
            <v-date-picker
              v-model="toDate"
              @input="toDateMenu = false"
              no-title
            ></v-date-picker>
          </v-menu>
          <v-textarea label="Message" v-model="message"></v-textarea>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>

          <v-btn color="warning" text @click="dialog = false">Cancel</v-btn>

          <v-btn color="success" text @click="sendRequest" :loading="loading"
            >Send</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-row>
</template>

<script lang="ts">
import Vue, { PropType } from "vue"
import { User } from "../pb/api_pb"

import ErrorAlert from "./ErrorAlert.vue"
import { requestsClient } from "../api"
import { CreateHostRequestReq } from "../pb/requests_pb"

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
    fromDate: null as null | string,
    toDate: null as null | string,
    message: "",

    fromDateMenu: false,
    toDateMenu: false,

    dialog: false,
    sent: false,
    error: null as null | Error | Array<Error>,
    loading: false,
  }),

  methods: {
    sendRequest() {
      this.error = []

      if (this.fromDate == null || this.toDate == null) {
        this.error.push(Error("Please choose a valid date."))
      }

      if (this.message.length < 50) {
        this.error.push(
          Error(
            `Try putting some more detail in your request. You need at least ${
              50 - this.message.length
            } more characters (but probably much more!).`
          )
        )
      }

      if (this.error.length > 0) return

      this.loading = true

      const req = new CreateHostRequestReq()
      req.setToUserId(this.userId)
      req.setFromDate(this.fromDate!)
      req.setToDate(this.toDate!)
      req.setText(this.message)

      requestsClient
        .createHostRequest(req)
        .then(() => {
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
})
</script>
