<template>
  <v-main>
    <error-alert :error="error" />
    <v-container fluid>
      <v-overlay absolute :value="loading">
        <loading-circular :loading="loading" />
      </v-overlay>
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
      </v-card>
      <v-card class="float-left mx-3 my-3" width="950" outlined>
        <v-card-text>
          <h2>Edit your profile</h2>
          <p>
            <v-btn
              color="primary"
              link
              :to="{ name: 'User', params: { user: user.username } }"
              >See how your profile looks to others</v-btn
            >
          </p>
          <v-tabs class="mb-5">
            <v-tab href="#info">My info</v-tab>
            <v-tab href="#hosting">Hosting preferences</v-tab>
            <v-tab-item value="info">
              <h3>Name</h3>
              <editable-text-field :text="user.name" v-on:save="saveName" />
              <h3>City</h3>
              <editable-text-field :text="user.city" v-on:save="saveCity" />
              <h3>Hosting Status</h3>
              <editable-dropdown
                :value="user.hostingStatus == 0 ? 1 : user.hostingStatus"
                :items="hostingStatusChoices"
                v-on:save="saveHostingStatus"
              />
              <h3>Gender</h3>
              <editable-text-field :text="user.gender" v-on:save="saveGender" />
              <h3>Occupation</h3>
              <editable-text-field
                :text="user.occupation"
                v-on:save="saveOccupation"
              />
              <h3>Languages</h3>
              <editable-list
                :list="user.languagesList"
                v-on:save="saveLanguages"
              />
              <h3>About me</h3>
              <editable-textarea
                :text="user.aboutMe"
                isMarkdown
                v-on:save="saveAboutMe"
              />
              <h3>About my place</h3>
              <editable-textarea
                :text="user.aboutPlace"
                isMarkdown
                v-on:save="saveAboutPlace"
              />
              <h3>Countries I've visited</h3>
              <editable-list
                :list="user.countriesVisitedList"
                v-on:save="saveCountriesVisited"
              />
              <h3>Countries I've lived in</h3>
              <editable-list
                :list="user.countriesLivedList"
                v-on:save="saveCountriesLived"
              />
              <h3>Profile color</h3>
              <p>
                We're still working on profile pictures, but you can choose a
                color for your profile instead!
              </p>
              <editable-color :color="user.color" v-on:save="saveColor" />
            </v-tab-item>
            <v-tab-item value="hosting">
              <h3>max_guests</h3>
              <h3>multiple_groups</h3>
              <h3>last_minute</h3>
              <h3>accepts_pets</h3>
              <h3>accepts_kids</h3>
              <h3>wheelchair_accessible</h3>
              <h3>smoking_allowed</h3>
              <h3>sleeping_arrangement</h3>
              <h3>area</h3>
              <h3>house_rules</h3>
            </v-tab-item>
          </v-tabs>
        </v-card-text>
      </v-card>
    </v-container>
  </v-main>
</template>

<script lang="ts">
import Vue from "vue"

import { mapState } from "vuex"

import wrappers from "google-protobuf/google/protobuf/wrappers_pb"

import EditableDropdown from "../components/EditableDropdown.vue"
import EditableTextarea from "../components/EditableTextarea.vue"
import EditableTextField from "../components/EditableTextField.vue"
import EditableList from "../components/EditableList.vue"
import EditableColor from "../components/EditableColor.vue"
import ErrorAlert from "../components/ErrorAlert.vue"
import LoadingCircular from "../components/LoadingCircular.vue"

import {
  UpdateProfileReq,
  RepeatedStringValue,
  GetHostingPreferencesReq,
  GetHostingPreferencesRes,
  HostingStatus,
} from "../pb/api_pb"
import { client } from "../api"

import Store from "../store"

import { displayList, displayTime, displayHostingStatus } from "../utils"

