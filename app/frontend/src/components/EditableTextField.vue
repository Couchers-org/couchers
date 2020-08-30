<template>
  <div>
    <div v-if="!editing">
      <p>
        {{ text }}
        <v-btn icon v-on:click="edit"><v-icon>mdi-pencil</v-icon></v-btn>
      </p>
    </div>
    <div v-if="editing">
      <v-text-field v-model="dirtyText" :disabled="loading"></v-text-field>
      <v-btn class="mx-2 my-2" v-on:click="saveText" color="success" :loading="loading">Save</v-btn>
      <v-btn class="mx-2 my-2" v-on:click="cancel" color="warning"
        >Cancel</v-btn
      >
    </div>
  </div>
</template>

<script lang="ts">
import Vue, { PropType } from "vue"

type SaveCallback = (value: string | null) => Promise<void>;

export default Vue.extend({
  props: {
    text: String,
    clearOnEdit: Boolean,
    save: Function as PropType<SaveCallback>,
  },

  data: () => ({
    editing: false,
    loading: false,
    dirtyText: null as null | string,
  }),

  methods: {
    edit() {
      this.editing = true
      this.dirtyText = this.clearOnEdit ? "" : this.text
    },

    async saveText() {
      this.loading = true
      await this.save(this.dirtyText)
      this.loading = false
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
