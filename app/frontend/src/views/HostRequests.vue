<template>
  <v-main>
    <error-alert :error="error" />
    <v-container>
      <v-row dense>
        <v-col xs="12" md="4">
          <v-card v-if="loading" max-width="450" tile>
            <v-list three-line>
              <v-subheader>Loading...</v-subheader>
            </v-list>
          </v-card>
          <v-container v-if="!loading">
            <v-subheader v-if="!hostRequests.length">No requests.</v-subheader>
            <template v-for="hostRequest in hostRequests">
              <v-card
                :key="hostRequest.hostRequestId"
                @click="selectHostRequest(hostRequest)"
                class="mb-3"
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
          <v-card tile height="600" style="overflow: auto;">
            <v-list dense>
              <template v-for="message in messages">
                <v-list-item
                  v-if="isMyMessage(message)"
                  :key="message.messageId"
                >
                  <v-list-item-content class="py-1 bubble-content">
                    <v-alert
                      :color="messageColor(message)"
                      class="white--text my-0 bubble-alert-mine"
                      dense
                    >
                      <div class="subtitle mb-1">
                        <b>{{ messageAuthor(message) }}</b> at
                        {{ displayTimestamp(message.time) }}
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
                <v-list-item v-else :key="message.messageId">
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
                        <b>{{ messageAuthor(message) }}</b
                        >,
                        {{ displayTimestamp(message.time) }}
                      </div>
                      {{ message.text }}
                    </v-alert>
                  </v-list-item-content>
                </v-list-item>
                <v-list-item
                  v-if="events.has(message.messageId)"
                  :key="'event' + message.messageId.toString()"
                  class="pb-2 bubble-content text-caption"
                >
                  <v-list-item-content
                    :class="{
                      'bubble-alert-mine': isMyMessage(message),
                      'bubble-alert-theirs': !isMyMessage(message),
                    }"
                  >
                    {{
                      displayHostRequestEvent(
                        events.get(message.messageId),
                        userCache[message.authorUserId].getName()
                      )
                    }}
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
          <v-card tile>
            <v-text-field
              v-model="currentMessage"
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

import { handle, displayHostRequestStatus } from "../utils"

import { User, GetUserReq } from "../pb/api_pb"
import {
  GroupChat,
  Message,
  SendMessageReq,
  GetUpdatesReq,
} from "../pb/conversations_pb"
import {
  GetHostRequestMessagesReq,
  ListHostRequestsReq,
  SendHostRequestMessageReq,
  HostRequestEvent,
  HostRequestStatus,
  RespondHostRequestReq,
  GetHostRequestUpdatesReq,
  MarkLastSeenHostRequestReq,
} from "../pb/requests_pb"
import { client, requestsClient } from "../api"
import { mapState } from "vuex"
import { HostRequest } from "../pb/requests_pb"

import ErrorAlert from "../components/ErrorAlert.vue"
import { Timestamp } from "google-protobuf/google/protobuf/timestamp_pb"

