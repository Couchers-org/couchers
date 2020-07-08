<template>
  <v-content>
    <error-alert :error="error" />
    <v-container fluid>
      <v-card class="float-left mx-3 my-3" width="350" outlined>
        <v-sheet height="80" :color="user.color" tile></v-sheet>
        <v-card-title>{{ user.name }}</v-card-title>
        <v-card-subtitle>{{ user.city }}</v-card-subtitle>
        <v-list-item two-item>
          <v-list-item-icon>
            <v-icon>mdi-account-multiple</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>
              {{ friendsDisplay }}
              <v-btn
                v-if="!this.user.friends"
                class="mx-1 my-1"
                :loading="sendingFriendRequest"
                color="primary"
                @click="sendFriendRequest"
              >
                <v-icon left>mdi-account-plus</v-icon> Send friend request
              </v-btn>
            </v-list-item-title>
            <v-list-item-subtitle>Friendship</v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
        <v-list-item two-item>
          <v-list-item-icon>
            <v-icon>mdi-account-check</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Verification (coming soon)</v-list-item-title>
            <v-list-item-subtitle
              ><v-progress-linear
                class="my-2"
                height="12"
                rounded
                value="0"
                color="light-green"
              ></v-progress-linear
            ></v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
        <v-list-item two-item>
          <v-list-item-icon>
            <v-icon>mdi-account-group</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title
              >Community standing (coming soon)</v-list-item-title
            >
            <v-list-item-subtitle
              ><v-progress-linear
                class="my-2"
                height="12"
                rounded
                value="0"
                color="light-blue"
              ></v-progress-linear
            ></v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
        <v-list-item>
          <v-list-item-icon>
            <v-icon>mdi-forum</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title
              >{{ user.numReferences }} references</v-list-item-title
            >
          </v-list-item-content>
        </v-list-item>
        <v-list-item two-item>
          <v-list-item-icon>
            <v-icon>mdi-translate</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>{{ languagesListDisplay }}</v-list-item-title>
            <v-list-item-subtitle>Languages</v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
        <v-list-item two-item>
          <v-list-item-icon>
            <v-icon>mdi-ship-wheel</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title
              >{{ user.gender }}, {{ user.age }}</v-list-item-title
            >
            <v-list-item-subtitle>Age and gender</v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
        <v-list-item two-item>
          <v-list-item-icon>
            <v-icon>mdi-briefcase</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>{{ user.occupation }}</v-list-item-title>
            <v-list-item-subtitle>Occupation</v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
        <v-list-item two-item>
          <v-list-item-icon>
            <v-icon>mdi-account-clock</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title
              >Last active {{ lastActiveDisplay }}</v-list-item-title
            >
            <v-list-item-subtitle
              >Joined {{ joinedDisplay }}</v-list-item-subtitle
            >
          </v-list-item-content>
        </v-list-item>
        <v-divider></v-divider>
        <v-card-actions>
          <v-btn text>Message</v-btn>
        </v-card-actions>
      </v-card>
      <v-card class="float-left mx-3 my-3" width="950" outlined>
        <v-card-text>
          <v-tabs class="mb-5">
            <v-tab>About me</v-tab>
            <v-tab>References</v-tab>
            <v-tab>Friends</v-tab>
            <v-tab>Photos</v-tab>
          </v-tabs>
          <h3>About me</h3>
          <p>{{ user.aboutMe }}</p>
          <h3>About my place</h3>
          <p>{{ user.aboutPlace }}</p>
          <h3>Countries I've visited</h3>
          <p>{{ countriesVisitedListDisplay }}</p>
          <h3>Countries I've lived in</h3>
          <p>{{ countriesLivedListDisplay }}</p>
        </v-card-text>
      </v-card>
    </v-container>
  </v-content>
</template>

<script lang="ts">
import Vue from "vue"

import moment, { lang } from "moment"

import { GetUserReq, SendFriendRequestReq, User } from "../pb/api_pb"
import { client } from "../api"

import { displayList, displayTime } from "../utils"

export default Vue.extend({
  data: () => ({
    loading: false,
    error: null as null | Error,
    sendingFriendRequest: false,
    user: (null as unknown) as User.AsObject,
  }),

  created() {
    this.fetchData()
  },

  watch: {
    $route: "fetchData",
  },

  methods: {
    fetchData() {
      this.loading = true
      this.error = null

      const req = new GetUserReq()
      req.setUser(this.$route.params.user)
      client
        .getUser(req)
        .then((res) => {
          this.loading = false
          this.error = null
          this.user = res.toObject()
        })
        .catch((err) => {
          this.loading = false
          this.error = err
        })
    },

    sendFriendRequest() {
      this.sendingFriendRequest = true
      const req = new SendFriendRequestReq()
      req.setUser(this.user.username)
      client
        .sendFriendRequest(req)
        .then((res) => {
          this.sendingFriendRequest = false
          this.fetchData()
        })
        .catch((err) => {
          console.error(err)
          this.sendingFriendRequest = false
          this.fetchData()
        })
    },
  },

  computed: {
    friendsDisplay() {
      switch (this.user.friends) {
        case User.FriendshipStatus.NOT_FRIENDS:
          return ""
        case User.FriendshipStatus.FRIENDS:
          return "You are friends"
        case User.FriendshipStatus.PENDING:
          return "Friend request pending"
        case User.FriendshipStatus.NA:
        default:
          return "You can't be friends with this user, you doofus."
      }
    },

    lastActiveDisplay() {
      if (!this.user.lastActive) {
        return "unknown"
      }
      return displayTime(this.user.lastActive)
    },

    joinedDisplay() {
      if (!this.user.joined) {
        return "error"
      }
      return displayTime(this.user.joined)
    },

    verificationDisplay() {
      return Math.round(this.user.verification! * 100)
    },

    communityStandingDisplay() {
      return Math.round(this.user.communityStanding! * 100)
    },

    languagesListDisplay() {
      return displayList(this.user.languagesList)
    },

    countriesVisitedListDisplay() {
      return displayList(this.user.countriesVisitedList)
    },

    countriesLivedListDisplay() {
      return displayList(this.user.countriesLivedList)
    },
  },
})
</script>
