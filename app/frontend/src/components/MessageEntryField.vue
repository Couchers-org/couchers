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
    <v-menu offset-y v-model="showEmojiPicker" :close-on-content-click="false">
      <template v-slot:activator="{ on }">
        <v-btn icon :disabled="disabled" v-on="on" class="my-auto mx-1">
          <v-icon>mdi-emoticon-happy</v-icon>
        </v-btn>
      </template>
      <picker v-if="showEmojiPicker"
        :data="emojiIndex"
        native
        @select="selectEmoji"
        :showPreview="false"
      />
    </v-menu>
    <v-btn icon :disabled="disabled" @click="$emit('send')" class="my-auto mx-1">
      <v-icon color="primary">mdi-send</v-icon>
    </v-btn>
      </v-card>
</template>

<script lang="ts">
import Vue from "vue"

import data from 'emoji-mart-vue-fast/data/all.json'
import { Picker, EmojiIndex } from 'emoji-mart-vue-fast'
import 'emoji-mart-vue-fast/css/emoji-mart.css'

export default Vue.extend({
  data: () => ({
    showEmojiPicker: false,
    emojiIndex: new EmojiIndex(data)
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
    Picker
  },

  computed: {
    text: {
      get() {
        return this.value
      },
      set(value) {
        this.$emit("input", value)
      },
    },
  },

  methods: {
    selectEmoji(e: object) {
      this.text = this.text + e.native
    }
  },
})
</script>
