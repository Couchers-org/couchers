<template>
  <v-content>
    <error-alert :error="error"/>
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
            <v-list-item-subtitle><v-progress-linear class="my-2" height="12" rounded value="0" color="light-green"></v-progress-linear></v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
        <v-list-item two-item>
          <v-list-item-icon>
            <v-icon>mdi-account-group</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Community standing (coming soon)</v-list-item-title>
            <v-list-item-subtitle><v-progress-linear class="my-2" height="12" rounded value="0" color="light-blue"></v-progress-linear></v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
        <v-list-item>
          <v-list-item-icon>
            <v-icon>mdi-forum</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>{{ user.numReferences }} references</v-list-item-title>
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
            <v-list-item-title>{{ user.gender }}, {{ user.age }}</v-list-item-title>
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
            <v-list-item-title>Last active {{ lastActiveDisplay }}</v-list-item-title>
            <v-list-item-subtitle>Joined {{ joinedDisplay }}</v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
        <v-divider></v-divider>
      </v-card>
      <v-card class="float-left mx-3 my-3" width="950" outlined>
        <v-card-text>
          <h2>Edit your profile</h2>
          <p>See how your profile looks to others: ...TODO link to /user/:username</p>
          <h3>Name</h3>
          <editable-text-field :text="user.name" v-on:save="saveName" />
          <h3>City</h3>
          <editable-text-field :text="user.city" v-on:save="saveCity" />
          <h3>Gender</h3>
          <editable-text-field :text="user.gender" v-on:save="saveGender" />
          <h3>Occupation</h3>
          <editable-text-field :text="user.occupation" v-on:save="saveOccupation" />
          <h3>Languages</h3>
          <editable-list :list="user.languagesList" v-on:save="saveLanguages" />
          <h3>About me</h3>
          <editable-textarea :text="user.aboutMe" v-on:save="saveAboutMe" />
          <h3>About my place</h3>
          <editable-textarea :text="user.aboutPlace" v-on:save="saveAboutPlace" />
          <h3>Countries I've visited</h3>
          <editable-list :list="user.countriesVisitedList" v-on:save="saveCountriesVisited" />
          <h3>Countries I've lived in</h3>
          <editable-list :list="user.countriesLivedList" v-on:save="saveCountriesLived" />
          <h3>Profile color</h3>
          <p>We're still working on profile pictures, but you can choose a color for your profile instead!</p>
          <editable-color :color="user.color" v-on:save="saveColor" />
        </v-card-text>
      </v-card>
    </v-container>
  </v-content>
</template>

<script lang="ts">
import Vue from 'vue'

import moment, { lang } from 'moment'
import wrappers from 'google-protobuf/google/protobuf/wrappers_pb'

import EditableTextarea from '../components/EditableTextarea.vue'
import EditableTextField from '../components/EditableTextField.vue'
import EditableList from '../components/EditableList.vue'
import EditableColor from '../components/EditableColor.vue'
import ErrorAlert from '../components/ErrorAlert.vue'

import { GetUserReq, UpdateProfileReq } from '../pb/api_pb'
import { client } from '../api'

import Store from '../store'

function displayList(list: string[]) {
  return list.join(', ')
}

