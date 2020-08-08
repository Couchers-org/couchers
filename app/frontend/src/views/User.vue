<template>
  <v-main>
    <error-alert :error="error" />
    <v-container v-if="loading">
      <loading-circular :loading="loading" />
    </v-container>
    <v-container v-if="!loading" fluid>
      <v-card class="float-left mx-3 my-3" width="350" outlined>
        <v-sheet height="80" :color="user.color" tile></v-sheet>
        <v-card-title>{{ user.name }}</v-card-title>
        <v-card-subtitle>{{ user.city }}</v-card-subtitle>
        <v-list-item
          v-if="
            user.hostingStatus != HostingStatus.HOSTING_STATUS_UNKNOWN &&
            user.hosting_status != HostingStatus.HOSTING_STATUS_UNSPECIFIED
          "
          two-item
        >
          <v-list-item-icon>
            <v-icon :color="displayHostingStatus(user.hostingStatus)[1]"
              >mdi-home</v-icon
            >
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>{{
              displayHostingStatus(user.hostingStatus)[0]
            }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
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
                <v-icon left>mdi-account-plus</v-icon>Send friend request
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
            <v-list-item-subtitle>
              <v-progress-linear
                class="my-2"
                height="12"
                rounded
                value="0"
                color="light-green"
              ></v-progress-linear>
            </v-list-item-subtitle>
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
            <v-list-item-subtitle>
              <v-progress-linear
                class="my-2"
                height="12"
                rounded
                value="0"
                color="light-blue"
              ></v-progress-linear>
            </v-list-item-subtitle>
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
            <v-list-item-title>{{
              displayList(user.languagesList)
            }}</v-list-item-title>
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
            <v-list-item-title>
              Last active
              {{ displayTime(user.lastActive) || "error" }}
            </v-list-item-title>
            <v-list-item-subtitle>
              Joined
              {{ displayTime(user.joined) || "error" }}
            </v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
        <v-list-item two-item>
          <v-list-item-icon>
            <v-icon>mdi-account-multiple-check</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>{{ mutualFriendsDisplay }}</v-list-item-title>
            <v-list-item-subtitle>Mutual friends</v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
        <v-divider></v-divider>
        <v-card-actions>
          <v-btn text>Message</v-btn>
          <report-dialog-button :name="user.name" :user-id="user.userId" />
        </v-card-actions>
      </v-card>
      <v-card class="float-left mx-3 my-3" width="950" outlined>
        <v-card-text>
          <v-tabs class="mb-5">
            <v-tab href="#about">About me</v-tab>
            <v-tab href="#hosting">Hosting</v-tab>
            <v-tab href="#references">References</v-tab>
            <v-tab href="#friends">Friends</v-tab>
            <v-tab href="#photos">Photos</v-tab>
            <v-tab-item value="about">
              <h3>About me</h3>
              <markdown :source="user.aboutMe" />
              <h3>About my place</h3>
              <markdown :source="user.aboutPlace" />
              <h3>Countries I've visited</h3>
              <markdown :source="displayList(user.countriesVisitedList)" />
              <h3>Countries I've lived in</h3>
              <markdown :source="displayList(user.countriesLivedList)" />
            </v-tab-item>
            <v-tab-item value="hosting">
              <v-container v-if="hasHostingPreferences">
                This user hasn't specified any hosting information yet.
              </v-container>
              <v-container v-if="hostingPreferences.maxGuests != null">
                <h3>Max guests</h3>
                {{ hostingPreferences.maxGuests.value }}
              </v-container>
              <v-container v-if="hostingPreferences.multipleGroups != null">
                <h3>Accepts mutliple groups?</h3>
                {{ displayBool(hostingPreferences.multipleGroups.value) }}
              </v-container>
              <v-container v-if="hostingPreferences.lastMinute != null">
                <h3>Accepts last minute requests?</h3>
                {{ displayBool(hostingPreferences.lastMinute.value) }}
              </v-container>
              <v-container v-if="hostingPreferences.acceptsPets != null">
                <h3>Accepts pets?</h3>
                {{ displayBool(hostingPreferences.acceptsPets.value) }}
              </v-container>
              <v-container v-if="hostingPreferences.acceptsKids != null">
                <h3>Accepts kids?</h3>
                {{ displayBool(hostingPreferences.acceptsKids.value) }}
              </v-container>
              <v-container
                v-if="hostingPreferences.wheelchairAccessible != null"
              >
                <h3>Wheelchair Accessible?</h3>
                {{ displayBool(hostingPreferences.wheelchairAccessible.value) }}
              </v-container>
              <v-container
                v-if="
                  hostingPreferences.smokingAllowed !=
                    SmokingLocation.SMOKING_LOCATION_UNSPECIFIED &&
                  hostingPreferences.smokingAllowed !=
                    SmokingLocation.SMOKING_LOCATION_UNKNOWN
                "
              >
                <h3>Smoking allowed?</h3>
                {{
                  displaySmokingLocation(
                    hostingPreferences.smokingAllowed.value
                  )
                }}
              </v-container>
              <v-container
                v-if="hostingPreferences.sleepingArrangement != null"
              >
                <h3>Sleeping arrangements</h3>
                <markdown
                  :source="hostingPreferences.sleepingArrangement.value"
                />
              </v-container>
              <v-container v-if="hostingPreferences.area != null">
                <h3>Area/neightbourhood info</h3>
                <markdown :source="hostingPreferences.area.value" />
              </v-container>
              <v-container v-if="hostingPreferences.houseRules != null">
                <h3>House rules</h3>
                <markdown :source="hostingPreferences.houseRules.value" />
              </v-container>
            </v-tab-item>
            <v-tab-item value="references">
              <v-btn
                v-if="
                  myReference == null &&
                  user.userId != activeUser.userId &&
                  !(activeUser.userId in this.userCache)
                "
                @click="startMyReference"
                class="my-3"
                >Write a reference</v-btn
              >
              <v-container v-if="myReference != null">
                <v-textarea
                  v-model="myReference"
                  placeholder="Your public reference here"
                ></v-textarea>
                <v-slider
                  v-model="myReferenceRating"
                  step="1"
                  thumb-label="always"
                  min="0"
                  max="10"
                  label="Rating"
                />
                <v-checkbox
                  v-model="myReferenceWasSafe"
                  label="I felt safe with this person"
                />
                <p v-if="!myReferenceWasSafe">
                  You can anonymously report this user using the report button
                  above.
                </p>
                <p>
                  The rating and if you felt safe are private and anonymous.
                </p>
                <v-btn
                  class="mx-2 my-2"
                  @click="saveMyReference"
                  color="success"
                  :loading="loadingReferences"
                  >Save</v-btn
                >
                <v-btn
                  class="mx-2 my-2"
                  @click="cancelMyReference"
                  color="warning"
                  >Cancel</v-btn
                >
              </v-container>
              <v-card
                v-for="reference in references"
                :key="reference.fromUserId"
                class="my-3"
              >
                <v-card-title>
                  {{ userCache[reference.fromUserId].name }}
                </v-card-title>
                <v-card-subtitle>
                  {{
                    referenceTypeString(reference.referenceType) +
                    ", " +
                    displayTime(reference.writtenTime)
                  }}
                </v-card-subtitle>
                <v-card-text>{{ reference.text }}</v-card-text>
              </v-card>
              <v-btn
                v-if="!noMoreReferences"
                @click="fetchReferences"
                :loading="loadingReferences"
                class="my-2"
                >Load more</v-btn
              >
              <v-container v-if="references.length == 0"
                >No references... yet!</v-container
              >
            </v-tab-item>
            <v-tab-item value="friends">Friends</v-tab-item>
            <v-tab-item value="photos">Photos</v-tab-item>
          </v-tabs>
        </v-card-text>
      </v-card>
    </v-container>
  </v-main>
</template>

<script lang="ts">
import Vue from "vue"

import ErrorAlert from "@/components/ErrorAlert.vue"
import LoadingCircular from "@/components/LoadingCircular.vue"
import ReportDialogButton from "@/components/ReportDialogButton.vue"
import Markdown from "@/components/Markdown.vue"

import {
  GetUserReq,
  SendFriendRequestReq,
  User,
  Reference,
  GetReceivedReferencesReq,
  ReferenceType,
  WriteReferenceReq,
  HostingStatus,
  GetHostingPreferencesRes,
  GetHostingPreferencesReq,
  SmokingLocation,
} from "../pb/api_pb"
import { client } from "../api"

import {
  displayList,
  displayTime,
  handle,
  displayHostingStatus,
  displayBool,
  displaySmokingLocation,
} from "../utils"

import store from "../store/index"
import { Timestamp } from "google-protobuf/google/protobuf/timestamp_pb"

const REFERENCES_PAGINATION = 2

export default Vue.extend({
  data: () => ({
    loading: false,
    error: null as null | Error,
    sendingFriendRequest: false,
    user: (null as unknown) as User.AsObject,
    userCache: {} as { [userId: number]: User.AsObject },
    hostingPreferences: null as null | GetHostingPreferencesRes.AsObject,
    references: [] as Array<Reference.AsObject>,
    loadingReferences: false,
    noMoreReferences: false,
    myReference: null as null | string,
    myReferenceWasSafe: false,
    myReferenceRating: 0,
    HostingStatus,
    SmokingLocation,
  }),

  components: {
    ErrorAlert,
    LoadingCircular,
    ReportDialogButton,
    Markdown,
  },

  created() {
    this.fetchData()
  },

  watch: {
    $route: "fetchData",
  },

  methods: {
    handle,

    displayList,

    displayTime,

    displayHostingStatus,

    displayBool,

    displaySmokingLocation,

    referenceTypeString(rt: ReferenceType): string {
      switch (rt) {
        case ReferenceType.FRIEND:
          return "Friend"
        case ReferenceType.HOSTED:
          return "Hosted"
        case ReferenceType.SURFED:
          return "Surfed"
      }
    },

    fetchData() {
      this.loading = true
      this.error = null
      this.fetchUser()
        .then(this.fetchReferences)
        .then(this.fetchHostingPreferences)
        .then(() => {
          this.loading = false
        })
        .catch((err) => {
          this.loading = false
          this.error = err
        })
    },

    fetchUser() {
      const req = new GetUserReq()
      req.setUser(this.routeUser)
      return client.getUser(req).then((res) => (this.user = res.toObject()))
    },

    fetchHostingPreferences() {
      const req = new GetHostingPreferencesReq()
      req.setUserId(this.user.userId)
      return client
        .getHostingPreferences(req)
        .then((res) => (this.hostingPreferences = res.toObject()))
    },

    fetchReferences() {
      this.loadingReferences = true
      const dirtyReferences = [] as Array<Reference.AsObject>
      const req = new GetReceivedReferencesReq()
      req.setToUserId(this.user.userId)
      req.setStartAt(this.references.length)
      req.setNumber(REFERENCES_PAGINATION)

      return client
        .getReceivedReferences(req)
        .then((res) => {
          res.getReferencesList().forEach((reference) => {
            dirtyReferences.push(reference.toObject())
          })
          return this.fetchReferees(dirtyReferences).then(() => res)
        })
        .then((res) => {
          this.references.push(...dirtyReferences)
          this.noMoreReferences =
            this.references.length >= res.getTotalMatches()
          this.loadingReferences = false
        })
        .catch((err) => {
          this.loadingReferences = false
          this.loading = false
          this.error = err
        })
    },

    fetchReferees(references: Array<Reference.AsObject>) {
      return Promise.all([
        ...references.map(async (reference) => {
          const id = reference.fromUserId
          const req = new GetUserReq()
          req.setUser(id.toString())
          const res = await client.getUser(req)
          this.userCache[id] = res.toObject()
        }),
      ])
    },

    sendFriendRequest() {
      this.sendingFriendRequest = true
      const req = new SendFriendRequestReq()
      req.setUserId(this.user.userId)
      client
        .sendFriendRequest(req)
        .then(() => {
          this.sendingFriendRequest = false
          this.fetchData()
        })
        .catch((err) => {
          console.error(err)
          this.sendingFriendRequest = false
          this.fetchData()
        })
    },

    startMyReference() {
      this.myReference = ""
    },

    saveMyReference() {
      this.loadingReferences = true
      const req = new WriteReferenceReq()
      req.setToUserId(this.user.userId)
      req.setReferenceType(ReferenceType.FRIEND)
      req.setText(this.myReference!)
      req.setWasSafe(this.myReferenceWasSafe)
      req.setRating(this.myReferenceRating)
      client
        .writeReference(req)
        .then(() => {
          //this is a 'fake' local reference so we don't have to fetch again
          const newRef = new Reference()
          newRef.setFromUserId(this.activeUser?.userId!)
          newRef.setToUserId(this.user.userId)
          newRef.setReferenceType(ReferenceType.FRIEND)
          newRef.setText(this.myReference!)
          const now = new Timestamp()
          now.fromDate(new Date(Date.now()))
          newRef.setWrittenTime(now)
          this.userCache[this.activeUser?.userId!] = this.activeUser!
          this.references.unshift(newRef.toObject())
          this.myReference = null
          this.loadingReferences = false
        })
        .catch((err) => {
          this.loadingReferences = false
          this.error = err
        })
    },

    cancelMyReference() {
      this.myReference = null
    },
  },

  store,

  computed: {
    hasHostingPreferences(): boolean {
      return (
        this.hostingPreferences != null &&
        this.hostingPreferences.maxGuests != null &&
        this.hostingPreferences.multipleGroups != null &&
        this.hostingPreferences.lastMinute != null &&
        this.hostingPreferences.acceptsPets != null &&
        this.hostingPreferences.acceptsKids != null &&
        this.hostingPreferences.wheelchairAccessible != null &&
        this.hostingPreferences.smokingAllowed != null &&
        this.hostingPreferences.sleepingArrangement != null &&
        this.hostingPreferences.area != null &&
        this.hostingPreferences.houseRules != null
      )
    },

    routeUser() {
      return this.$route.params.user
    },

    mutualFriendsDisplay() {
      return displayList(
        this.user.mutualFriendsList.map((user) => handle(user.username))
      )
    },

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

    activeUser() {
      return store.state.user
    },
  },
})
</script>
