<template>
  <v-container fluid>
    <v-card class="float-left mx-3 my-3" width="350" outlined>
      <v-img :aspect-ratio="1" src="profile-itsi.jpg"></v-img>
      <v-card-title>Itsi Weinstock</v-card-title>
      <v-card-subtitle>Sydney, New South Wales, Australia</v-card-subtitle>
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
          <v-list-item-title>Verification: 73 %</v-list-item-title>
          <v-list-item-subtitle><v-progress-linear class="my-2" height="12" rounded value="73" color="light-green"></v-progress-linear></v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>
      <v-list-item two-item>
        <v-list-item-icon>
          <v-icon>mdi-account-group</v-icon>
        </v-list-item-icon>
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
        <p>Hey, my name’s Itsi (like the spider), from Australia. I'm a mathematician, data scientist and violinist (haha what a nerd). I've been a teacher, researcher, comedy writer, violin performer and a great cook for dinners with my friends.</p>
        <p>I like keeping very busy when I travel. If you've got any ideas for things to do, please drag me along! I love meeting energetic and funny people and organising small trips to go on with anyone I can wrangle together. Examples include hiking around wineries in Georgia, sailing along the Nile for a few days and exploring caves in Mexico.</p>
        <p>Sharing food is a must! You can try so many more things that way.</p>
        <h3>Why I’m on Couchsurfing</h3>
        <p>It’s awesome! I love finding the CS communities in the towns I visit, you can make so many friends that way. And you actually get to meet locals and hang out. All the experiences I’ve had staying with hosts have been fantastic.</p>
        <h3>One Amazing Thing I’ve Done</h3>
        <p>A llama once pissed on me when I was a kid</p>
        <h3>Teach, Learn, Share</h3>
        <p>I don’t necessarily eat vegan when I travel but boy can I teach you good vegan cooking</p>
        <h3>What I Can Share with Hosts</h3>
        <p>I have a lot of fun facts</p>
        <h3>Countries I’ve Visited</h3>
        <p>Cuba, Czech Republic, Egypt, England, Georgia, Germany, Greece, Hong Kong, Laos, Mexico, Myanmar, Netherlands, Scotland, Spain, Thailand, Viet Nam</p>
        <h3>Countries I’ve Lived In</h3>
        <p>Australia</p>
      </v-card-text>
    </v-card>
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
