<template>
  <v-row justify="center">
    <v-btn text @click.stop="dialog = true" :disabled="sent">{{
      sent ? "Message sent" : "Message"
    }}</v-btn>

    <v-dialog v-model="dialog" max-width="490">
      <v-card>
        <v-card-title class="headline">Send a message {{ name }}</v-card-title>

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
import { User } from "../pb/api_pb"

import ErrorAlert from "./ErrorAlert.vue"
import { conversations } from "../api"
import { SendMessageReq, CreateGroupChatReq, GetDirectMessageReq } from "../pb/conversations_pb"
import { StatusCode } from 'grpc-web'

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
    async sendMessage() {
      this.error = []

      if (this.message.length < 1) {
        this.error.push(Error("Enter a message."))
      }

      if (this.error.length > 0) return

      this.loading = true

      let chatId = null
      try {
        const chatReq = new GetDirectMessageReq()
        chatReq.setUserId(this.userId)
        const chatRes = await conversations.getDirectMessage(chatReq)
        chatId = chatRes.getGroupChatId()
      } catch (err) {
        if (err.code != StatusCode.NOT_FOUND) {
          this.error = err
          return
        }
        const chatReq = new CreateGroupChatReq()
        chatReq.setRecipientUserIdsList([this.userId])
        const chatRes = await conversations.createGroupChat(chatReq)
        chatId = chatRes.getGroupChatId()
      }

      try {
        const messageReq = new SendMessageReq()
        messageReq.setGroupChatId(chatId!)
        messageReq.setText(this.message)
        await conversations.sendMessage(messageReq)
        this.dialog = false
        this.sent = true
        this.$router.push(`/messages/to/${this.userId}`)
      } catch (err) {
        this.error = err
      }
      this.loading = false
    },
  },
})
</script>
