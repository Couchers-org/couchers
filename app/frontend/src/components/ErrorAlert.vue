<template>
  <v-container>
    <v-alert type="error" v-for="e in errorList" :key="e">
      {{ e }}
    </v-alert>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue"

export default Vue.extend({
  props: {
    error: {
      type: Object as () => Array<Error> | Error | null,
    },
  },

  computed: {
    errorList(): Array<string> {
      if (this.error == null) {
        return []
      } else if ("length" in this.error) {
        return (this.error as Array<Error>)
          .filter((el) => "message" in el)
          .map<string>((el) => el.message)
      } else {
        return [this.error.message]
      }
    },
  },
})
</script>
