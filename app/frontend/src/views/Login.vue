<template>
  <v-content>
    <v-container fill-height>
      <v-row align="center">
        <v-col>
          <v-container fluid>
            <v-col class="mx-auto" cols="12" sm="10" md="8" lg="6" xl="4">
              <v-form v-on:submit.prevent="submit">
                <v-row>
                  <v-text-field
                    autofocus
                    v-model="username"
                    :rules="[rules.required]"
                    :disabled="loading"
                    v-on:keyup.enter="submit"
                    name="username"
                    label="Username"
                  ></v-text-field>
                </v-row>
                <v-row>
                  <v-text-field
                    v-model="password"
                    :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                    :rules="[rules.required]"
                    :type="showPassword ? 'text' : 'password'"
                    :disabled="loading"
                    v-on:keyup.enter="submit"
                    name="password"
                    label="Password"
                    :error-messages="errorMessages"
                    :success-messages="successMessages"
                    @click:append="showPassword = !showPassword"
                  ></v-text-field>
                </v-row>
                <v-btn v-on:click="submit" color="primary" class="float-right" :loading="loading">Login</v-btn>
              </v-form>
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

  export default Vue.extend({
    name: 'Login',
  
    data: () => ({
      showPassword: false,
      loading: false,
      username: '',
      password: '',
      errorMessages: [] as Array<string>,
      successMessages: [] as Array<string>,
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
      submit: function () {
        this.loading = true;
        auth.authenticate(this.username, this.password, (err, res) => {
          if (err) {
            this.errorMessages = [err]
          } else if (res) {
            this.successMessages = [res]
          }
          this.loading = false
        })
      }
    },
  })
</script>
