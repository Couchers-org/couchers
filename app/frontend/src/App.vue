<template>
  <v-app>
    <v-app-bar app color="primary" dark>
      <div class="d-flex align-center">
        Couchers.org
      </div>
    </v-app-bar>

    <v-navigation-drawer app dark>
      <v-list-item>
        <v-list-item-content>
          <v-list-item-title class="title">
            Profile
          </v-list-item-title>
          <v-list-item-subtitle>
            Aapeli Vuorinen
          </v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>

      <v-divider></v-divider>

      <v-list dense nav>
        <v-list-item link>
          <v-list-item-icon>
            <v-icon>mdi-view-dashboard</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Profile</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item link>
          <v-list-item-icon>
            <v-badge color="success" content="3" overlap>
              <v-icon>mdi-inbox</v-icon>
            </v-badge>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Messages</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item link>
          <v-list-item-icon>
            <v-badge color="warning" content="999+" overlap>
              <v-icon>mdi-alert-circle</v-icon>
            </v-badge>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Spam</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item link>
          <v-list-item-icon>
            <v-icon>mdi-image</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Photos</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item link>
          <v-list-item-icon>
            <v-icon>mdi-help-box</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>About</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-content>
      <Profile/>
    </v-content>
  </v-app>
</template>

<script lang="ts">
import Vue from 'vue';
import Profile from './components/Profile.vue';

export default Vue.extend({
  name: 'App',

  components: {
    Profile,
  },

  data: () => ({
    //
  }),
});
</script>
