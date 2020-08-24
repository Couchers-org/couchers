<template>
  <div>
    <div v-if="!editing">
      <p>
        {{ displayList }}
        <v-btn icon v-on:click="edit"><v-icon>mdi-pencil</v-icon></v-btn>
      </p>
    </div>
    <div v-if="editing">
      <v-combobox
        v-model="dirtyList"
        ref="combobox"
        chips
        clearable
        multiple
        solo
      >
        <template v-slot:selection="{ attrs, item, select, selected }">
          <v-chip
            v-bind="attrs"
            :input-value="selected"
            close
            @click="select"
            @click:close="remove(item)"
          >
            <strong>{{ item }}</strong
            >&nbsp;
          </v-chip>
        </template>
      </v-combobox>
      <v-btn class="mx-2 my-2" v-on:click="save" color="success">Save</v-btn>
      <v-btn class="mx-2 my-2" v-on:click="cancel" color="warning"
        >Cancel</v-btn
      >
    </div>
  </div>
</template>

<script lang="ts">
import Vue, { PropType } from "vue"

export default Vue.extend({
  props: {
    list: Array as PropType<Array<string>>,
  },

  data: () => ({
    editing: false,
    dirtyList: [] as Array<string>,
  }),

  computed: {
    displayList(): string {
      return this.list.join(", ")
    },
  },

  methods: {
    edit() {
      this.editing = true
      this.dirtyList = this.list
    },

    remove(item: string) {
      this.dirtyList.splice(this.dirtyList.indexOf(item), 1)
      this.dirtyList = [...this.dirtyList]
    },

    save() {
      const combobox = this.$refs.combobox as HTMLElement
      combobox.blur()
      //next tick waits for current text to be added to list after blur
      this.$nextTick(() => {
        this.$emit("save", this.dirtyList)
        this.editing = false
      })
    },

    cancel() {
      // stop editing and set back to original
      this.editing = false
      this.dirtyList = this.list
    },
  },
})
</script>
