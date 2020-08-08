<template>
  <div>
    <v-avatar v-if="size" :size="size" :color="userColor">
      <span class="white--text">{{ userInitials }}</span>
    </v-avatar>
    <v-avatar v-else :color="userColor">
      <span class="white--text">{{ userInitials }}</span>
    </v-avatar>
    
  </div>
</template>

<script lang="ts">
import Vue from "vue"
import { User, GetUserReq } from "../pb/api_pb"
import { client } from "../api"
export default Vue.extend({
  props: { userId: Number,
            size: {
              default: null,
              type: Number
            } 
           }, // TODO: allow for multiple users to be passed in for a group chat
  data: () => ({
    user: {} as User, // only storing one user at a time
    userInitials: '' as string,
    userColor: '' as string,
    // TODO: add user profile photo options here 
  }),
  methods: {
    getUserData(userId: number) {
      // construct the proto
      const req = new GetUserReq()
      req.setUser(userId.toString())
      client
        .getUser(req)
        .then((res) => (this.user = res))
        .then(()=> {
          this.userColor = this.user.getColor() 
          this.userInitials = this.convertNameToInitials(this.user.getName())
        }
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
