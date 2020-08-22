<template>
  <v-main>
    <v-container fluid>
      <v-dialog v-model="newConversationDialog" max-width="600">
        <v-card>
          <v-card-title class="headline">New conversation</v-card-title>
          <v-card-text>
            <v-autocomplete
              v-model="newConversationParticipants"
              :items="friends()"
              :disabled="!loading"
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
                  @click:close="newConversationParticipantsRemove(data.item)"
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
                      <span class="white--text">{{
                        data.item.avatarText
                      }}</span>
                    </v-avatar>
                  </v-list-item-avatar>
                  <v-list-item-content>
                    <v-list-item-title
                      v-html="data.item.name"
                    ></v-list-item-title>
                    <v-list-item-subtitle
                      v-html="data.item.handle"
                    ></v-list-item-subtitle>
                  </v-list-item-content>
                </template>
              </template>
            </v-autocomplete>
            <v-text-field
              v-model="newConversationTitle"
              :label="
                newConversationParticipants.length == 1
                  ? 'Direct messages have no title'
                  : 'Group chat title'
              "
              :disabled="newConversationParticipants.length <= 1"
            ></v-text-field>
            <v-textarea
              v-model="newConversationText"
              label="Message"
            ></v-textarea>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="green darken-1" text @click="cancelNewConversation()"
              >Cancel</v-btn
            >
            <v-btn color="green darken-1" text @click="createNewConversation()"
              >Create chat</v-btn
            >
          </v-card-actions>
        </v-card>
      </v-dialog>
      <error-alert :error="error" />
      <v-row dense>
        <v-col cols="4">
          <v-card tile>
            <v-list v-if="loading" three-line>
              <v-subheader>Loading...</v-subheader>
            </v-list>
            <v-list v-if="!loading" two-line>
              <v-list-item>
                <v-text-field
                  v-model="searchQuery"
                  single-line
                  solo
                  flat
                  hide-details
                  label="Search"
                  prepend-icon="mdi-magnify"
                  v-on:keyup.enter="search"
                ></v-text-field>
              </v-list-item>
              <v-divider></v-divider>
              <v-list-item @click="openNewConversationDialog()">
                <v-list-item-avatar>
                  <v-avatar color="primary">
                    <v-icon color="white">mdi-plus</v-icon>
                  </v-avatar>
                </v-list-item-avatar>
                <v-list-item-content>
                  <v-list-item-title><b>New message</b></v-list-item-title>
                  <v-list-item-subtitle
                    ><i
                      >Start a new group chat or send a direct message</i
                    ></v-list-item-subtitle
                  >
                </v-list-item-content>
              </v-list-item>
              <v-subheader v-if="!conversations.length">Empty!</v-subheader>
              <template v-for="(conversation, index) in conversations">
                <v-divider :key="index + 'divider'"></v-divider>
                <v-list-item
                  :key="conversation.groupChatId"
                  @click="selectConversation(conversation.groupChatId)"
                >
                  <v-list-item-avatar>
                    <v-avatar :color="conversationAvatar(conversation)" />
                  </v-list-item-avatar>
                  <v-list-item-content>
                    <v-list-item-title
                      v-html="conversationTitle(conversation)"
                    ></v-list-item-title>
                    <v-list-item-subtitle
                      v-html="conversationSubtitle(conversation)"
                    ></v-list-item-subtitle>
                  </v-list-item-content>
                  <v-list-item-avatar>
                    <v-chip
                      v-if="conversationChip(conversation)"
                      color="primary"
                      v-text="conversationChip(conversation)"
                      small
                    />
                  </v-list-item-avatar>
                </v-list-item>
              </template>
            </v-list>
          </v-card>
        </v-col>
        <v-col cols="8">
          <v-card tile height="600" style="overflow: auto;">
            <v-subheader v-if="selectedConversation === null"
              >Select a conversation...</v-subheader
            >
            <v-list v-else dense>
              <v-subheader
                >Selected conversation: {{ selectedConversation }}</v-subheader
              >
              <template v-for="message in messages">
                <v-list-item
                  v-if="isMyMessage(message)"
                  :key="message.messageId"
                  :id="`msg-${message.messageId}`"
                >
                  <v-list-item-content class="py-1 bubble-content">
                    <v-alert
                      :color="messageColor(message)"
                      class="white--text my-0 bubble-alert-mine"
                      dense
                    >
                      <div class="subtitle mb-1">
                        <b>{{ messageAuthor(message) }}</b> at
                        {{ messageDisplayTime(message) }}
                      </div>
                      {{ message.text }}
                    </v-alert>
                  </v-list-item-content>
                  <v-list-item-avatar>
                    <v-avatar :color="messageColor(message)" size="36">
                      <span class="white--text">{{
                        messageAvatarText(message)
                      }}</span>
                    </v-avatar>
                  </v-list-item-avatar>
                </v-list-item>
                <v-list-item
                  v-else
                  :key="message.messageId"
                  :id="`msg-${message.messageId}`"
                >
                  <v-list-item-avatar>
                    <v-avatar :color="messageColor(message)" size="36">
                      <span class="white--text">{{
                        messageAvatarText(message)
                      }}</span>
                    </v-avatar>
                  </v-list-item-avatar>
                  <v-list-item-content class="py-1 bubble-content">
                    <v-alert
                      :color="messageColor(message)"
                      class="white--text my-0 bubble-alert-theirs"
                      dense
                    >
                      <div class="subtitle mb-1">
                        <b>{{ messageAuthor(message) }}</b> at
                        {{ messageDisplayTime(message) }}
                      </div>
                      {{ message.text }}
                    </v-alert>
                  </v-list-item-content>
                </v-list-item>
              </template>
            </v-list>
          </v-card>
          <v-card tile>
            <v-text-field
              v-model="currentMessage"
              autofocus
              :disabled="!selectedConversation"
              solo
              flat
              single-line
              hide-details
              label="Send a message"
              append-icon="mdi-send"
              @click:append="sendMessage"
              v-on:keyup.enter="sendMessage"
            ></v-text-field>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </v-main>
