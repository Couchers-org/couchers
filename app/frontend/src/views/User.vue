<template>
  <v-content>
    <v-container fluid>
      <v-card class="float-left mx-3 my-3" width="350" outlined>
        <v-img :aspect-ratio="1" src="/profile-itsi.jpg"></v-img>
        <v-card-title>{{ user.name }}</v-card-title>
        <v-card-subtitle>{{ user.city }}</v-card-subtitle>
        <v-card-subtitle>Last Active: {{ lastActiveDisplay }}</v-card-subtitle>
        <v-card-text>
          <v-alert type="warning">
            Watch out. This user might be a creep.
          </v-alert>
        </v-card-text>
        <v-list-item two-item>
          <v-list-item-icon>
            <v-icon>mdi-account-check</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Verification: {{ verificationDisplay }} %</v-list-item-title>
            <v-list-item-subtitle><v-progress-linear class="my-2" height="12" rounded :value="verificationDisplay" color="light-green"></v-progress-linear></v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
        <v-list-item two-item>
          <v-list-item-icon>
            <v-icon>mdi-account-group</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Community standing: {{ communityStandingDisplay }} %</v-list-item-title>
            <v-list-item-subtitle><v-progress-linear class="my-2" height="12" rounded :value="communityStandingDisplay" color="light-blue"></v-progress-linear></v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
        <v-list-item two-item>
          <v-list-item-icon>
            <v-icon>mdi-forum</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>{{ user.numReferences }} references</v-list-item-title>
            <v-list-item-subtitle>What do I write here?</v-list-item-subtitle>
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
            <v-list-item-title>Joined in {{ joinedDisplay }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-divider></v-divider>
        <v-card-actions>
          <v-btn text>Message</v-btn>
          <v-btn text>Request to stay</v-btn>
        </v-card-actions>
      </v-card>
      <v-card class="float-left mx-3 my-3" width="950" outlined>
        <v-card-text>
          <v-tabs class="mb-5">
            <v-tab>About me</v-tab>
            <v-tab>My couch</v-tab>
            <v-tab>References</v-tab>
            <v-tab>Friends</v-tab>
            <v-tab>Photos</v-tab>
          </v-tabs>
          <h3>About me</h3>
          <p>{{ user.aboutMe }}</p>
          <h3>Why I’m on Couchsurfing</h3>
          <p>{{ user.why }}</p>
          <h3>One Amazing Thing I’ve Done</h3>
          <p>{{ user.thing }}</p>
          <h3>What I can share with hosts</h3>
          <p>{{ user.share }}</p>
          <h3>Countries I’ve Visited</h3>
          <p>{{ countriesVisitedListDisplay }}</p>
          <h3>Countries I’ve Lived In</h3>
          <p>{{ countriesLivedListDisplay }}</p>
        </v-card-text>
      </v-card>
    </v-container>
  </v-content>
</template>

<script lang="ts">
import Vue from 'vue'

import { GetUserReq } from '../pb/api_pb'

import client from '../api'

function displayList(list: string[]) {
  return list.join(', ')
}

export default Vue.extend({
  data: () => ({
    loading: false,
    errorMessages: [] as Array<string>,
    user:{
      name: null,
      city: null,
      verification: null,
      communityStanding: null,
      numReferences: null,
      gender: null,
      age: null,
      birthDate: null,
      languagesList: [],
      occupation: null,
      aboutMe: null,
      why: null,
      thing: null,
      share: null,
      countriesVisitedList: [],
      countriesLivedList: [],
      lastActive: null,
      joined: null
    }
  }),

  name: 'User',

  created () {
    this.fetchData()
  },

  watch: {
    '$route': 'fetchData'
  },

  methods: {
    fetchData: function () {
      this.loading = true
      this.errorMessages = []

      const req = new GetUserReq()
      req.setUser(this.$route.params.user)
      client.getUser(req, null).then(res => {
        this.loading = false
        this.errorMessages = []

        this.user = res.toObject()
        this.user.lastActive = res.getLastActive()
        this.user.joined = res.getJoined()
      }).catch(err => {
        this.loading = false
        this.errorMessages = err.message
      })
    }
  },

  computed: {
    lastActiveDisplay: function() {
      if (!this.user.lastActive) {
        return ''
      }
      const last = this.user.lastActive.toDate();
      const now = new Date();
      const today = new Date(now.getFullYear(),now.getMonth(),now.getDate()).getTime();
      if (last > today) {
        return 'today'
      }
      const backday = new Date(now.getTime() - 86400000);
      const yesterday = new Date(backday.getFullYear(),backday.getMonth(),backday.getDate()).getTime();
      if (last > yesterday) {
        return 'yesterday'
      }
      const diff = now.getTime() - last;
      if (diff < 604800000) {
        const n = Math.min(Math.max(2,Math.floor(diff/86400000)),6);
        return `${n} days ago`
      }
      if (diff < 2419200000) {
        const n = Math.min(Math.max(1,Math.floor(diff/604800000)),4);
        if (n == 1) {
          return '1 week ago'
        }
        return `${n} weeks ago`
      }
      if (diff < 31536000000) {
        const n = Math.min(Math.max(1,Math.floor(diff/2419200000)),11);
        if (n == 1) {
          return '1 month ago'
        }
        return `${n} months ago`
      }
      const n = Math.max(1,Math.floor(diff/31536000000))
      if (n == 1) {
        return '1 year ago'
      }
      return `${n} years ago`
    },
    joinedDisplay: function () {
      if (!this.user.joined) {
        return ''
      }
      return this.user.joined.toDate()
    },
    verificationDisplay: function() {
      return Math.round(this.user.verification! * 100)
    },
    communityStandingDisplay: function() {
      return Math.round(this.user.communityStanding! * 100)
    },
    ageDisplay: function() {
      return new Date(new Date().getTime() - this.user.birthDate!).getFullYear()-1970;
    },
    languagesListDisplay: function() {
      return displayList(this.user.languagesList)
    },
    countriesVisitedListDisplay: function() {
      return displayList(this.user.countriesVisitedList)
    },
    countriesLivedListDisplay: function() {
      return displayList(this.user.countriesLivedList)
    }
  }
})
</script>
