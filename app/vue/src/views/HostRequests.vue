<template>
  <v-main>
    <error-alert :error="error" />
    <v-container>
      <v-row dense>
        <v-col xs="12" md="4">
          <v-container>
            <v-subheader v-if="!hostRequests.length">No requests.</v-subheader>
            <template v-for="hostRequest in hostRequests">
              <v-card
                :key="hostRequest.hostRequestId"
                @click="selectHostRequest(hostRequest)"
                :class="{
                  'mb-3': true,
                  'v-list-item--active':
                    selectedHostRequest &&
                    hostRequest.hostRequestId ==
                      selectedHostRequest.hostRequestId,
                }"
              >
                <v-card-title class="mb-2">
                  <v-avatar
                    :color="hostRequestAvatar(hostRequest)"
                    class="mr-2"
                  />
                  <span
                    :class="{
                      headline: true,
                      'font-weight-bold': hostRequestHasNew(hostRequest),
                    }"
                  >
                    {{ hostRequestTitle(hostRequest) }}
                  </span>
                </v-card-title>
                <v-card-subtitle class="text-subtitle-1">
                  {{ hostRequestSubtitle(hostRequest) }}
                </v-card-subtitle>
                <v-card-text>
                  <strong>{{ hostRequestPreview(hostRequest)[0] }}</strong>
                  {{ hostRequestPreview(hostRequest)[1] }}
                </v-card-text>
              </v-card>
            </template>
            <v-list-item v-if="!noMoreRequests">
              <v-list-item-content>
                <v-btn
                  text
                  @click="() => fetchData()"
                  :loading="loadingMoreRequests"
                >
                  Load more...
                </v-btn>
              </v-list-item-content>
            </v-list-item>
          </v-container>
        </v-col>
        <v-col xs="12" md="8" v-if="selectedHostRequest != null">
          <v-card tile>
            <v-card-text>
              This host request is
              <strong>{{
                displayHostRequestStatus(selectedHostRequest.status)
              }}</strong
              >.
            </v-card-text>
          </v-card>
          <!-- TODO: No fixed height -->
          <v-card
            v-scroll.self="scrolled"
            tile
            height="600"
            style="overflow: auto"
          >
            <v-list dense>
              <v-list-item v-if="!noMoreMessages">
                <v-list-item-content>
                  <v-btn
                    text
                    @click="() => loadMessages()"
                    :loading="loadingMoreMessages"
                  >
                    Load more...
                  </v-btn>
                </v-list-item-content>
              </v-list-item>

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
                    }"
                  >
                    {{ messageText(message) }}
                  </v-list-item-content>
                </v-list-item>
                <v-list-item
                  v-else-if="isMyMessage(message)"
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
          <v-card tile v-if="hostRequestButtons.length > 0">
            <v-card-text>
              <v-item-group v-model="selectedResponse">
                <v-row justify="space-around">
                  <v-item
                    v-for="[label, response] in hostRequestButtons"
                    :key="response"
                    :value="response"
                    #default="{ active, toggle }"
                  >
                    <v-checkbox
                      @change="toggle(!active)"
                      :input-value="active"
                      :label="label"
                    />
                  </v-item>
                </v-row>
              </v-item-group>
            </v-card-text>
          </v-card>
          <message-entry-field
            v-model="currentMessage"
            :disabled="!selectedHostRequest"
            @send="sendMessage"
          />
        </v-col>
      </v-row>
    </v-container>
  </v-main>
</template>

<script lang="ts">
import Vue from "vue"
import moment from "moment"

import { handle, displayHostRequestStatus } from "../utils"

import { User, GetUserReq } from "../pb/api_pb"
import {
  GroupChat,
  Message,
  SendMessageReq,
  GetUpdatesReq,
  HostRequestStatus,
} from "../pb/conversations_pb"
import {
  GetHostRequestMessagesReq,
  ListHostRequestsReq,
  SendHostRequestMessageReq,
  RespondHostRequestReq,
  GetHostRequestReq,
  GetHostRequestUpdatesReq,
  MarkLastSeenHostRequestReq,
} from "../pb/requests_pb"
import { client, requestsClient } from "../api"
import { mapState } from "vuex"
import { HostRequest } from "../pb/requests_pb"

import ErrorAlert from "../components/ErrorAlert.vue"
import MessageEntryField from "../components/MessageEntryField.vue"
import { Timestamp } from "google-protobuf/google/protobuf/timestamp_pb"

