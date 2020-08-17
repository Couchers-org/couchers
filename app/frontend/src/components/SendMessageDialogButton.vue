<template>
  <v-row justify="center">
    <v-btn text @click.stop="dialog = true" :disabled="sent">{{
      sent ? "Message sent" : "Message"
    }}</v-btn>

    <v-dialog v-model="dialog" max-width="490">
      <v-card>
        <v-card-title class="headline"
          >Send a message {{ name }}</v-card-title
        >

        <v-card-text>
          <error-alert :error="error" />
          <v-textarea label="Message" v-model="message"></v-textarea>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>

          <v-btn color="warning" text @click="dialog = false">Cancel</v-btn>

          <v-btn color="success" text @click="sendMessage" :loading="loading"
            >Send</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-row>
</template>

<script lang="ts">
import Vue, { PropType } from "vue"
import { User } from "@/pb/api_pb"

import ErrorAlert from "./ErrorAlert.vue"
import { conversations } from "../api"
import { SendMessageReq, CreateGroupChatReq } from "../pb/conversations_pb"

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

    dialog: false,
    sent: false,
    error: null as null | Error | Array<Error>,
    loading: false,
  }),

  methods: {
    sendMessage() {
      this.error = []

      if (this.message.length < 1) {
        this.error.push(Error("Enter a message."))
      }

      if (this.error.length > 0) return

      this.loading = true

      const req = new CreateGroupChatReq()
      req.setRecipientUserIdsList([this.userId])
      conversations.createGroupChat(req)
        .then((res) => {
            const req = new SendMessageReq()
            req.setGroupChatId(res.getGroupChatId())
            req.setText(this.message)
            conversations.sendMessage(req)
                .then(() => {
                    this.loading = false
                    this.dialog = false
                    this.sent = true
                }).catch((err: Error) => {
                    this.loading = false
                    this.error = err
                })
        }).catch((err: Error) => {
          this.loading = false
          this.error = err
        })
    },
  },
})
</script>