export default Vue.extend({
  data: () => ({
    loading: true,
    currentMessage: "",
    hostRequests: [] as Array<HostRequest.AsObject>,
    userCache: {} as { [userId: number]: User },
    selectedHostRequest: null as null | HostRequest.AsObject, // TODO: null by default
    selectedResponse: undefined as undefined | HostRequestStatus,
    messages: [] as Array<Message.AsObject>,
    events: new Map<number, HostRequestEvent.AsObject>(),
    error: null as null | Error,
  }),

  components: {
    ErrorAlert,
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

  created() {
    this.fetchData()
  },

  watch: {
    async selectedHostRequest() {
      this.messages = []
      const messagesReq = new GetHostRequestMessagesReq()
      messagesReq.setHostRequestId(this.selectedHostRequest!.hostRequestId)
      try {
        const res = await requestsClient.getHostRequestMessages(messagesReq)
        this.messages = res.getMessagesList().map((m) => m.toObject())
        res.getEventsList().forEach((event) => {
          this.events.set(event.getAfterMessageId(), event.toObject())
        })
        this.sortMessages()
        this.selectedHostRequest!.lastSeenMessageId = this.messages[
          this.messages.length - 1
        ].messageId
        const markReq = new MarkLastSeenHostRequestReq()
        markReq.setHostRequestId(this.selectedHostRequest!.hostRequestId)
        markReq.setLastSeenMessageId(
          this.selectedHostRequest!.lastSeenMessageId
        )
        await requestsClient.markLastSeenHostRequest(markReq)
        this.$store.dispatch("ping")
      } catch (err) {
        this.error = err
      }
    },
  },

  methods: {
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

    getUser(userId: number): Promise<User> {
      if (!(userId in this.userCache)) {
        const req = new GetUserReq()
        req.setUser(userId.toString())
        return client.getUser(req)
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

          const event = update.getEvent()
          if (event)
            this.events.set(event.getAfterMessageId(), event.toObject())
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

    async fetchData() {
      this.loading = true
      const req = new ListHostRequestsReq()
      try {
        const res = await requestsClient.listHostRequests(req)
        this.hostRequests = res.getHostRequestsList().map((r) => r.toObject())
      } catch (err) {
        this.loading = false
        this.error = err
        return
      }

      const userIds = new Set() as Set<number>
      this.hostRequests.forEach((request) => {
        userIds.add(request.fromUserId)
        userIds.add(request.toUserId)
      })
      userIds.add(this.user.userId)

      try {
        await Promise.all(
          Array.from(userIds).map(async (userId) => {
            const res = await this.getUser(userId)
            this.userCache[res.getUserId()] = res
          })
        )
      } catch (err) {
        this.error = err
      }
      this.loading = false
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
        return user.getColor()
      } else {
        return "red" // TODO
      }
    },

    hostRequestTitle(hostRequest: HostRequest.AsObject) {
      if (hostRequest.fromUserId != this.user.userId) {
        return this.userCache[hostRequest.fromUserId].getName()
      } else {
        return this.userCache[hostRequest.toUserId].getName()
      }
    },

    hostRequestSubtitle(hostRequest: HostRequest.AsObject) {
      const city = this.userCache[hostRequest.toUserId].getCity()
      const from = new Date(hostRequest.fromDate).toLocaleDateString()
      const to = new Date(hostRequest.toDate).toLocaleDateString()
      const status = displayHostRequestStatus(hostRequest.status)
      return `${city}, ${from} - ${to}, ${status}`
    },

    hostRequestPreview(hostRequest: HostRequest.AsObject): [string, string] {
      const message = hostRequest.latestMessage!
      if (message.text == "") return ["No messages", ""]
      const text =
        message.text.length > 30
          ? message.text.substring(0, 30) + "..."
          : message.text
      return [this.messageAuthor(message), ": " + text]
    },

    selectHostRequest(hostRequest: HostRequest.AsObject) {
      this.selectedHostRequest = hostRequest
    },

    messageColor(message: Message.AsObject) {
      const user = this.userCache[message.authorUserId]
      if (!user) {
        return "red"
      }
      return user.getColor()
    },

    messageAuthor(message: Message.AsObject) {
      const user = this.userCache[message.authorUserId]
      if (!user) {
        return "error"
      }
      return user.getName().split(" ")[0]
    },

    messageAvatarText(message: Message.AsObject) {
      const user = this.userCache[message.authorUserId]
      if (!user) {
        return "ERR"
      }
      return user
        .getName()
        .split(" ")
        .map((name) => name[0])
        .join("")
    },

    displayTimestamp(timestamp: Timestamp.AsObject) {
      const date = new Date(timestamp.seconds * 1000)
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

    displayHostRequestEvent(
      hostRequestEvent: HostRequestEvent.AsObject,
      name: string
    ): string {
      switch (hostRequestEvent.eventType) {
        case HostRequestEvent.HostRequestEventType
          .HOST_REQUEST_EVENT_TYPE_CREATED:
          return `${name} created the request.`
        case HostRequestEvent.HostRequestEventType
          .HOST_REQUEST_EVENT_TYPE_ACCEPTED:
          return `${name} accepted the request.`
        case HostRequestEvent.HostRequestEventType
          .HOST_REQUEST_EVENT_TYPE_REJECTED:
          return `${name} rejected the request.`
        case HostRequestEvent.HostRequestEventType
          .HOST_REQUEST_EVENT_TYPE_CONFIRMED:
          return `${name} confirmed the request.`
        case HostRequestEvent.HostRequestEventType
          .HOST_REQUEST_EVENT_TYPE_CANCELLED:
          return `${name} cancelled the request.`
        default:
          return ""
      }
    },

    displayHostRequestStatus,
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
