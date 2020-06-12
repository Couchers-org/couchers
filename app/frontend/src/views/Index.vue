<template>
  <v-container fill-height>
    <v-row align="center">
      <v-col>
        <v-container fluid>
          <v-row>
            <v-col cols="12">
              <v-img
                :src="require('../assets/logo.svg')"
                class="mb-5"
                contain
                height="200"
              />
            </v-col>
          </v-row>
          <v-row>
            <h1 class="mx-auto">Welcome to Couchers.org</h1>
          </v-row>
          <v-row>
            <v-col class="mx-auto" cols="12" sm="10" md="8" lg="6" xl="4">
              <v-tabs v-model="tab" background-color="transparent" grow>
                <v-tab key="login" :disabled="loginStep != 'user' || signupStep != 'form'">Log in</v-tab>
                <v-tab key="signup" :disabled="loginStep != 'user' || signupStep != 'form'">Sign up</v-tab>
              </v-tabs>
              <v-tabs-items v-model="tab" style="min-height: 300px">
                <v-tab-item key="login">
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
                </v-tab-item>
                <v-tab-item key="signup">
                  <v-card flat v-if="signupStep == 'form'">
                    <v-card-text>
                      <v-form v-on:submit.prevent="submitSignup">
                        <v-row>
                          <v-text-field
                            autofocus
                            v-model="signupEmail"
                            :rules="[rules.required]"
                            :disabled="loading"
                            :loading="loading"
                            :error-messages="errorMessages"
                            :success-messages="successMessages"
                            v-on:keyup.enter="submitSignup"
                            name="signupEmail"
                            label="Email"
                          ></v-text-field>
                        </v-row>
                        <v-row><p>We'll email you a link!</p></v-row>
                        <v-row><v-btn v-on:click="submitSignup" color="success">Sign up</v-btn></v-row>
                      </v-form>
                    </v-card-text>
                  </v-card>
                  <v-card flat v-if="signupStep == 'email'">
                    <v-card-text>
                      <p>We sent you a signup email. Please click on the link to continue!</p>
                    </v-card-text>
                  </v-card>
                </v-tab-item>
              </v-tabs-items>
            </v-col>
          </v-row>
        </v-container>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import Vue from 'vue'

import auth from '../auth'

import { AuthClient } from '../pb/AuthServiceClientPb'
import { AuthRequest, DeauthRequest, LoginRequest, SignupRequest, LoginResponse, SignupResponse } from '../pb/auth_pb'

import * as grpcWeb from 'grpc-web'

const authClient = new AuthClient("http://127.0.0.1:8888")

import Store, { AuthenticationState } from '../store'

import Router from '../router'

export default Vue.extend({
  data: () => ({
    loading: false,
    tab: 'login',
    name: 'Index',
    username: '',
    password: '',
    signupEmail: '',
    showPassword: false,
    errorMessages: [] as Array<string>,
    passErrorMessages: [] as Array<string>,
    successMessages: [] as Array<string>,
    loginStep: 'user',
    signupStep: 'form',
    rules: {
      required: (value: string) => !!value || 'Required.'
    },
  }),

  methods: {
    clearMessages: function () {
      this.errorMessages = []
      this.passErrorMessages = []
      this.successMessages = []
    },
    submitLoginUser: function () {
      this.loading = true;
      this.clearMessages()

      const req = new LoginRequest()

      req.setUsername(this.username)
      authClient.login(req, null).then(res => {
        switch (res.getNextStep()) {
          case LoginResponse.LoginStep.NEED_PASSWORD:
            this.loginStep = 'pass'
            break
          case LoginResponse.LoginStep.SENT_LOGIN_EMAIL:
            this.loginStep = 'email'
            break
          case LoginResponse.LoginStep.LOGIN_NO_SUCH_USER:
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

      const req = new AuthRequest()

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
    submitSignup: function () {
      this.loading = true;
      this.clearMessages()

      const req = new SignupRequest()

      req.setEmail(this.signupEmail)
      authClient.signup(req, null).then(res => {
        switch (res.getNextStep()) {
          case SignupResponse.SignupStep.SENT_SIGNUP_EMAIL:
            this.signupStep = 'email'
            break
          case SignupResponse.SignupStep.EMAIL_EXISTS:
            this.errorMessages = ['Email exists! Please login.']
            break
        }
        this.loading = false
      }).catch(err => {
        this.errorMessages = ['Unknown error.']
        this.loading = false
      })
    },
  }
})
</script>
