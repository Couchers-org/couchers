<template>
  <div>
    <div v-if="!editing">
      <p>{{ text }}</p>
      <v-btn class="mx-2 my-2" v-on:click="edit">Edit</v-btn>
    </div>
    <div v-if="editing">
      <v-text-field v-model="dirtyText"></v-text-field>
      <v-btn class="mx-2 my-2" v-on:click="save" color="success">Save</v-btn>
      <v-btn class="mx-2 my-2" v-on:click="cancel" color="warning">Cancel</v-btn>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.component('editable-textarea', {
  props: ['text'],

  data: () => ({
    editing: false,
    dirtyText: null
  }),

  methods: {
    edit() {
      this.editing = true
      this.dirtyText = this.text
    },

    save() {
      this.$emit('save', this.dirtyText)
      this.editing = false
    },

    cancel() {
      // stop editing and set text back to original
      this.editing = false
      this.dirtyText = this.text
    }
  }
})
</script>
