<template>
  <v-card class="float-left mx-3 my-3" width="350" outlined>
    <v-sheet height="80" :color="user.color" tile></v-sheet>
    <v-card-title>{{ user.name }}</v-card-title>
    <v-card-subtitle>{{ user.city }}</v-card-subtitle>
    <v-list-item two-item>
      <v-list-item-icon>
        <v-icon>mdi-account-check</v-icon>
      </v-list-item-icon>
      <v-list-item-content>
        <v-list-item-title>Verification (coming soon)</v-list-item-title>
        <v-list-item-subtitle
          ><v-progress-linear
            class="my-2"
            height="12"
            rounded
            value="0"
            color="light-green"
          ></v-progress-linear
        ></v-list-item-subtitle>
      </v-list-item-content>
    </v-list-item>
    <v-list-item two-item>
      <v-list-item-icon>
        <v-icon>mdi-account-group</v-icon>
      </v-list-item-icon>
      <v-list-item-content>
        <v-list-item-title>Community standing (coming soon)</v-list-item-title>
        <v-list-item-subtitle
          ><v-progress-linear
            class="my-2"
            height="12"
            rounded
            value="0"
            color="light-blue"
          ></v-progress-linear
        ></v-list-item-subtitle>
      </v-list-item-content>
    </v-list-item>
    <v-list-item>
      <v-list-item-icon>
        <v-icon>mdi-forum</v-icon>
      </v-list-item-icon>
      <v-list-item-content>
        <v-list-item-title
          >{{ user.numReferences }} references</v-list-item-title
        >
      </v-list-item-content>
    </v-list-item>
    <v-list-item two-item>
      <v-list-item-icon>
        <v-icon>mdi-translate</v-icon>
      </v-list-item-icon>
      <v-list-item-content>
        <v-list-item-title>{{ languagesListDisplay }}</v-list-item-title>
        <v-list-item-subtitle>Languages</v-list-item-subtitle>
      </v-list-item-content>
    </v-list-item>
    <v-list-item two-item>
      <v-list-item-icon>
        <v-icon>mdi-ship-wheel</v-icon>
      </v-list-item-icon>
      <v-list-item-content>
        <v-list-item-title>{{ user.gender }}, {{ user.age }}</v-list-item-title>
        <v-list-item-subtitle>Age and gender</v-list-item-subtitle>
      </v-list-item-content>
    </v-list-item>
    <v-list-item two-item>
      <v-list-item-icon>
        <v-icon>mdi-briefcase</v-icon>
      </v-list-item-icon>
      <v-list-item-content>
        <v-list-item-title>{{ user.occupation }}</v-list-item-title>
        <v-list-item-subtitle>Occupation</v-list-item-subtitle>
      </v-list-item-content>
    </v-list-item>
    <v-list-item two-item>
      <v-list-item-icon>
        <v-icon>mdi-account-clock</v-icon>
      </v-list-item-icon>
      <v-list-item-content>
        <v-list-item-title
          >Last active {{ lastActiveDisplay }}</v-list-item-title
        >
        <v-list-item-subtitle>Joined {{ joinedDisplay }}</v-list-item-subtitle>
      </v-list-item-content>
    </v-list-item>
    <v-divider></v-divider>
    <v-card-actions>
      <v-btn text link :to="{ name: 'User', params: { user: user.username } }"
        >View profile</v-btn
      >
      <v-btn text>Message</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts">
import Vue, { PropType } from "vue"

import { User } from "../pb/api_pb"

import { displayList, displayTime } from "../utils"

export default Vue.extend({
  props: {
    user: Object as PropType<User.AsObject>,
  },

  computed: {
    lastActiveDisplay() {
      return displayTime(this.user.lastActive!)
    },

    joinedDisplay() {
      return displayTime(this.user.joined!)
    },

    languagesListDisplay() {
      return displayList(this.user.languagesList)
    },
  },
})
</script>
