<template>
  <v-container fill-height>
    <v-row align="center">
      <v-col>
        <v-container fluid>
          <v-row>
            <h1 class="mx-auto">Sign up for Couchers.org</h1>
          </v-row>
          <v-row>
            <v-col class="mx-auto" cols="12" sm="10" md="8" lg="6" xl="4">
              <error-alert :error="error" />
              <v-card flat>
                <v-card-text>
                  <v-form v-on:submit.prevent="submit">
                    <v-row>
                      <v-text-field
                        v-model="email"
                        :rules="[rules.required]"
                        disabled
                        :loading="emailLoading"
                        name="email"
                        label="Email"
                      ></v-text-field>
                    </v-row>
                    <v-row>
                      <v-text-field
                        autofocus
                        v-model="name"
                        :rules="[rules.required]"
                        :disabled="loading"
                        :loading="loading"
                        name="name"
                        label="Display name"
                      ></v-text-field>
                    </v-row>
                    <v-row>
                      <v-text-field
                        v-model="username"
                        :rules="[rules.required]"
                        :disabled="loading"
                        :loading="loading"
                        :error-messages="usernameErrorMessages"
                        :success-messages="usernameSuccessMessages"
                        v-on:keyup="lazyCheckUsername"
                        name="username"
                        label="Username"
                      ></v-text-field>
                    </v-row>
                    <v-row>
                      <v-text-field
                        v-model="city"
                        :rules="[rules.required]"
                        :disabled="loading"
                        name="city"
                        label="City"
                      ></v-text-field>
                    </v-row>
                    <v-row>
                      <v-combobox
                        v-model="gender"
                        :items="genders"
                        :disabled="loading"
                        name="gender"
                        label="Gender"
                      ></v-combobox>
                    </v-row>
                    <v-row>
                      <v-menu
                        v-model="dateMenu"
                        :close-on-content-click="false"
                        transition="scale-transition"
                        offset-y
                        min-width="290px"
                        ref="dateMenu"
                      >
                        <template v-slot:activator="{ on, attrs }">
                          <v-text-field
                            v-model="dateText"
                            label="Birthday"
                            prepend-icon="mdi-calendar"
                            hint="Note: this will be used for verification and cannot be changed in the future."
                            persistent-hint
                            v-bind="attrs"
                            v-on="on"
                          ></v-text-field>
                        </template>
                        <v-date-picker
                          v-model="date"
                          :max="new Date().toISOString().substr(0, 10)"
                          @input="
                            dateMenu = false
                            dateText = date
                          "
                        ></v-date-picker>
                      </v-menu>
                    </v-row>
                    <v-row class="mt-3">
                      <v-select
                        v-model="hostingStatus"
                        :items="hostingStatusItems"
                        label="Can you host?"
                      ></v-select>
                    </v-row>
                    <v-row class="mt-5"
                      ><v-btn
                        v-on:click="submit"
                        :disabled="loading"
                        color="primary"
                        >Sign up!</v-btn
                      ></v-row
                    >
                  </v-form>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-container>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue"

import { authClient } from "../api"
import {
  SignupTokenInfoReq,
  CompleteSignupReq,
  UsernameValidReq,
} from "../pb/auth_pb"

import Store from "../store"

import Router from "../router"
import ErrorAlert from "../components/ErrorAlert.vue"
import { displayHostingStatus } from "../utils"
import { HostingStatus } from "../pb/api_pb"

