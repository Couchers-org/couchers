<template>
  <v-container>
    <v-card :loading="loading" class="mx-auto my-12" max-width="374">
      <v-img :aspect-ratio="1" src="profile-itsi.jpg"></v-img>
      <v-card-title>Itsi Weinstock</v-card-title>
      <v-card-subtitle>Sydney, New South Wales, Australia</v-card-subtitle>
      <v-card-text>
        <v-alert type="warning">
          Watch out. This user might be a creep.
        </v-alert>
      </v-card-text>
      <v-list-item two-item>
        <v-list-item-content>
          <v-list-item-title>Verification: 73 %</v-list-item-title>
          <v-list-item-subtitle><v-progress-linear class="my-2" height="12" rounded value="73" color="light-green"></v-progress-linear></v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>
      <v-list-item two-item>
        <v-list-item-content>
          <v-list-item-title>Community standing: 41 %</v-list-item-title>
          <v-list-item-subtitle><v-progress-linear class="my-2" height="12" rounded value="41" color="light-blue"></v-progress-linear></v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>
      <v-list-item two-item>
        <v-list-item-icon>
          <v-icon>mdi-forum</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>24 references</v-list-item-title>
          <v-list-item-subtitle>What do I write here?</v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>
      <v-list-item two-item>
        <v-list-item-icon>
          <v-icon>mdi-translate</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>English</v-list-item-title>
          <v-list-item-subtitle>Languages</v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>
      <v-list-item two-item>
        <v-list-item-icon>
          <v-icon>mdi-ship-wheel</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>Male, 24</v-list-item-title>
          <v-list-item-subtitle>Age and gender</v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>
      <v-list-item two-item>
        <v-list-item-icon>
          <v-icon>mdi-school</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>University</v-list-item-title>
          <v-list-item-subtitle>Education</v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>
      <v-list-item two-item>
        <v-list-item-icon>
          <v-icon>mdi-briefcase</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>Mathematician</v-list-item-title>
          <v-list-item-subtitle>Occupation</v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>
      <v-divider></v-divider>
      <v-card-actions>
        <v-btn text>Message</v-btn>
        <v-btn text>Ask to surf</v-btn>
      </v-card-actions>
    </v-card>
    <v-row class="text-center">
      <v-col class="mb-4">
        <h1 class="display-2 font-weight-bold mb-3">
          Welcome to Couchers.org
        </h1>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
  import Vue from 'vue'

  export default Vue.extend({
    name: 'Profile',

    data: () => ({
      //
    }),
  })
</script>