import {
  UserCache,
  messageColor,
  getName,
  messageAuthor,
  messageAvatarText,
  messageText,
  initialsFromName,
  messageDisplayTime,
  isControlMessage,
  isMyMessage,
  controlMessageText,
} from "../message-utils"

export default Vue.extend({
  data: () => ({
    loading: true,
    currentMessage: "",
    hostRequests: [] as Array<HostRequest.AsObject>,
    userCache: {} as UserCache,
    selectedHostRequest: null as null | HostRequest.AsObject, // TODO: null by default
    selectedResponse: undefined as undefined | HostRequestStatus,
    messages: [] as Array<Message.AsObject>,
    error: null as null | Error,
    loadingMoreMessages: false,
    noMoreMessages: false,
    loadingMoreRequests: true,
    noMoreRequests: false,
  }),

  components: {
    ErrorAlert,
    MessageEntryField,
  },

  computed: {
    hostRequestButtons(): Array<[string, HostRequestStatus]> {
      const status = this.selectedHostRequest!.status
      const buttons = [] as Array<[string, HostRequestStatus]>
      if (this.selectedHostRequest!.toUserId == this.user.userId) {
        //we are the host
        if (status == HostRequestStatus.HOST_REQUEST_STATUS_CANCELLED)
          return buttons

        if (
          status == HostRequestStatus.HOST_REQUEST_STATUS_PENDING ||
          status == HostRequestStatus.HOST_REQUEST_STATUS_REJECTED
        )
          buttons.push([
            displayHostRequestStatus(
              HostRequestStatus.HOST_REQUEST_STATUS_ACCEPTED
            ),
            HostRequestStatus.HOST_REQUEST_STATUS_ACCEPTED,
          ])

        if (status != HostRequestStatus.HOST_REQUEST_STATUS_REJECTED)
          buttons.push([
            displayHostRequestStatus(
              HostRequestStatus.HOST_REQUEST_STATUS_REJECTED
            ),
            HostRequestStatus.HOST_REQUEST_STATUS_REJECTED,
          ])
      } else {
        //we are the hostee
        if (status == HostRequestStatus.HOST_REQUEST_STATUS_CANCELLED)
          return buttons

        if (status == HostRequestStatus.HOST_REQUEST_STATUS_ACCEPTED)
          buttons.push([
            displayHostRequestStatus(
              HostRequestStatus.HOST_REQUEST_STATUS_CONFIRMED
            ),
            HostRequestStatus.HOST_REQUEST_STATUS_CONFIRMED,
          ])

        buttons.push([
          displayHostRequestStatus(
            HostRequestStatus.HOST_REQUEST_STATUS_CANCELLED
          ),
          HostRequestStatus.HOST_REQUEST_STATUS_CANCELLED,
        ])
      }
      return buttons
    },
    ...mapState(["user"]),
  },

  async created() {
    await this.fetchData(true)

    try {
      await this.showRouteHostRequest()
    } catch (err) {
      this.error = err
    }
  },

  watch: {
    async selectedHostRequest(to, from) {
      if (to !== from) {
        this.messages = []
      }
      await this.loadMessages()
    },

    async $route(to, from) {
      this.error = null
      try {
        await this.showRouteHostRequest()
      } catch (err) {
        this.error = err
      }
    },
  },

  methods: {
    async scrolled(e: Event) {
      if ((e.target as HTMLElement).scrollTop > 0) return
      if (this.loadingMoreMessages) return
      if (this.noMoreMessages) return
      //avoid race condition - this point can be reached
      //when switching selected conversation
      if (this.messages.length == 0) return
      await this.loadMessages()
    },

    async loadMessages() {
      this.loadingMoreMessages = true
      const messagesReq = new GetHostRequestMessagesReq()
      messagesReq.setHostRequestId(this.selectedHostRequest!.hostRequestId)
      let scrollId = null
      if (this.messages.length > 0) {
        messagesReq.setLastMessageId(this.messages[0].messageId)
        scrollId = `msg-${this.messages[0].messageId}`
      }
      try {
        const res = await requestsClient.getHostRequestMessages(messagesReq)
        this.messages = [
          ...res.getMessagesList().map((m) => m.toObject()),
          ...this.messages,
        ]
        this.noMoreMessages = res.getNoMore()
        this.sortMessages()

        const lastMessageId = this.messages[this.messages.length - 1].messageId

        if (this.selectedHostRequest!.lastSeenMessageId < lastMessageId) {
          this.selectedHostRequest!.lastSeenMessageId = lastMessageId
          const markReq = new MarkLastSeenHostRequestReq()
          markReq.setHostRequestId(this.selectedHostRequest!.hostRequestId)
          markReq.setLastSeenMessageId(
            this.selectedHostRequest!.lastSeenMessageId
          )
          await requestsClient.markLastSeenHostRequest(markReq)
          this.$store.dispatch("ping")
        }
      } catch (err) {
        this.error = err
      }
      this.loadingMoreMessages = false
      if (scrollId) {
        const el = document.getElementById(scrollId)
        if (el) {
          el.scrollIntoView()
        }
      }
    },

    async showRouteHostRequest() {
      //have to fetch the request and user, because it might
      //not be in the initial request list
      if (!this.$route.params.hostRequestId) return

      const id = parseInt(this.$route.params.hostRequestId)
      if (isNaN(id)) {
        throw Error("Invalid user id.")
      }
      const req = new GetHostRequestReq()
      req.setHostRequestId(id)
      const res = await requestsClient.getHostRequest(req)
      const hostRequest = res.toObject()

      await Promise.all([
        this.getUser(hostRequest.fromUserId),
        this.getUser(hostRequest.toUserId),
      ])
      const hostRequestIndex = this.hostRequests.findIndex(
        (request) => request.hostRequestId == hostRequest.hostRequestId
      )
      if (hostRequestIndex == -1) {
        this.hostRequests = [hostRequest, ...this.hostRequests]
      }
      this.selectedHostRequest = hostRequest
    },

    handle,
    /// TODO: Shouldn't this be already sorted from the backend?
    sortMessages() {
      this.messages = this.messages.sort(
        (f, s) =>
          f.time!.seconds +
          f.time!.nanos * 1e-9 -
          (s.time!.seconds + s.time!.nanos * 1e-9)
      )
    },

    async getUser(userId: number): Promise<User.AsObject> {
      if (!(userId in this.userCache)) {
        const req = new GetUserReq()
        req.setUser(userId.toString())
        const user = await client.getUser(req)
        return user.toObject()
      } else {
        return Promise.resolve(this.userCache[userId])
      }
    },

    async sendMessage() {
      this.error = null
      if (this.currentMessage == "" && this.selectedResponse) {
        this.error = Error("Add a message to go with your response.")
        return
      }

      if (this.selectedResponse === undefined) {
        const req = new SendHostRequestMessageReq()
        req.setHostRequestId(this.selectedHostRequest!.hostRequestId)
        req.setText(this.currentMessage)
        try {
          const res = await requestsClient.sendHostRequestMessage(req)
          this.currentMessage = ""
          this.fetchUpdates()
        } catch (err) {
          this.error = err
        }
      } else {
        const req = new RespondHostRequestReq()
        req.setHostRequestId(this.selectedHostRequest!.hostRequestId)
        req.setStatus(this.selectedResponse)
        req.setText(this.currentMessage)
        try {
          await requestsClient.respondHostRequest(req)
          this.currentMessage = ""
          this.fetchUpdates()
        } catch (err) {
          this.error = err
        }
      }
    },

    async fetchUpdates() {
      // TODO: This function is abosolutely disgusting and I am ashamed

      const req = new GetHostRequestUpdatesReq()
      req.setNewestMessageId(
        Math.max(0, ...this.messages.map((msg) => msg.messageId))
      )
      let updatesRes = null
      try {
        updatesRes = await requestsClient.getHostRequestUpdates(req)
      } catch (err) {
        this.error = err
        return
      }

      const markReqs = new Map<number, MarkLastSeenHostRequestReq>()

      updatesRes.getUpdatesList().forEach((update) => {
        if (
          update.getHostRequestId() === this.selectedHostRequest!.hostRequestId
        ) {
          this.messages.push(update.getMessage()!.toObject())
        }
        const updatedRequest = this.hostRequests.find(
          (request) => request.hostRequestId == update.getHostRequestId()
        )
        if (updatedRequest) {
          updatedRequest.status = update.getStatus()
          updatedRequest.latestMessage = update.getMessage()!.toObject()
          if (
            updatedRequest.lastSeenMessageId <
            updatedRequest.latestMessage.messageId
          ) {
            updatedRequest.lastSeenMessageId =
              updatedRequest.latestMessage.messageId
            markReqs.set(
              updatedRequest.hostRequestId,
              new MarkLastSeenHostRequestReq()
            )
            markReqs
              .get(updatedRequest.hostRequestId)
              ?.setHostRequestId(updatedRequest.hostRequestId)
            markReqs
              .get(updatedRequest.hostRequestId)
              ?.setLastSeenMessageId(updatedRequest.latestMessage.messageId)
          }
        }
      })
      this.sortMessages()
      await Promise.all(
        Array.from(markReqs.values()).map((req) =>
          requestsClient.markLastSeenHostRequest(req)
        )
      )
      this.$store.dispatch("ping")
    },

    async fetchData(clear = false) {
      this.loadingMoreRequests = true
      if (clear) this.hostRequests = []
      let dirtyRequests = []
      const req = new ListHostRequestsReq()
      if (this.hostRequests.length > 0) {
        const lastRequest = this.hostRequests[this.hostRequests.length - 1]
        req.setLastMessageId(lastRequest.latestMessage!.messageId)
      }
      try {
        const res = await requestsClient.listHostRequests(req)
        dirtyRequests = res.getHostRequestsList().map((r) => r.toObject())
        this.noMoreRequests = res.getNoMore()
      } catch (err) {
        this.loading = false
        this.error = err
        return
      }

      const userIds = new Set() as Set<number>
      dirtyRequests.forEach((request) => {
        userIds.add(request.fromUserId)
        userIds.add(request.toUserId)
      })
      userIds.add(this.user.userId)

      try {
        await Promise.all(
          Array.from(userIds).map(async (userId) => {
            const res = await this.getUser(userId)
            this.userCache[res.userId] = res
          })
        )
      } catch (err) {
        this.error = err
      }
      this.hostRequests = [...this.hostRequests, ...dirtyRequests]
      this.loadingMoreRequests = false
    },

    hostRequestHasNew(hostRequest: HostRequest.AsObject) {
      if (
        hostRequest.lastSeenMessageId <
        (hostRequest.latestMessage?.messageId || 0)
      ) {
        return true
      } else {
        return false
      }
    },

    hostRequestAvatar(conversation: HostRequest.AsObject) {
      const user = this.userCache[conversation.latestMessage!.authorUserId]
      if (user) {
        return user.color
      } else {
        return "red" // TODO
      }
    },

    hostRequestTitle(hostRequest: HostRequest.AsObject) {
      if (hostRequest.fromUserId != this.user.userId) {
        return this.userCache[hostRequest.fromUserId].name
      } else {
        return this.userCache[hostRequest.toUserId].name
      }
    },

    hostRequestSubtitle(hostRequest: HostRequest.AsObject) {
      const city = this.userCache[hostRequest.toUserId].city
      const from = new Date(hostRequest.fromDate).toLocaleDateString()
      const to = new Date(hostRequest.toDate).toLocaleDateString()
      const status = displayHostRequestStatus(hostRequest.status)
      return `${city}, ${from} - ${to}, ${status}`
    },

    hostRequestPreview(hostRequest: HostRequest.AsObject): [string, string] {
      const message = hostRequest.latestMessage!
      //putting in `` pleases the linting gods
      const text = `${this.messageText(message)}`
      const truncatedText =
        text.length > 30 ? text.substring(0, 30) + "..." : text
      return [`${this.messageAuthor(message)}`, ": " + truncatedText]
    },

    displayHostRequestStatus,

    selectHostRequest(hostRequest: HostRequest.AsObject) {
      this.selectedHostRequest = hostRequest
    },

    messageColor(message: Message.AsObject) {
      return messageColor(message, this.userCache)
    },

    getName(userId: number) {
      return getName(userId, this.userCache)
    },

    messageAuthor(message: Message.AsObject) {
      return messageAuthor(message, this.userCache)
    },

    messageAvatarText(message: Message.AsObject) {
      return messageAvatarText(message, this.userCache)
    },

    messageText(message: Message.AsObject) {
      return messageText(message, this.user.userId, this.userCache)
    },

    initialsFromName,

    messageDisplayTime,

    isControlMessage,

    isMyMessage(message: Message.AsObject) {
      return isMyMessage(message, this.user.userId)
    },

    controlMessageText(message: Message.AsObject) {
      return controlMessageText(message, this.user.userId, this.userCache)
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
