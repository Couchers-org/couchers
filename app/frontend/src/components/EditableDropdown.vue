<template>
  <div>
    <div v-if="!editing">
      <p>
        {{ items.find((i) => i.value == value).text }}
        <v-btn icon v-on:click="edit"><v-icon>mdi-pencil</v-icon></v-btn>
      </p>
    </div>
    <div v-if="editing">
      <v-select v-model="dirtyValue" :items="items"></v-select>
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
import "vue-simple-markdown/dist/vue-simple-markdown.css"

Vue.use(VueSimpleMarkdown)

export default Vue.extend({
  props: {
    items: Array,
    value: {},
  },

  data: () => ({
    editing: false,
    dirtyValue: null as any,
  }),

  created() {
    this.dirtyValue = this.value
  },

  methods: {
    edit() {
      this.editing = true
      this.dirtyValue = this.value
    },

    save() {
      this.$emit("save", this.dirtyValue)
      this.editing = false
    },

    cancel() {
      // stop editing and set text back to original
      this.editing = false
      this.dirtyValue = this.value
    },
  },
})
</script>
