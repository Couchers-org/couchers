<template>
  <div>
    <div v-if="!editing">
      <v-container v-if="!isMarkdown">
        <p>
          {{ text }}
          <v-btn icon v-on:click="edit"><v-icon>mdi-pencil</v-icon></v-btn>
        </p>
      </v-container>
      <v-container v-else>
          <vue-simple-markdown :source="text"></vue-simple-markdown>
          <v-btn icon v-on:click="edit"><v-icon>mdi-pencil</v-icon></v-btn>
      </v-container>
    </div>
    <div v-if="editing">
      <v-textarea v-model="dirtyText"></v-textarea>
      <v-btn class="mx-2 my-2" v-on:click="save" color="success">Save</v-btn>
      <v-btn class="mx-2 my-2" v-on:click="cancel" color="warning"
        >Cancel</v-btn
      >
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue"
import VueSimpleMarkdown from "vue-simple-markdown"
import 'vue-simple-markdown/dist/vue-simple-markdown.css'

Vue.use(VueSimpleMarkdown)

export default Vue.extend({
  props: {
    text: String,
    isMarkdown: Boolean
  },

  data: () => ({
    editing: false,
    dirtyText: null as (null | string),
  }),

  methods: {
    edit() {
      this.editing = true
      this.dirtyText = this.text
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
