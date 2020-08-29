<template>
  <div>
    <div v-if="!editing">
      <p>
        {{ text }}
        <v-btn icon v-on:click="edit"><v-icon>mdi-pencil</v-icon></v-btn>
      </p>
    </div>
    <div v-if="editing">
      <v-text-field v-model="dirtyText"></v-text-field>
      <v-btn class="mx-2 my-2" v-on:click="save" color="success">Save</v-btn>
      <v-btn class="mx-2 my-2" v-on:click="cancel" color="warning"
        >Cancel</v-btn
      >
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue"

export default Vue.extend({
  props: {
    text: String,
    clearOnEdit: Boolean,
  },

  data: () => ({
    editing: false,
    dirtyText: null as null | string,
  }),

  methods: {
    edit() {
      this.editing = true
      this.dirtyText = this.clearOnEdit ? "" : this.text
    },

    save() {
      this.$emit("save", this.dirtyText)
      this.editing = false
    },

    cancel() {
      // stop editing and set text back to original
      this.editing = false
      this.dirtyText = this.text
    },
  },
})
</script>
