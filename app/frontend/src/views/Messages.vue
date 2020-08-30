<template>
  <v-main>
    <v-container fluid>
      <v-lazy>
        <new-conversation-dialog
          v-model="newConversationDialog"
          :friends="friends()"
          @created="newConversationCreated"
        />
      </v-lazy>
      <v-lazy>
        <conversation-details-dialog
          v-model="conversationDetailsDialog"
          :conversation="selectedConversationObject()"
          :userId="user.userId"
          :userCache="userCache"
          :friends="friends()"
          @updated-conversation="updatedConversation"
        />
      </v-lazy>
      <error-alert :error="error" />
      <v-row dense>
        <v-col md="4" xs="12">
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
                  <v-avatar color="primary" size="40">
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
                  :class="conversation.groupChatId == selectedConversation ? 'v-list-item--active' : ''"
                >
                  <v-list-item-avatar>
                    <v-avatar
                      :color="conversationAvatar(conversation)"
                      size="40"
                    />
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
        <v-col v-if="selectedConversation != null" md="8" xs="12">
          <v-toolbar elevation="2">
            <v-toolbar-title>
              {{ conversationTitle(selectedConversationObject()) }}
            </v-toolbar-title>
            <v-spacer />
            <v-btn icon @click="conversationDetailsDialog = true">
              <v-icon>mdi-information-outline</v-icon>
            </v-btn>
          </v-toolbar>
          <v-card tile height="600" style="overflow: auto;">
            <v-list dense>
              <template v-for="message in messages">
                <v-list-item
                  v-if="isControlMessage(message)"
                  :key="message.messageId"
                  :id="`msg-${message.messageId}`"
                  class="bubble-content text-caption"
                >
                  <v-list-item-content
                  :class="{
                    'bubble-alert-mine': isMyMessage(message),
                    'bubble-alert-theirs': !isMyMessage(message),
                  }">
                    {{ messageText(message) }}
                  </v-list-item-content>
                </v-list-item>
                <v-list-item
                  v-else-if="isMyMessage(message)"
                  :key="message.messageId"
                  :id="`msg-${message.messageId}`"
                  v-observe-visibility="{
                    callback: (isVisible, entry) => isVisible ? messageVisibilityChanged(message.messageId) : null,
                    throttle: 1000,
                  }"
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
                      {{ messageText(message) }}
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
                  v-observe-visibility="{
                    callback: (isVisible, entry) => isVisible ? messageVisibilityChanged(message.messageId) : null,
                    throttle: 1000,
                  }"
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
                      {{ messageText(message) }}
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
import VueObserveVisibility from 'vue-observe-visibility'

Vue.use(VueObserveVisibility)

import ErrorAlert from "../components/ErrorAlert.vue"

import NewConversationDialog from "./messages/NewConversationDialog.vue"
import ConversationDetailsDialog from "./messages/ConversationDetailsDialog.vue"

import { handle, protobufTimestampToDate } from "../utils"

import { User, GetUserReq } from "../pb/api_pb"
import {
  ListGroupChatsReq,
  GroupChat,
  Message,
  GetGroupChatMessagesReq,
  SendMessageReq,
  GetUpdatesReq,
  GetDirectMessageReq,
  GetGroupChatReq,
  MarkLastSeenGroupChatReq,
} from "../pb/conversations_pb"
import { client, conversations } from "../api"
import { mapState } from "vuex"
import { Empty } from "google-protobuf/google/protobuf/empty_pb"

