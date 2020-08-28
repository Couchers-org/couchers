<template>
  <v-dialog v-model="open" max-width="600">
    <v-card>
      <error-alert :error="error" />
      <v-card-title class="headline">New conversation</v-card-title>
      <v-card-text>
        <v-autocomplete
          v-model="newConversationParticipants"
          :items="friends"
          :disabled="loading"
          chips
          label="Select friends to message"
          placeholder="Start typing to Search"
          prepend-icon="mdi-account-multiple"
          multiple
        >
          <template v-slot:selection="data">
            <v-chip
              v-bind="data.attrs"
              :input-value="data.selected"
              close
              @click="data.select"
              @click:close="newConversationParticipantsRemove(data.item.value)"
            >
              <v-avatar :color="data.item.avatarColor" size="36" left>
                <span class="white--text">{{ data.item.avatarText }}</span>
              </v-avatar>
              {{ data.item.name }} ({{ data.item.handle }})
            </v-chip>
          </template>
          <template v-slot:item="data">
            <template v-if="typeof data.item !== 'object'">
              <v-list-item-content v-text="data.item"></v-list-item-content>
            </template>
            <template v-else>
              <v-list-item-avatar>
                <v-avatar :color="data.item.avatarColor" size="36">
                  <span class="white--text">
                    {{
                    data.item.avatarText
                    }}
                  </span>
                </v-avatar>
              </v-list-item-avatar>
              <v-list-item-content>
                <v-list-item-title v-html="data.item.name"></v-list-item-title>
                <v-list-item-subtitle v-html="data.item.handle"></v-list-item-subtitle>
              </v-list-item-content>
            </template>
          </template>
        </v-autocomplete>
        <v-text-field
          v-model="newConversationTitle"
          v-if="newConversationParticipants.length > 1"
          :label="
            newConversationParticipants.length == 1
                ? 'Direct messages have no title'
                : 'Group chat title'
            "
          :disabled="newConversationParticipants.length <= 1"
        ></v-text-field>
        <v-textarea v-model="newConversationText" label="Message"></v-textarea>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="green darken-1" text @click="cancelNewConversation()">Cancel</v-btn>
        <v-btn color="green darken-1" text @click="createNewConversation()" :loading="loading">Create chat</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>


<script lang="ts">
import Vue from "vue"
import { CreateGroupChatReq, SendMessageReq } from '@/pb/conversations_pb'
import { conversations } from '@/api'
import wrappers from "google-protobuf/google/protobuf/wrappers_pb"

import ErrorAlert from "../../components/ErrorAlert.vue"

export default Vue.extend({
  data: () => ({
    newConversationParticipants: [] as Array<number>,
    newConversationText: "",
    newConversationTitle: "",
    loading: false,
    error: null as null | Error,
  }),

  props: {
    open: {
      required: true,
      type: Boolean,
    },
    friends: {
      required: true,
      type: Array,
    }
  },

  components: {
    ErrorAlert
  },

  methods: {
    cancelNewConversation() {
      this.newConversationParticipants = []
      this.newConversationText = ""
      this.newConversationTitle = ""
      this.$emit("close")
    },

    async createNewConversation() {
      this.loading = true
      const chatReq = new CreateGroupChatReq()
      const wrapper = new wrappers.StringValue()
      if (this.newConversationParticipants.length > 1 ) {
        chatReq.setTitle(wrapper)
      }
      chatReq.setRecipientUserIdsList(this.newConversationParticipants)
      try {
        const chatRes = await conversations.createGroupChat(chatReq)
        const messageReq = new SendMessageReq()
        messageReq.setGroupChatId(chatRes.getGroupChatId())
        messageReq.setText(this.newConversationText)
        await conversations.sendMessage(messageReq)
        this.$emit("created", chatRes.getGroupChatId())
        this.$emit("close")
      } catch (err) {
        this.error = err
      }
      this.loading = false
    },

    newConversationParticipantsRemove(userId: number) {
      const index = this.newConversationParticipants.indexOf(userId)
      if (index >= 0) {
        this.newConversationParticipants.splice(index, 1)
      }
    },
  },
})
</script>
