<template>
  <v-content>
    <v-container fill-height>
      <v-row align="center">
        <v-col>
          <v-container fluid>
            <v-col class="mx-auto" cols="12" sm="10" md="8" lg="6" xl="4">
              <h1>Sign up</h1>
              <v-card flat v-if="signupStep == 'form'">
                <v-card-text>
                  <v-form v-on:submit.prevent="submitSignup">
                    <v-row>
                      <v-text-field
                        autofocus
                        v-model="email"
                        :rules="[rules.required, rules.validEmail]"
                        :disabled="loading"
                        :loading="loading"
                        :error-messages="errorMessages"
                        :success-messages="successMessages"
                        v-on:keyup.enter="submitSignup"
                        name="email"
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
import { SignupReq, SignupRes } from '../pb/auth_pb'

import * as grpcWeb from 'grpc-web'

const authClient = new AuthClient("http://127.0.0.1:8888")

import Store, { AuthenticationState } from '../store'

import Router from '../router'

export default Vue.extend({
  name: 'Signup',

  data: () => ({
    loading: false,
    email: '',
    errorMessages: [] as Array<string>,
    successMessages: [] as Array<string>,
    signupStep: 'form',
    rules: {
      required: (value: string) => !!value || 'Required.',
      validEmail: function (email) {
        const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(email) || 'Sorry! That doesn\'t look like a proper email.';
      }
    },
  }),

  methods: {
    clearMessages: function () {
      this.errorMessages = []
      this.successMessages = []
    },
    submitSignup: function () {
      this.loading = true;
      this.clearMessages()

      const req = new SignupReq()

      req.setEmail(this.email)
      authClient.signup(req, null).then(res => {
        switch (res.getNextStep()) {
          case SignupRes.SignupStep.SENT_SIGNUP_EMAIL:
            this.signupStep = 'email'
            break
          case SignupRes.SignupStep.EMAIL_EXISTS:
            this.errorMessages = ['Email exists! Please login.']
            break
          case SignupRes.SignupStep.INVALID_EMAIL:
            this.errorMessages = ['Sorry! That doesn\'t look like a proper email.']
            break
        }
        this.loading = false
      }).catch(err => {
        this.errorMessages = ['Unknown error.']
        this.loading = false
      })
    },
  },
})
</script>