export default Vue.extend({
  data: () => ({
    error: null as Error | null,
    loading: true,
    friendIds: [] as Array<number>,
    newConversationDialog: false,
    conversationDetailsDialog: false,
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
    NewConversationDialog,
    ConversationDetailsDialog,
  },

  computed: {
    ...mapState(["user"]),
  },

  async created() {
    await this.fetchData()
    if (this.error) return

    try {
      await this.showRouteConversation()
    } catch (err) {
      this.error = err
    }
  },

  watch: {
    async selectedConversation() {
      this.error = null
      this.messages = []
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
      }
    },
    
    async $route(to, from) {
      this.error = null
      try {
        await this.showRouteConversation()
      } catch (err) {
        this.error = err
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
    updatedConversation(conversation: GroupChat.AsObject) {
      const index = this.conversations.findIndex(
        (old) => old.groupChatId == conversation.groupChatId
      )
      if (index > -1) {
        this.conversations[index] = conversation
      }
      this.fetchUpdates()
    },

    selectedConversationObject() {
      return this.conversations.find((e) => e.groupChatId == this.selectedConversation)
    },

    async messageVisibilityChanged(messageId: number) {
      const groupChat = this.selectedConversationObject()
      if (!groupChat) return
      if (groupChat.lastSeenMessageId >= messageId) {
        return
      }
      const req = new MarkLastSeenGroupChatReq()
      req.setGroupChatId(this.selectedConversation!)
      req.setLastSeenMessageId(messageId)
      try {
        await conversations.markLastSeenGroupChat(req)
      } catch (err) {
        return
      }
      groupChat.lastSeenMessageId = messageId
      groupChat.unseenMessageCount = this.messages.length 
                                    - this.messages.findIndex((e) => e.messageId == messageId)
                                    - 1
    },

    async newConversationCreated(chatId: number) {
      await this.fetchData()
      this.selectConversation(chatId)
    },

    async showRouteConversation() {
      //have to fetch the chat and users, because the route chat might
      //not be in the initial chat list
      let groupChat = null as null | GroupChat.AsObject
      if (this.$route.params.dmUserId) {
        const id = parseInt(this.$route.params.dmUserId)
        if (isNaN(id)) {
          throw Error("Invalid user id.")
        }
        const req = new GetDirectMessageReq()
        req.setUserId(id)
        const res = await conversations.getDirectMessage(req)
        groupChat = res.toObject()
      } else if (this.$route.params.groupChatId) {
        const groupChatId = parseInt(this.$route.params.groupChatId)
        if (isNaN(groupChatId)) {
          throw Error("Invalid chat id.")
        }
        const req = new GetGroupChatReq()
        req.setGroupChatId(groupChatId)
        const res = await conversations.getGroupChat(req)
        groupChat = res.toObject()
      } else {
        return
      }
      await Promise.all(groupChat.memberUserIdsList.map((userId) => this.fetchUser(userId)))
      const conversationIndex = this.conversations.findIndex((chat) => chat.groupChatId == groupChat!.groupChatId)
      if (conversationIndex == -1) {
        this.conversations = [groupChat, ...this.conversations]
      }
      this.selectedConversation = groupChat.groupChatId
    },

    handle,

    openNewConversationDialog() {
      this.newConversationDialog = true
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
      this.error = null
      if (!this.selectedConversation) {
        this.error = Error("No conversation selected")
      } else {
        const req = new SendMessageReq()
        req.setGroupChatId(this.selectedConversation)
        req.setText(this.currentMessage)
        try {
          await conversations.sendMessage(req)
          this.currentMessage = ""
          const scrollToBottom = this.selectedConversationObject()?.unseenMessageCount == 0
          await this.fetchUpdates(scrollToBottom)
        } catch (err) {
          this.error = err
        }
      }
    },

    async fetchUpdates(scrollToBottom = false) {
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
        if (scrollToBottom) {
          const lastId = this.messages[this.messages.length - 1].messageId
          this.scrollToId = `msg-${lastId}`
        }
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
      const otherUsersId = conversation.memberUserIdsList.filter(
        (userId) => userId != this.user.userId
      ).sort()
      return conversation.title ||
        otherUsersId.map((id) => this.userCache[id].name.split(" ")[0])
        .join(", ")
    },

    conversationSubtitle(conversation: GroupChat.AsObject) {
      if (!conversation.latestMessage) {
        return "<i>No messages</i>"
      }
      const message = conversation.latestMessage!
      if (this.isControlMessage(message)) {
        return `<i>${this.messageText(message)}</i>`
      } else {
        return `<b>${this.messageAuthor(message)}</b>: ${this.messageText(
          message
        )}`
      }
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

    getName(userId: number) {
      const user = this.userCache[userId]
      if (!user) {
        return "error"
      }
      return user.name.split(" ")[0]
    },

    messageAuthor(message: Message.AsObject) {
      return this.getName(message.authorUserId)
    },

    messageAvatarText(message: Message.AsObject) {
      const user = this.userCache[message.authorUserId]
      if (!user) {
        return "ERR"
      }
      return this.initialsFromName(user.name)
    },

    messageText(message: Message.AsObject) {
      if (this.isControlMessage(message)) {
        return this.controlMessageText(message)
      } else if (message.text) {
        return message.text.text
      } else {
        console.error("Unknown message type")
        return Error("Unknown message type")
      }
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

    isControlMessage(message: Message.AsObject) {
      return !message.text
    },

    isMyMessage(message: Message.AsObject) {
      return (
        message.authorUserId === this.user.userId
      )
    },

    controlMessageText(message: Message.AsObject) {
      const author =
        message.authorUserId === this.user.userId
          ? "You"
          : this.messageAuthor(message)
      if (message.chatCreated !== undefined) {
        return `${author} created the chat`
      } else if (message.chatEdited !== undefined) {
        return `${author} edited the chat`
      } else if (message.userInvited !== undefined) {
        const target = this.getName(message.userInvited.targetUserId)
        return `${author} invited ${target}`
      } else if (message.userLeft !== undefined) {
        return `${author} left the chat`
      } else if (message.userMadeAdmin !== undefined) {
        const target = this.getName(message.userMadeAdmin.targetUserId)
        return `${author} made ${target} an admin`
      } else if (message.userRemovedAdmin !== undefined) {
        const target = this.getName(message.userRemovedAdmin.targetUserId)
        return `${author} removed ${target} as admin`
      }
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