export default Vue.extend({
  data: () => ({
    loading: false,
    error: null as Error | null,
    hostingPreferences: null as null | GetHostingPreferencesRes.AsObject,
    HostingStatus,
    hostingStatusChoices: [
      { text: "(Leave blank)", value: 1 },
      { text: "Can host", value: 2 },
      { text: "Maybe", value: 3 },
      { text: "Difficult", value: 4 },
      { text: "Can't host", value: 5 },
    ],
  }),

  components: {
    EditableDropdown,
    EditableTextarea,
    EditableTextField,
    EditableList,
    EditableColor,
    ErrorAlert,
    LoadingCircular,
  },

  created() {
    this.fetchData()
  },

  methods: {
    fetchData() {
      this.loading = true

      const req = new GetHostingPreferencesReq()
      req.setUserId(this.user.userId)
      client
        .getHostingPreferences(req)
        .then((res) => {
          this.hostingPreferences = res.toObject()
          this.loading = false
        })
        .catch((err) => {
          this.error = err
          this.loading = false
        })
    },

    updateProfile(req: UpdateProfileReq) {
      this.loading = true

      client
        .updateProfile(req)
        .then(() => {
          this.loading = false
          Store.dispatch("refreshUser")
        })
        .catch((err) => {
          console.error(err)
          this.loading = false
          this.error = err
        })
    },

    saveAboutMe(text: string) {
      const req = new UpdateProfileReq()
      const wrapper = new wrappers.StringValue()
      wrapper.setValue(text)
      req.setAboutMe(wrapper)
      this.updateProfile(req)
    },

    saveAboutPlace(text: string) {
      const req = new UpdateProfileReq()
      const wrapper = new wrappers.StringValue()
      wrapper.setValue(text)
      req.setAboutPlace(wrapper)
      this.updateProfile(req)
    },

    saveName(text: string) {
      const req = new UpdateProfileReq()
      const wrapper = new wrappers.StringValue()
      wrapper.setValue(text)
      req.setName(wrapper)
      this.updateProfile(req)
    },

    saveCity(text: string) {
      const req = new UpdateProfileReq()
      const wrapper = new wrappers.StringValue()
      wrapper.setValue(text)
      req.setCity(wrapper)
      this.updateProfile(req)
    },

    saveHostingStatus(index: number) {
      const req = new UpdateProfileReq()
      req.setHostingStatus(index)
      this.updateProfile(req)
    },

    saveGender(text: string) {
      const req = new UpdateProfileReq()
      const wrapper = new wrappers.StringValue()
      wrapper.setValue(text)
      req.setGender(wrapper)
      this.updateProfile(req)
    },

    saveOccupation(text: string) {
      const req = new UpdateProfileReq()
      const wrapper = new wrappers.StringValue()
      wrapper.setValue(text)
      req.setOccupation(wrapper)
      this.updateProfile(req)
    },

    saveCountriesVisited(list: Array<string>) {
      const req = new UpdateProfileReq()
      const listValue = new RepeatedStringValue()
      listValue.setValueList(list)
      listValue.setExists(true)
      req.setCountriesVisited(listValue)
      this.updateProfile(req)
    },

    saveCountriesLived(list: Array<string>) {
      const req = new UpdateProfileReq()
      const listValue = new RepeatedStringValue()
      listValue.setValueList(list)
      listValue.setExists(true)
      req.setCountriesLived(listValue)
      this.updateProfile(req)
    },

    saveLanguages(list: Array<string>) {
      const req = new UpdateProfileReq()
      const listValue = new RepeatedStringValue()
      listValue.setValueList(list)
      listValue.setExists(true)
      req.setLanguages(listValue)
      this.updateProfile(req)
    },

    saveColor(color: string) {
      const req = new UpdateProfileReq()
      const wrapper = new wrappers.StringValue()
      wrapper.setValue(color)
      req.setColor(wrapper)
      this.updateProfile(req)
    },

    displayHostingStatus,
  },

  computed: {
    lastActiveDisplay(): string {
      if (!this.user.lastActive) {
        return "unknown"
      }
      return displayTime(this.user.lastActive)
    },

    joinedDisplay(): string {
      if (!this.user.joined) {
        return "error"
      }
      return displayTime(this.user.joined)
    },

    languagesListDisplay(): string {
      return displayList(this.user.languagesList)
    },

    countriesVisitedListDisplay(): string {
      return displayList(this.user.countriesVisitedList)
    },

    countriesLivedListDisplay(): string {
      return displayList(this.user.countriesLivedList)
    },

    ...mapState(["user"]),
  },
})
</script>
