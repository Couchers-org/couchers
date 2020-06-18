<template>
  <div>
    <div v-if="!editing">
      <p><v-sheet width="250" height="80" :color="color" tile></v-sheet> <v-btn icon v-on:click="edit"><v-icon>mdi-pencil</v-icon></v-btn></p>
    </div>
    <div v-if="editing">
      <p><v-sheet width="250" height="80" :color="dirtyColor" tile></v-sheet></p>
      <v-color-picker class="ma-2" show-swatches hide-inputs :value="dirtyColor" @input="input"></v-color-picker>
      <v-btn class="mx-2 my-2" v-on:click="save" color="success">Save</v-btn>
      <v-btn class="mx-2 my-2" v-on:click="cancel" color="warning">Cancel</v-btn>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  props: ['color'],

  data: () => ({
    editing: false,
    dirtyColor: null
  }),

  methods: {
    edit() {
      this.editing = true
      this.dirtyColor = this.color
    },

    input(e) {
      this.dirtyColor = e
    },

    save() {
      this.$emit('save', this.dirtyColor)
      this.editing = false
    },

    cancel() {
      this.editing = false
      this.dirtyColor = this.color
    }
  }
})
</script>
