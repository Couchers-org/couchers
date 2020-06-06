<template>
  <v-content>
    <Profile :id="$route.params.id" />
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
