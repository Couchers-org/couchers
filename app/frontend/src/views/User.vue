<template>
  <v-content>
    <Profile :username="$route.params.username" />
  </v-content>
</template>

<script>
import Profile from '../components/Profile.vue'

export default {
  name: 'User',
  components: {
    Profile
  }
}
</script>
