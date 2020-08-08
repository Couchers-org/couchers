<template>
  <div>
    <v-avatar :color="userColor">
      <span class="white--text">{{ userInitials }}</span>
    </v-avatar>
  </div>
</template>

<script lang="ts">
// A component to render a users avatar given a user id.
// defaults to the user.color and initials if the user has no display photo.

import Vue from "vue"
// needed to fetch user info and deserialize the proto in the response
import { User, GetUserReq } from "../pb/api_pb"
import { client } from "../api"
export default Vue.extend({
  props: { userId: Number },
  data: () => ({
    user: {} as User, // only storing one user at a time
    userInitials: null as string,
    userColor: null as string,
  }),
  methods: {
    getUserData(userId: number) {
      // construct the proto
      const req = new GetUserReq()
      req.setUser(userId.toString())
      client
        .getUser(req)
        .then((res) => (this.user = res))
        .then(()=> 
          this.userColor = this.user.getColor() 
          )
        .then(() => 
          this.userInitials = this.convertNameToInitials(this.user.getName())
        )
        .catch((err) => console.log(err))
    },
    convertNameToInitials(name: string) {
      return name
        .split(" ")
        .map((name) => name[0])
        .join("")
    },
  },
  created() {
    this.getUserData(this.userId)
  },
})
</script>

<style></style>
