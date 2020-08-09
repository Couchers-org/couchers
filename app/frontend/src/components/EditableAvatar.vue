<template>
  <div>
    <error-alert :error="error" />
    <p>Current avatar:</p>
    <img :src="user.avatarUrl" />
    <v-file-input
      v-model="image"
      :rules="avatarRules"
      accept="image/png, image/jpeg, image/bmp"
      placeholder="Pick a new avatar"
      prepend-icon="mdi-face"
      label="Avatar"
      :disabled="loading"
      show-size
    ></v-file-input>
    <v-progress-linear v-if="loading" :value="progress"></v-progress-linear>
    <v-btn
      class="mx-2 my-2"
      :disabled="loading"
      v-on:click="upload"
      color="success"
      >Upload</v-btn
    >
  </div>
</template>

<script lang="ts">
import Vue from "vue"

import ErrorAlert from "../components/ErrorAlert.vue"

import axios from "axios"

import { Empty } from "google-protobuf/google/protobuf/empty_pb"

import { client } from "../api"

export default Vue.extend({
  props: ["user"],

  data: () => ({
    image: null as null | File,
    progress: 0,
    error: null as Error | null,
    loading: false,
    avatarRules: [
      (value) =>
        !value ||
        value.size < 16000000 ||
        "Avatar size should be less than 16 MB!",
    ],
  }),

  components: {
    ErrorAlert,
  },

  methods: {
    upload() {
      client.initiateMediaUpload(new Empty()).then((res) => {
        const formData = new FormData()
        formData.append("file", this.image)
        this.progress = 0
        this.loading = true
        axios
          .post(res.getUploadUrl(), formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
            onUploadProgress: (event) => {
              this.progress = (event.loaded / event.total) * 100
            },
          })
          .then((res) => {
            this.$emit("save")
            this.image = null
          })
          .catch((err) => {
            this.error = err
          })
          .finally(() => {
            this.loading = false
          })
      })
    },
  },
})
</script>
