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
              <error-alert :error="error"/>
              <v-card flat>
                <v-card-text>
                  <v-form v-on:submit.prevent="submit">
                    <v-row>
                      <v-text-field
                        v-model="email"
                        :rules="[rules.required]"
                        disabled
                        :loading="emailLoading"
                        :error-messages="emailErrorMessages"
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
                        ref="dateMenu"
                        v-model="dateMenu"
                        :close-on-content-click="false"
                        transition="scale-transition"
                        offset-y
                        min-width="290px"
                      >
                        <template v-slot:activator="{ on, attrs }">
                          <v-text-field
                            v-model="date"
                            label="Birthday"
                            prepend-icon="mdi-calendar"
                            hint="Note: this will be used for verification and cannot be changed in the future."
                            persistent-hint
                            readonly
                            v-bind="attrs"
                            v-on="on"
                          ></v-text-field>
                        </template>
                        <v-date-picker
                          ref="picker"
                          v-model="date"
                          :max="new Date().toISOString().substr(0, 10)"
                          min="1900-01-01"
                          @change="saveDate"
                        ></v-date-picker>
                      </v-menu>
                    </v-row>
                    <v-row class="mt-5"><v-btn v-on:click="submit" :disabled="loading" color="primary">Sign up!</v-btn></v-row>
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
import Vue from 'vue'

import { authClient } from '../api'
import { SignupTokenInfoReq, CompleteSignupReq, UsernameValidReq } from '../pb/auth_pb'

import * as grpcWeb from 'grpc-web'

import Store, { AuthenticationState } from '../store'

import Router from '../router'
import ErrorAlert from '../components/ErrorAlert.vue'

export default Vue.extend({
  data: () => ({
    genders: ['Male', 'Female', 'Genderqueer/nonbinary'],
    loading: false,
    error: null as (null | Error),
    successMessages: [] as Array<string>,
    username: "",
    usernameErrorMessages: [] as Array<string>,
    usernameSuccessMessages: [] as Array<string>,
    usernameTimer: null as any,
    email: '',
    emailLoading: true,
    emailErrorMessages: [] as Array<string>,
    name: '',
    city: '',
    date: null,
    dateMenu: false,
    gender: '',
    rules: {
      required: (value: string) => !!value || 'Required.'
    },
  }),

  components: {
    ErrorAlert
  },

  watch: {
    dateMenu (val) {
      val && setTimeout(() => (this.$refs.picker.activePicker = 'YEAR'))
    },
  },

  created () {
    this.fetchData()
  },

  methods: {
    saveDate (date) {
      this.$refs.dateMenu.save(date)
    },

    fetchData: function () {
      this.emailLoading = false
      this.emailErrorMessages = []

      const req = new SignupTokenInfoReq()
      req.setSignupToken(this.$route.params.token)
      authClient.signupTokenInfo(req).then(res => {
        this.emailLoading = false
        this.email = res.getEmail()
      }).catch(err => {
        this.emailLoading = false
        this.emailErrorMessages = ['Failed to fetch details.']
      })
    },

    clearMessages: function () {
      this.error = null
      this.successMessages = []
    },

    lazyCheckUsername: function () {
      clearTimeout(this.usernameTimer)
      this.usernameTimer = setTimeout(this.checkUsername, 500);
    },

    checkUsername: function () {
      this.usernameErrorMessages = []
      this.usernameSuccessMessages = []

      const req = new UsernameValidReq()

      req.setUsername(this.username)
      authClient.usernameValid(req).then(res => {
        if (res.getValid()) {
          this.usernameSuccessMessages = ['Username available!']
        } else {
          this.usernameErrorMessages = ['Username not valid or not available.']
        }
      }).catch(err => {
        this.usernameErrorMessages = ['Unknown error.']
      })
    },

    submit: function () {
      this.loading = true
      this.clearMessages()

      const req = new CompleteSignupReq()

      req.setSignupToken(this.$route.params.token)
      req.setUsername(this.username)
      req.setName(this.name)
      req.setCity(this.city)
      req.setBirthdate(this.date)
      req.setGender(this.gender)

      authClient.completeSignup(req).then(res => {
        this.loading = false
        this.successMessages = ['Success.']
        Store.commit('auth', {
          authState: AuthenticationState.Authenticated,
          authToken: res.getToken()
        })
        Router.push('/profile')
      }).catch(err => {
        this.loading = false
        this.error = err
      })
    },
  }
})
</script>
