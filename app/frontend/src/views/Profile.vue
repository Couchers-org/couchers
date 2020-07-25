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
          <h3>Name</h3>
          <editable-text-field :text="user.name" v-on:save="saveName" />
          <h3>City</h3>
          <editable-text-field :text="user.city" v-on:save="saveCity" />
          <h3>Gender</h3>
          <editable-text-field :text="user.gender" v-on:save="saveGender" />
          <h3>Occupation</h3>
          <editable-text-field
            :text="user.occupation"
            v-on:save="saveOccupation"
          />
          <h3>Languages</h3>
          <editable-list :list="user.languagesList" v-on:save="saveLanguages" />
          <h3>About me</h3>
          <editable-textarea :text="user.aboutMe" v-on:save="saveAboutMe" />
          <h3>About my place</h3>
          <editable-textarea
            :text="user.aboutPlace"
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
            We're still working on profile pictures, but you can choose a color
            for your profile instead!
          </p>
          <editable-color :color="user.color" v-on:save="saveColor" />
        </v-card-text>
      </v-card>
    </v-container>
  </v-main>
</template>

<script lang="ts">
import Vue from "vue"

import { mapState } from "vuex"

import wrappers from "google-protobuf/google/protobuf/wrappers_pb"

import EditableTextarea from "../components/EditableTextarea.vue"
import EditableTextField from "../components/EditableTextField.vue"
import EditableList from "../components/EditableList.vue"
import EditableColor from "../components/EditableColor.vue"
import ErrorAlert from "../components/ErrorAlert.vue"

import {
  GetUserReq,
  UpdateProfileReq,
  User,
  RepeatedStringValue,
} from "../pb/api_pb"
import { client } from "../api"

import Store from "../store"

import { displayList, displayTime } from "../utils"

export default Vue.extend({
  data: () => ({
    loading: false,
    error: null as Error | null,
  }),

  components: {
    EditableTextarea,
    EditableTextField,
    EditableList,
    EditableColor,
    ErrorAlert,
  },

  methods: {
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