export default Vue.extend({
  data: () => ({
    genders: ["Male", "Female", "(Type anything you like)"],
    loading: false,
    error: null as null | Error | Array<Error>,
    successMessages: [] as Array<string>,
    username: "",
    usernameErrorMessages: [] as Array<string>,
    usernameSuccessMessages: [] as Array<string>,
    usernameTimer: (null as unknown) as number,
    email: "",
    emailLoading: true,
    name: "",
    city: "",
    date: "",
    dateText: "",
    dateMenu: false,
    gender: "",
    hostingStatus: HostingStatus.HOSTING_STATUS_UNSPECIFIED,
    rules: {
      required: (value: string) => !!value || "Required.",
    },
  }),

  components: {
    ErrorAlert,
  },

  created() {
    this.fetchData()
  },

  computed: {
    hostingStatusItems() {
      return [
        { text: "Can host", value: HostingStatus.HOSTING_STATUS_CAN_HOST },
        { text: "Maybe", value: HostingStatus.HOSTING_STATUS_MAYBE },
        { text: "Difficult", value: HostingStatus.HOSTING_STATUS_DIFFICULT },
        { text: "Can't host", value: HostingStatus.HOSTING_STATUS_CANT_HOST },
      ]
    },
  },

  watch: {
    dateText() {
      const date = new Date(this.dateText)
      if (
        this.dateText.search(/\d\d\d\d-\d\d-\d\d/) != -1 &&
        !isNaN(date.getTime())
      ) {
        this.date = this.dateText
      } else {
        const defaultDate = new Date()
        defaultDate.setFullYear(defaultDate.getFullYear() - 30)
        this.date = defaultDate.toISOString().substr(0, 10)
      }
    },
  },

  methods: {
    async fetchData() {
      this.emailLoading = false

      const req = new SignupTokenInfoReq()
      req.setSignupToken(this.$route.params.token)
      try {
        const res = await authClient.signupTokenInfo(req)
        this.email = res.getEmail()
      } catch (err) {
        Router.push({ name: "Signup", params: { reason: err.message } })
      }
      this.emailLoading = false
    },

    clearMessages() {
      this.error = null
      this.successMessages = []
    },

    lazyCheckUsername() {
      clearTimeout(this.usernameTimer)
      this.usernameTimer = setTimeout(this.checkUsername, 500)
    },

    async checkUsername() {
      this.usernameErrorMessages = []
      this.usernameSuccessMessages = []

      if (this.username == "") return

      if (this.username.search(/[A-Z]/) != -1) {
        this.usernameErrorMessages.push("Only use lowercase letters.")
      }

      if (this.username.search(/^\d/) != -1) {
        this.usernameErrorMessages.push("Don't start with a number.")
      }

      if (this.username.search(/[^a-z0-9]/) != -1) {
        this.usernameErrorMessages.push("Only use basic letters and numbers.")
      }

      if (this.usernameErrorMessages.length > 0) return

      const req = new UsernameValidReq()

      req.setUsername(this.username)
      try {
        const res = await authClient.usernameValid(req)
        if (res.getValid()) {
          this.usernameSuccessMessages = ["Username available!"]
        } else {
          this.usernameErrorMessages = ["Username not valid or not available."]
        }
      } catch (err) {
        this.usernameErrorMessages = ["Unknown error."]
      }
    },

    async submit() {
      this.error = []

      if (this.usernameErrorMessages.length > 0) {
        this.error.push(Error("Please fix your username."))
      }

      if (
        this.name == "" ||
        this.city == "" ||
        this.date == "" ||
        this.username == "" ||
        !this.hostingStatus
      ) {
        this.error.push(Error("All fields are required (except gender)."))
      }

      if (this.date.search(/^\d\d\d\d-\d\d-\d\d$/) == -1) {
        this.error.push(Error("Birthdate must be in the format YYYY-MM-DD"))
      }

      if (this.error.length > 0) {
        return
      } else {
        this.error = null
      }

      this.loading = true
      this.clearMessages()

      const req = new CompleteSignupReq()

      req.setSignupToken(this.$route.params.token)
      req.setUsername(this.username)
      req.setName(this.name)
      req.setCity(this.city)
      //this.dateText because this.date resets to default in case of invalid format
      req.setBirthdate(this.dateText)
      req.setGender(this.gender)
      req.setHostingStatus(this.hostingStatus)

      try {
        const res = await authClient.completeSignup(req)
        this.successMessages = ["Success."]
        Store.dispatch("auth", res)
        Router.push("/profile")
      } catch (err) {
        this.error = err
      }
      this.loading = false
    },

    displayHostingStatus,
  },
})
</script>
