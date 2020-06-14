<template>
  <v-content>
    <v-container fill-height>
      <v-row align="center">
        <v-col>
          <v-container fluid>
            <v-col class="mx-auto" cols="12" sm="10" md="8" lg="6" xl="4">
              <h1>Login</h1>
              <v-card flat v-if="loginStep == 'user' || loginStep == 'pass'">
                <v-card-text>
                  <v-form v-on:submit.prevent="submitLoginUser">
                    <v-row>
                      <v-text-field
                        :autofocus="loginStep == 'user'"
                        v-model="username"
                        :rules="[rules.required]"
                        :disabled="loading"
                        :loading="loading && loginStep == 'user'"
                        :error-messages="errorMessages"
                        :success-messages="successMessages"
                        v-on:keyup.enter="submitLoginUser"
                        name="username"
                        label="Username/email"
                      ></v-text-field>
                    </v-row>
                    <v-row v-if="loginStep == 'pass'">
                      <v-text-field
                        :autofocus="loginStep == 'pass'"
                        v-model="password"
                        :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                        :rules="[rules.required]"
                        :type="showPassword ? 'text' : 'password'"
                        :disabled="loading"
                        :loading="loading"
                        v-on:keyup.enter="submitLoginPass"
                        name="password"
                        label="Password"
                        :error-messages="passErrorMessages"
                        @click:append="showPassword = !showPassword"
                      ></v-text-field>
                    </v-row>
                    <v-row><v-btn v-on:click="submitLoginUser" :disabled="loading" color="primary" v-if="loginStep == 'user'">Next</v-btn></v-row>
                    <v-row><v-btn v-on:click="submitLoginPass" :disabled="loading" color="primary" v-if="loginStep == 'pass'">Login</v-btn></v-row>
                  </v-form>
                </v-card-text>
              </v-card>
              <v-card flat v-if="loginStep == 'email'">
                <v-card-text>
                  <p>We sent you a login email. Please click the link to sign in!</p>
                </v-card-text>
              </v-card>
            </v-col>
          </v-container>
        </v-col>
      </v-row>
    </v-container>
  </v-content>
</template>

<script lang="ts">
import Vue from 'vue'

import auth from '../auth'

import { AuthClient } from '../pb/AuthServiceClientPb'
import { AuthReq, LoginReq, LoginRes } from '../pb/auth_pb'

import * as grpcWeb from 'grpc-web'

const authClient = new AuthClient("http://127.0.0.1:8888")

import Store, { AuthenticationState } from '../store'

import Router from '../router'

export default Vue.extend({
  name: 'Login',

  data: () => ({
    showPassword: false,
    loading: false,
    username: '',
    password: '',
    errorMessages: [] as Array<string>,
    passErrorMessages: [] as Array<string>,
    successMessages: [] as Array<string>,
    loginStep: 'user',
    rules: {
      required: (value: string) => !!value || 'Required.'
    },
  }),

  watch: {
    // empty error and success messages if we change user/pass combo
    username: function () {
      this.errorMessages = []
      this.successMessages = []
    },
    password: function () {
      this.errorMessages = []
      this.successMessages = []
    }
  },

  methods: {
    clearMessages: function () {
      this.errorMessages = []
      this.passErrorMessages = []
      this.successMessages = []
    },
    submitLoginUser: function () {
      this.loading = true;
      this.clearMessages()

      const req = new LoginReq()

      req.setUsername(this.username)
      authClient.login(req, null).then(res => {
        switch (res.getNextStep()) {
          case LoginRes.LoginStep.NEED_PASSWORD:
            this.loginStep = 'pass'
            break
          case LoginRes.LoginStep.SENT_LOGIN_EMAIL:
            this.loginStep = 'email'
            break
          case LoginRes.LoginStep.LOGIN_NO_SUCH_USER:
            this.errorMessages = ['User not found!']
            break
        }
        this.loading = false
      }).catch(err => {
        this.errorMessages = ['Unknown error.']
        this.loading = false
      })
    },
    submitLoginPass: function () {
      this.loading = true;
      this.clearMessages()

      const req = new AuthReq()

      req.setUsername(this.username)
      req.setPassword(this.password)
      authClient.authenticate(req, null).then(res => {
        this.loading = false
        this.successMessages = ['Success.']
        Store.commit('auth', {
          authState: AuthenticationState.Authenticated,
          authToken: res.getToken()
        })
        Router.push('/')
      }).catch(err => {
        this.loading = false
        if (err.code == grpcWeb.StatusCode.UNAUTHENTICATED) {
          this.passErrorMessages = ['Invalid username or password.']
        } else {
          this.passErrorMessages = ['Unknown error.']
        }
      })
    },
  },
})
</script>
