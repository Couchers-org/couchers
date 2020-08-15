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
              <h3>Max guests</h3>
              <editable-text-field
                :text="user.maxGuests ? user.maxGuests.value : null"
                v-on:save="saveMaxGuests"
              />
              <h3>Multiple groups accepted</h3>
              <editable-dropdown
                :value="user.multipleGroups ? user.multipleGroups.value : null"
                :items="boolChoices"
                v-on:save="saveMultipleGroups"
              />
              <h3>Last minute requests okay</h3>
              <editable-dropdown
                :value="user.lastMinute ? user.lastMinute.value : null"
                :items="boolChoices"
                v-on:save="saveLastMinute"
              />
              <h3>Accept pets</h3>
              <editable-dropdown
                :value="user.acceptsPets ? user.acceptsPets.value : null"
                :items="boolChoices"
                v-on:save="saveAcceptsPets"
              />
              <h3>Accept kids</h3>
              <editable-dropdown
                :value="user.acceptsKids ? user.acceptsKids.value : null"
                :items="boolChoices"
                v-on:save="saveAcceptsKids"
              />
              <h3>Wheelchair accessible</h3>
              <editable-dropdown
                :value="
                  user.wheelchairAccessible
                    ? user.wheelchairAccessible.value
                    : null
                "
                :items="boolChoices"
                v-on:save="saveWheelchairAccessible"
              />
              <h3>Smoking allowed</h3>
              <editable-dropdown
                :value="user.smokingAllowed"
                :items="smokingAllowedChoices"
                v-on:save="saveSmokingAllowed"
              />
              <h3>Sleeping arrangements</h3>
              <editable-textarea
                :text="
                  user.sleepingArrangement ? user.sleepingArrangement.value : ''
                "
                is-markdown
                v-on:save="saveSleepingArrangement"
              />
              <h3>Area/Neighbourhood info</h3>
              <editable-textarea
                :text="user.area ? user.area.value : ''"
                is-markdown
                v-on:save="saveArea"
              />
              <h3>House rules</h3>
              <editable-textarea
                :text="user.houseRules ? user.houseRules.value : ''"
                is-markdown
                v-on:save="saveHouseRules"
              />
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
  HostingStatus,
  NullableUInt32Value,
  NullableBoolValue,
  SmokingLocation,
  NullableStringValue,
} from "../pb/api_pb"
import { client } from "../api"

import Store from "../store"

import { displayList, displayTime, displayHostingStatus } from "../utils"

export default Vue.extend({
  data: () => ({
    loading: false,
    error: null as Error | null,
    HostingStatus,
    hostingStatusChoices: [
      { text: "(Leave blank)", value: 1 },
      { text: "Can host", value: 2 },
      { text: "Maybe", value: 3 },
      { text: "Difficult", value: 4 },
      { text: "Can't host", value: 5 },
    ],
    smokingAllowedChoices: [
      { text: "", value: 1 },
      { text: "Yes", value: 2 },
      { text: "Window", value: 3 },
      { text: "Outside", value: 4 },
      { text: "No", value: 5 },
    ],
    boolChoices: [
      { text: "", value: null },
      { text: "Yes", value: true },
      { text: "No", value: false },
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
          this.loading = false
          this.error = err
        })
    },

    saveAboutMe(text: string) {
      const req = new UpdateProfileReq()
      const wrapper = new NullableStringValue()
      if (text === "") {
        wrapper.setIsNull(true)
      } else {
        wrapper.setValue(text)
      }
      wrapper.setValue(text)
      req.setAboutMe(wrapper)
      this.updateProfile(req)
    },

    saveAboutPlace(text: string) {
      const req = new UpdateProfileReq()
      const wrapper = new NullableStringValue()
      if (text === "") {
        wrapper.setIsNull(true)
      } else {
        wrapper.setValue(text)
      }
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
      const wrapper = new NullableStringValue()
      if (text === "") {
        wrapper.setIsNull(true)
      } else {
        wrapper.setValue(text)
      }
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

    saveMaxGuests(value: string | null) {
      const req = new UpdateProfileReq()
      const wrapper = new NullableUInt32Value()
      if (value == null || value == "") {
        wrapper.setIsNull(true)
      } else {
        const num = parseInt(value)
        if (isNaN(num)) {
          this.error = Error("Max guests must be a number.")
          return
        }
        wrapper.setValue(num)
      }
      req.setMaxGuests(wrapper)
      this.updateProfile(req)
    },

    saveMultipleGroups(value: boolean | null) {
      console.log(value)
      const req = new UpdateProfileReq()
      const wrapper = new NullableBoolValue()
      if (value == null) {
        wrapper.setIsNull(true)
      } else {
        wrapper.setValue(value)
      }
      req.setMultipleGroups(wrapper)
      this.updateProfile(req)
    },

    saveLastMinute(value: boolean | null) {
      const req = new UpdateProfileReq()
      const wrapper = new NullableBoolValue()
      if (value == null) {
        wrapper.setIsNull(true)
      } else {
        wrapper.setValue(value)
      }
      req.setLastMinute(wrapper)
      this.updateProfile(req)
    },

    saveAcceptsPets(value: boolean | null) {
      const req = new UpdateProfileReq()
      const wrapper = new NullableBoolValue()
      if (value == null) {
        wrapper.setIsNull(true)
      } else {
        wrapper.setValue(value)
      }
      req.setAcceptsPets(wrapper)
      this.updateProfile(req)
    },

    saveAcceptsKids(value: boolean | null) {
      const req = new UpdateProfileReq()
      const wrapper = new NullableBoolValue()
      if (value == null) {
        wrapper.setIsNull(true)
      } else {
        wrapper.setValue(value)
      }
      req.setAcceptsKids(wrapper)
      this.updateProfile(req)
    },

    saveWheelchairAccessible(value: boolean | null) {
      const req = new UpdateProfileReq()
      const wrapper = new NullableBoolValue()
      if (value == null) {
        wrapper.setIsNull(true)
      } else {
        wrapper.setValue(value)
      }
      req.setWheelchairAccessible(wrapper)
      this.updateProfile(req)
    },

    saveSmokingAllowed(value: SmokingLocation) {
      const req = new UpdateProfileReq()
      req.setSmokingAllowed(value)
      this.updateProfile(req)
    },

    saveSleepingArrangement(value: string) {
      const req = new UpdateProfileReq()
      const wrapper = new NullableStringValue()
      if (value === "") {
        wrapper.setIsNull(true)
      } else {
        wrapper.setValue(value)
      }
      req.setSleepingArrangement(wrapper)
      this.updateProfile(req)
    },

    saveArea(value: string) {
      const req = new UpdateProfileReq()
      const wrapper = new NullableStringValue()
      if (value === "") {
        wrapper.setIsNull(true)
      } else {
        wrapper.setValue(value)
      }
      req.setArea(wrapper)
      this.updateProfile(req)
    },

    saveHouseRules(value: string) {
      const req = new UpdateProfileReq()
      const wrapper = new NullableStringValue()
      if (value === "") {
        wrapper.setIsNull(true)
      } else {
        wrapper.setValue(value)
      }
      req.setHouseRules(wrapper)
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
