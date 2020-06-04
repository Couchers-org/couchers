<template>
  <v-container fluid>
    <v-card class="float-left mx-3 my-3" width="350" outlined>
      <v-img :aspect-ratio="1" src="profile-itsi.jpg"></v-img>
      <v-card-title>{{user.name}}</v-card-title>
      <v-card-subtitle>{{user.city}}</v-card-subtitle>
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
          <v-list-item-title>Verification: {{user.verification}} %</v-list-item-title>
          <v-list-item-subtitle><v-progress-linear class="my-2" height="12" rounded :value="user.verification" color="light-green"></v-progress-linear></v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>
      <v-list-item two-item>
        <v-list-item-icon>
          <v-icon>mdi-account-group</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>Community standing: {{user.comstand}} %</v-list-item-title>
          <v-list-item-subtitle><v-progress-linear class="my-2" height="12" rounded :value="user.comstand" color="light-blue"></v-progress-linear></v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>
      <v-list-item two-item>
        <v-list-item-icon>
          <v-icon>mdi-forum</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>{{user.num_references}} references</v-list-item-title>
          <v-list-item-subtitle>What do I write here?</v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>
      <v-list-item two-item>
        <v-list-item-icon>
          <v-icon>mdi-translate</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>{{languages_display}}</v-list-item-title>
          <v-list-item-subtitle>Languages</v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>
      <v-list-item two-item>
        <v-list-item-icon>
          <v-icon>mdi-ship-wheel</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>{{user.gender}}, {{user.age}}</v-list-item-title>
          <v-list-item-subtitle>Age and gender</v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>
      <v-list-item two-item>
        <v-list-item-icon>
          <v-icon>mdi-briefcase</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>{{user.occupation}}</v-list-item-title>
          <v-list-item-subtitle>Occupation</v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>
      <v-divider></v-divider>
      <v-card-actions>
        <v-btn text>Message</v-btn>
        <v-btn text>Ask to surf</v-btn>
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
        <p>{{user.about_me}}</p>
        <h3>Why I’m on Couchsurfing</h3>
        <p>{{user.why}}</p>
        <h3>One Amazing Thing I’ve Done</h3>
        <p>A llama once pissed on me when I was a kid</p>
        <h3>What I can share with hosts</h3>
        <p>{{user.share}}</p>
        <h3>Countries I’ve Visited</h3>
        <p>{{countries_visited_display}}</p>
        <h3>Countries I’ve Lived In</h3>
        <p>{{countries_lived_display}}</p>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script lang="ts">
  import Vue from 'vue'

  function display_list(list: string[]) {
    return list.join(', ')
  }

  export default Vue.extend({
    name: 'Profile',

    data: () => ({
      user:{
        name: 'Itsi Weinstock',
        city: 'Sydney, New South Wales, Australia',
        verification: 73,
        comstand: 41,
        num_references: 16,
        gender: 'Male',
        age: 24,
        languages: ['English','Japanese'],
        occupation: 'Mathematician',
        about_me: "Hey, my name’s Itsi (like the spider), from Australia. I'm a mathematician, data scientist and violinist (haha what a nerd). I've been a teacher, researcher, comedy writer, violin performer and a great cook for dinners with my friends.\n\nI like keeping very busy when I travel. If you've got any ideas for things to do, please drag me along! I love meeting energetic and funny people and organising small trips to go on with anyone I can wrangle together. Examples include hiking around wineries in Georgia, sailing along the Nile for a few days and exploring caves in Mexico.\n\nSharing food is a must! You can try so many more things that way.",
        why: "It’s awesome! I love finding the CS communities in the towns I visit, you can make so many friends that way. And you actually get to meet locals and hang out. All the experiences I’ve had staying with hosts have been fantastic.",
        share: "I have a lot of fun facts",
        countries_visited: ['Cuba','Czech Republic','Egypt','England','Georgia','Germany','Greece','Hong Kong','Laos','Mexico','Myanmar','Netherlands','Scotland','Spain','Thailand','Viet Nam'],
        countries_lived: ['Australia','North Korea']
      }
    }),
    computed: {
      languages_display: function() {
        return display_list(this.user.languages)
      },
      countries_visited_display: function() {
        return display_list(this.user.countries_visited)
      },
      countries_lived_display: function() {
        return display_list(this.user.countries_lived)
      }
    }
  })
</script>