export default Vue.extend({
  data: () => ({
    loading: false,
    error: [] as Array<string>,
    user: {
      name: null,
      city: null,
      verification: null,
      communityStanding: null,
      numReferences: null,
      gender: null,
      age: null,
      birthDate: null,
      languagesList: [],
      occupation: null,
      aboutMe: null,
      countriesVisitedList: [],
      countriesLivedList: [],
      lastActive: null,
      joined: null,
      color: null
    }
  }),

  components: {
    "editable-textarea": EditableTextarea,
    "editable-text-field": EditableTextField,
    "editable-list": EditableList,
    "editable-color": EditableColor,
    "error-alert": ErrorAlert
  },

  created () {
    this.fetchData()
  },

  watch: {
    '$route': 'fetchData'
  },

  methods: {
    fetchData: function () {
      this.loading = true
      this.error = null

      const req = new GetUserReq()
      req.setUser(Store.state.username)
      client.getUser(req).then(res => {
        this.loading = false
        this.error = null

        this.user = res.toObject()
        this.user.lastActive = res.getLastActive()
        this.user.joined = res.getJoined()
      }).catch(err => {
        this.loading = false
        this.error = err
      })
    },

    updateProfile: function (req: UpdateProfileReq) {
      this.loading = true

      client.updateProfile(req).then(res => {
        this.loading = false
        this.fetchData()
      }).catch(err => {
        console.error(err)
        this.loading = false
        this.error = err
      })
    },

    saveAboutMe: function (text: string) {
      const req = new UpdateProfileReq()
      const wrapper = new wrappers.StringValue()
      wrapper.setValue(text)
      req.setAboutMe(wrapper)
      this.updateProfile(req)
    },

    saveAboutPlace: function (text: string) {
      const req = new UpdateProfileReq()
      const wrapper = new wrappers.StringValue()
      wrapper.setValue(text)
      req.setAboutPlace(wrapper)
      this.updateProfile(req)
    },

    saveName: function (text: string) {
      const req = new UpdateProfileReq()
      const wrapper = new wrappers.StringValue()
      wrapper.setValue(text)
      req.setName(wrapper)
      this.updateProfile(req)
    },

    saveCity: function (text: string) {
      const req = new UpdateProfileReq()
      const wrapper = new wrappers.StringValue()
      wrapper.setValue(text)
      req.setCity(wrapper)
      this.updateProfile(req)
    },

    saveGender: function (text: string) {
      const req = new UpdateProfileReq()
      const wrapper = new wrappers.StringValue()
      wrapper.setValue(text)
      req.setGender(wrapper)
      this.updateProfile(req)
    },

    saveOccupation: function (text: string) {
      const req = new UpdateProfileReq()
      const wrapper = new wrappers.StringValue()
      wrapper.setValue(text)
      req.setOccupation(wrapper)
      this.updateProfile(req)
    },

    saveCountriesVisited: function (list: Array<string>) {
      const req = new UpdateProfileReq()
      const listValue = new UpdateProfileReq.RepeatedStringValue()
      listValue.setValueList(list)
      listValue.setExists(true)
      req.setCountriesVisited(listValue)
      this.updateProfile(req)
    },

    saveCountriesLived: function (list: Array<string>) {
      const req = new UpdateProfileReq()
      const listValue = new UpdateProfileReq.RepeatedStringValue()
      listValue.setValueList(list)
      listValue.setExists(true)
      req.setCountriesLived(listValue)
      this.updateProfile(req)
    },

    saveLanguages: function (list: Array<string>) {
      const req = new UpdateProfileReq()
      const listValue = new UpdateProfileReq.RepeatedStringValue()
      listValue.setValueList(list)
      listValue.setExists(true)
      req.setLanguages(listValue)
      this.updateProfile(req)
    },

    saveColor: function (color: string) {
      const req = new UpdateProfileReq()
      const wrapper = new wrappers.StringValue()
      wrapper.setValue(color)
      req.setColor(wrapper)
      this.updateProfile(req)
    },
  },

  computed: {
    lastActiveDisplay: function() {
      if (!this.user.lastActive) {
        return 'unknown'
      }
      return moment(this.user.lastActive.toDate()).fromNow()
    },
    joinedDisplay: function () {
      if (!this.user.joined) {
        return 'error'
      }
      return moment(this.user.joined.toDate()).fromNow()
    },
    verificationDisplay: function() {
      return Math.round(this.user.verification! * 100)
    },
    communityStandingDisplay: function() {
      return Math.round(this.user.communityStanding! * 100)
    },
    ageDisplay: function() {
      return new Date(new Date().getTime() - this.user.birthDate!).getFullYear()-1970;
    },
    languagesListDisplay: function() {
      return displayList(this.user.languagesList)
    },
    countriesVisitedListDisplay: function() {
      return displayList(this.user.countriesVisitedList)
    },
    countriesLivedListDisplay: function() {
      return displayList(this.user.countriesLivedList)
    }
  }
})
</script>