</template>

<script lang="ts">
import Vue from "vue"
import moment from "moment"

import ErrorAlert from "../components/ErrorAlert.vue"

import wrappers from "google-protobuf/google/protobuf/wrappers_pb"

import { handle, protobufTimestampToDate } from "../utils"

import { User, GetUserReq } from "../pb/api_pb"
import {
  ListGroupChatsReq,
  GroupChat,
  Message,
  GetGroupChatMessagesReq,
  SendMessageReq,
  GetUpdatesReq,
  CreateGroupChatReq,
} from "../pb/conversations_pb"
import { client, conversations } from "../api"
import { mapState } from "vuex"
import { Empty } from "google-protobuf/google/protobuf/empty_pb"

export default Vue.extend({
  data: () => ({
    error: null as Error | null,
    loading: true,
    newConversationParticipants: [] as Array<number>,
    newConversationText: "",
    newConversationTitle: "",
    friendIds: [] as Array<number>,
    newConversationDialog: false,
    currentMessage: "",
    searchQuery: null as null | string,
    conversations: [] as Array<GroupChat.AsObject>,
    userCache: {} as { [userId: number]: User.AsObject },
    selectedConversation: null as null | number, // TODO: null by default
    messages: [] as Array<Message.AsObject>,
    scrollToId: null as string | null,
  }),

  components: {
    ErrorAlert,
  },

  computed: {
    ...mapState(["user"]),
  },

  created() {
    this.fetchData()
  },

  watch: {
    async selectedConversation() {
      this.messages = []
      console.debug("Selected conversation changed, fetching messages")
      const req = new GetGroupChatMessagesReq()
      req.setGroupChatId(this.selectedConversation!)
      try {
        const res = await conversations.getGroupChatMessages(req)
        this.messages = res.getMessagesList().map((msg) => msg.toObject())
        this.sortMessages()
        const groupChat = this.conversations.filter(
          (groupChat) => groupChat.groupChatId === this.selectedConversation
        )[0]
        this.scrollToId = `msg-${groupChat.lastSeenMessageId}`
      } catch (err) {
        this.error = err
        console.error(err)
      }
    },
  },

  updated() {
    if (this.scrollToId) {
      const el = document.getElementById(this.scrollToId)
      if (el) {
        el.scrollIntoView()
        this.scrollToId = null
      }
    }
  },

  methods: {
    handle,

    cancelNewConversation() {
      this.newConversationParticipants = []
      this.newConversationText = ""
      this.newConversationTitle = ""
      this.newConversationDialog = false
    },

    openNewConversationDialog() {
      this.newConversationDialog = true
    },

    async createNewConversation() {
      const chatReq = new CreateGroupChatReq()
      const wrapper = new wrappers.StringValue()
      wrapper.setValue(this.newConversationTitle)
      chatReq.setTitle(wrapper)
      console.log(this.newConversationParticipants)
      chatReq.setRecipientUserIdsList(this.newConversationParticipants)
      this.loading = true
      try {
        const chatRes = await conversations.createGroupChat(chatReq)
        const messageReq = new SendMessageReq()
        messageReq.setGroupChatId(chatRes.getGroupChatId())
        messageReq.setText(this.newConversationText)
        await conversations.sendMessage(messageReq)
        this.fetchData()
        // close the dialog
        this.cancelNewConversation()
      } catch (err) {
        this.error = err
      }
      this.loading = false
    },

    newConversationParticipantsRemove(userId: number) {
      const index = this.friendIds.indexOf(userId)
      if (index >= 0) {
        this.friendIds.splice(index, 1)
      }
    },

    sortMessages() {
      this.messages = this.messages.sort((f, s) => f.messageId - s.messageId)
    },

    async fetchUser(userId: number) {
      if (!(userId in this.userCache)) {
        const req = new GetUserReq()
        req.setUser(userId.toString())
        try {
          const res = await client.getUser(req)
          this.userCache[res.getUserId()] = res.toObject()
        } catch (err) {
          this.error = err
        }
      }
    },

    search() {
      console.debug("Search for", this.searchQuery)
      // TODO
    },

    async sendMessage() {
      if (!this.selectedConversation) {
        this.error = Error("No conversation selected")
      } else {
        const req = new SendMessageReq()
        req.setGroupChatId(this.selectedConversation)
        req.setText(this.currentMessage)
        try {
          await conversations.sendMessage(req)
          this.currentMessage = ""
          this.fetchUpdates()
        } catch (err) {
          this.error = err
        }
      }
    },

    async fetchUpdates() {
      const req = new GetUpdatesReq()
      req.setNewestMessageId(
        Math.max(0, ...this.messages.map((msg) => msg.messageId))
      )
      try {
        const res = await conversations.getUpdates(req)
        res
          .getUpdatesList()
          .filter(
            (update) => update.getGroupChatId() === this.selectedConversation
          )
          .map((update) => update.getMessage()!)
          .forEach((msg) => {
            this.messages.push(msg.toObject())
          })
        this.sortMessages()
      } catch (err) {
        this.error = err
      }
    },

    async fetchData() {
      this.loading = true
      const chatsReq = new ListGroupChatsReq()
      try {
        const chatsRes = await conversations.listGroupChats(chatsReq)
        this.conversations = chatsRes
          .getGroupChatsList()
          .map((chat) => chat.toObject())
        const userIds = new Set() as Set<number>
        this.conversations.forEach((conv) => {
          conv.memberUserIdsList.forEach((userId) => userIds.add(userId))
        })

        const friendsRes = await client.listFriends(new Empty())
        this.friendIds = friendsRes.getUserIdsList()

        await Promise.all(
          [...Array.from(userIds), ...this.friendIds].map(this.fetchUser)
        )
      } catch (err) {
        this.error = err
      }
      this.loading = false
    },

    friends(): Array<any> {
      return this.friendIds
        .filter((friendId) => friendId in this.userCache)
        .map((friendId) => {
          const user = this.userCache[friendId]
          return {
            value: user.userId,
            name: user.name,
            handle: handle(user.username),
            avatarColor: user.color,
            avatarText: this.initialsFromName(user.name),
          }
        })
    },

    conversationChip(conversation: GroupChat.AsObject) {
      return conversation.unseenMessageCount
    },

    conversationAvatar(conversation: GroupChat.AsObject) {
      if (!conversation.latestMessage) {
        return "primary"
      }
      const user = this.userCache[conversation.latestMessage!.authorUserId]
      if (!user) {
        return "primary"
      }
      return user.color
    },

    conversationTitle(conversation: GroupChat.AsObject) {
      if (conversation.isDm) {
        const otherUserId = conversation.memberUserIdsList.filter(
          (userId) => userId != this.user.userId
        )[0]
        const otherUser = this.userCache[otherUserId]
        return `${otherUser.name} (${handle(otherUser.username)})`
      }
      return conversation.title || "<i>Untitled</i>"
    },

    conversationSubtitle(conversation: GroupChat.AsObject) {
      if (!conversation.latestMessage) {
        return "<i>No messages</i>"
      }
      const message = conversation.latestMessage!
      return `<b>${this.messageAuthor(message)}</b>: ${message.text}`
    },

    selectConversation(conversationId: number) {
      this.selectedConversation = conversationId
    },

    messageColor(message: Message.AsObject) {
      const user = this.userCache[message.authorUserId]
      if (!user) {
        return "red"
      }
      return user.color
    },

    messageAuthor(message: Message.AsObject) {
      const user = this.userCache[message.authorUserId]
      if (!user) {
        return "error"
      }
      return user.name.split(" ")[0]
    },

    messageAvatarText(message: Message.AsObject) {
      const user = this.userCache[message.authorUserId]
      if (!user) {
        return "ERR"
      }
      return this.initialsFromName(user.name)
    },

    initialsFromName(name: string): string {
      return name
        .split(" ")
        .map((word) => word[0])
        .join("")
    },

    messageDisplayTime(message: Message.AsObject) {
      const date = protobufTimestampToDate(message.time!)
      if (new Date().getTime() - date.getTime() > 120 * 60 * 1000) {
        // longer than 2h ago, display as absolute
        return moment(date).format("lll")
      } else {
        // relative
        return moment(date).fromNow()
      }
    },

    isMyMessage(message: Message.AsObject) {
      return message.authorUserId === this.user.userId
    },
  },
})
</script>

<style scoped>
.bubble-content {
  display: block;
}

.bubble-alert-theirs {
  float: left;
}

.bubble-alert-mine {
  float: right;
}
</style>
