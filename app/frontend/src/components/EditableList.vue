<template>
  <div>
    <div v-if="!editing">
      <p>{{ displayList }}</p>
      <v-btn class="mx-2 my-2" v-on:click="edit">Edit</v-btn>
    </div>
    <div v-if="editing">
      <v-combobox v-model="dirtyList" chips clearable multiple solo>
        <template v-slot:selection="{ attrs, item, select, selected }">
          <v-chip v-bind="attrs" :input-value="selected" close @click="select" @click:close="remove(item)">
            <strong>{{ item }}</strong>&nbsp;
          </v-chip>
        </template>
      </v-combobox>
      <v-btn class="mx-2 my-2" v-on:click="save" color="success">Save</v-btn>
      <v-btn class="mx-2 my-2" v-on:click="cancel" color="warning">Cancel</v-btn>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.component('editable-textarea', {
  props: ['list'],

  data: () => ({
    editing: false,
    dirtyList: null
  }),

  computed: {
    displayList () {
      return this.list.join(', ')
    }
  },

  methods: {
    edit() {
      this.editing = true
      this.dirtyList = this.list
    },
  
    remove(item) {
      this.dirtyList.splice(this.dirtyList.indexOf(item), 1)
      this.dirtyList = [...this.dirtyList]
    },

    save() {
      this.$emit('save', this.dirtyList)
      this.editing = false
    },

    cancel() {
      // stop editing and set back to original
      this.editing = false
      this.dirtyList = this.list
    }
  }
})
</script>
