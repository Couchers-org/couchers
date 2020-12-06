<template>
  <v-main>
    <v-container fill-height>
      <v-row align="center">
        <v-col>
          <v-container fluid>
            <v-col class="mx-auto" cols="12" sm="10" md="8" lg="6" xl="4">
              <h1>Login</h1>
              <v-alert v-if="reason" type="warning">
                {{ reason }}
              </v-alert>
              <v-card flat v-if="loginStep == 'user' || loginStep == 'pass'">
                <v-card-text>
                  <v-form v-on:submit.prevent="submit">
                    <v-row>
                      <v-text-field
                        :autofocus="loginStep == 'user'"
                        v-model="username"
                        :rules="[rules.required]"
                        :disabled="loading"
                        :loading="loading && loginStep == 'user'"
                        :error-messages="errorMessages"
                        :success-messages="successMessages"
                        v-on:keydown.enter="submit"
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
                        v-on:keydown.enter="submit"
                        name="password"
                        label="Password"
                        :error-messages="passErrorMessages"
                        @click:append="showPassword = !showPassword"
                      ></v-text-field>
                    </v-row>
                    <v-row class="mt-5"
                      ><v-btn
                        v-on:click="submit"
                        :disabled="loading"
                        color="primary"
                        class="mx-2"
                        >{{ loginStep == "user" ? "Next" : "Login" }}</v-btn
                      >
                      <v-btn to="/signup" color="secondary" class="mx-2"
                        >Create an account</v-btn
                      >
                    </v-row>
                  </v-form>
                </v-card-text>
              </v-card>
              <v-card flat v-if="loginStep == 'email'">
                <v-card-text>
                  <p>
                    We sent you a login email. Please click the link to sign in!
                  </p>
                </v-card-text>
              </v-card>
            </v-col>
          </v-container>
        </v-col>
      </v-row>
    </v-container>
  </v-main>
</template>

<script lang="ts">
import Vue from "vue"

import { authClient } from "../api"
import { AuthReq, LoginReq, LoginRes } from "../pb/auth_pb"
import { StatusCode } from "grpc-web"

import Store from "../store"
import Router from "../router"

export default Vue.extend({
  data: () => ({
    showPassword: false,
    loading: false,
    username: "",
    password: "",
    errorMessages: [] as Array<string>,
    passErrorMessages: [] as Array<string>,
    successMessages: [] as Array<string>,
    reason: "",
    loginStep: "user",
    rules: {
      required: (value: string) => !!value || "Required.",
    },
  }),

  created() {
    this.reason = this.$route.params.reason
  },

  watch: {
    // empty error and success messages if we change user/pass combo
    username() {
      this.errorMessages = []
      this.successMessages = []
    },

    password() {
      this.errorMessages = []
      this.successMessages = []
    },
  },

  methods: {
    clearMessages() {
      this.errorMessages = []
      this.passErrorMessages = []
      this.successMessages = []
    },

    async submit() {
      this.reason = ""
      this.loading = true
      this.clearMessages()
      if (this.loginStep == "user") {
        const req = new LoginReq()
        req.setUser(this.username)

        try {
          const res = await authClient.login(req)
          switch (res.getNextStep()) {
            case LoginRes.LoginStep.NEED_PASSWORD:
              this.loginStep = "pass"
              break
            case LoginRes.LoginStep.SENT_LOGIN_EMAIL:
              this.loginStep = "email"
              break
            case LoginRes.LoginStep.INVALID_USER:
              this.errorMessages = ["User not found!"]
              break
          }
        } catch (err) {
          this.errorMessages = ["Unknown error."]
        }
        this.loading = false
      } else if (this.loginStep == "pass") {
        const req = new AuthReq()
        req.setUser(this.username)
        req.setPassword(this.password)

        try {
          const res = await authClient.authenticate(req)
          this.successMessages = ["Success."]
          Store.dispatch("auth", res)
          Router.push("/")
        } catch (err) {
          if (err.code == StatusCode.UNAUTHENTICATED) {
            this.passErrorMessages = ["Invalid username or password."]
          } else {
            this.passErrorMessages = ["Unknown error."]
          }
        }
        this.loading = false
      }
    },
  },
})
</script>
