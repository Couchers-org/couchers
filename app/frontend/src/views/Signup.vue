<template>
  <v-main>
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
                        :error-messages="error == null ? [] : error.message"
                        :success-messages="successMessages"
                        v-on:keyup.enter="submitSignup"
                        name="email"
                        label="Email"
                      ></v-text-field>
                    </v-row>
                    <v-row><p>We'll email you a link!</p></v-row>
                    <v-row
                      ><v-btn v-on:click="submitSignup" color="success"
                        >Sign up</v-btn
                      ></v-row
                    >
                  </v-form>
                </v-card-text>
              </v-card>
              <v-card flat v-if="signupStep == 'email'">
                <v-card-text>
                  <p>
                    We sent you a signup email. Please click on the link to
                    continue!
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
import { SignupReq, SignupRes } from "../pb/auth_pb"

export default Vue.extend({
  data: () => ({
    loading: false,
    email: "",
    error: null as Error | null,
    successMessages: [] as Array<string>,
    signupStep: "form",
    rules: {
      required: (value: string) => !!value || "Required.",
      validEmail(email: string) {
        const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        return re.test(email) || "Sorry! That doesn't look like a proper email."
      },
    },
  }),

  methods: {
    clearMessages() {
      this.error = null
      this.successMessages = []
    },

    async submitSignup() {
      this.loading = true
      this.clearMessages()

      const req = new SignupReq()

      req.setEmail(this.email)
      try {
        const res = await authClient.signup(req)
        switch (res.getNextStep()) {
          case SignupRes.SignupStep.SENT_SIGNUP_EMAIL:
            this.signupStep = "email"
            break
          case SignupRes.SignupStep.EMAIL_EXISTS:
            this.error = new Error("Email exists! Please login.")
            break
          case SignupRes.SignupStep.INVALID_EMAIL:
            this.error = new Error(
              "Sorry! That doesn't look like a proper email."
            )
            break
        }
      } catch (err) {
        this.error = err
      }
      this.loading = false
    },
  },
})
</script>
