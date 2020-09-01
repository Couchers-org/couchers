<template>
  <v-card tile class="d-flex">
    <v-text-field
      v-model="text"
      autofocus
      :disabled="disabled"
      solo
      flat
      single-line
      hide-details
      label="Send a message"
      v-on:keyup.enter="$emit('send')"
      class="flex-grow-1"
    ></v-text-field>
    <twemoji-picker
      :emojiPickerDisabled="disabled"
      @emojiUnicodeAdded="selectEmoji"
      :emojiData="emojiDataAll"
      :emojiGroups="emojiGroups"
      :skinsSelection="true"
      :searchEmojisFeat="true"
      :randomEmojiArray="['🙂']"
      searchEmojiPlaceholder="Search"
      searchEmojiNotFound="Emojis not found."
      isLoadingLabel="Loading..."
    ></twemoji-picker>
    <v-btn icon :disabled="disabled" @click="$emit('send')" class="my-auto mx-1">
      <v-icon color="primary">mdi-send</v-icon>
    </v-btn>
  </v-card>
</template>

<script lang="ts">
import Vue from "vue"

import EmojiData from "@kevinfaguiar/vue-twemoji-picker/emoji-data/en/emoji-all-groups.json"
import { TwemojiPicker } from "@kevinfaguiar/vue-twemoji-picker"
import EmojiGroups from "@kevinfaguiar/vue-twemoji-picker/emoji-data/emoji-groups.json"

export default Vue.extend({
  data: () => ({
    showEmojiPicker: false,
  }),

  props: {
    value: {
      required: true,
      type: String,
    },
    disabled: {
      required: true,
      type:  Boolean,
    }
  },

  components: {
    TwemojiPicker
  },

  computed: {
    text: {
      get(): string {
        return this.value
      },
      set(value: string) {
        this.$emit("input", value)
      },
    },
    
    emojiDataAll() {
        return EmojiData
      },
      emojiGroups() {
        return EmojiGroups
      }
  },

  methods: {
    selectEmoji(e: string) {
      this.text = this.text + e
    }
  },
})
</script>
