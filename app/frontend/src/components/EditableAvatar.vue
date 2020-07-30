<template>
  <div>
    <p>Current avatar:</p>
    <img :src="user.avatarUrl" />
    <v-file-input
      :rules="avatarRules"
      accept="image/png, image/jpeg, image/bmp"
      placeholder="Pick a new avatar"
      prepend-icon="mdi-face"
      label="Avatar"
    ></v-file-input>
    <v-btn class="mx-2 my-2" v-on:click="upload" color="success">Upload</v-btn>
  </div>
</template>

<script lang="ts">
import Vue from "vue"

export default Vue.extend({
  props: ["user"],

  data: () => ({
    editing: false,
    avatarRules: [
      value => !value || value.size < 16000000 || 'Avatar size should be less than 16 MB!',
    ],
  }),

  methods: {
    edit() {
      this.editing = true
    },

    upload() {
      this.$emit("save")
      this.editing = false
    },
  },
})
</script>
