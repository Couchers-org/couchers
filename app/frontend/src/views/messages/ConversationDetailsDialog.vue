<template>
  <v-dialog v-model="open" max-width="600">
    <v-dialog v-model="confirmingRemove" max-width="600">
      <v-card v-if="confirmingRemoveUser">
        <v-card-title>Remove from conversation</v-card-title>
        <v-card-text>Are you sure you want to remove {{ userCache[confirmingRemoveUser].name }} from the conversation?</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="confirmingRemoveUser = null">Nevermind</v-btn>
          <v-btn color="red darken-1" text @click="remove(confirmingRemoveUser)">Remove them</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="confirmingLeave" max-width="600">
      <v-card>
        <v-card-title>Leave conversation</v-card-title>
        <v-card-text>Are you sure you want to leave this conversation?</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="confirmingLeave = false">Nevermind</v-btn>
          <v-btn color="red darken-1" text @click="leaveConversation">Leave conversation</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-card v-if="conversation">
      <error-alert :error="error" />
      <v-card-title class="headline">Conversation details</v-card-title>
      <v-card-text
        v-if="conversation.title !== '' || (!conversation.isDm && isAdmin())"
        class="text-h5"
      >
        <editable-text-field
          v-if="isAdmin()"
          :text="titleOrBlank"
          v-on:save="saveTitle"
          :clearOnEdit="conversation.title === ''"
        />
        <span v-else>{{ conversation.title }}</span>
      </v-card-text>
      <v-card-text>
        Conversation members:
        <v-list>
          <v-list-item
            v-for="memberId in conversation.memberUserIdsList"
            :key="`member-${memberId}`"
            :two-line="isAdmin(memberId) && !conversation.isDm"
          >
            <v-list-item-content>
              <v-list-item-title>{{ userCache[memberId].name }}</v-list-item-title>
              <v-list-item-subtitle v-if="isAdmin(memberId) && !conversation.isDm">Admin</v-list-item-subtitle>
            </v-list-item-content>
            <v-list-item-action v-if="isAdmin() && !conversation.isDm">
              <v-menu offset-y v-model="memberMenu[memberId]">
                <template v-slot:activator="{ on }">
                  <v-btn icon v-on="on">
                    <v-icon>mdi-dots-horizontal</v-icon>
                  </v-btn>
                </template>
                <v-list>
                  <v-list-item v-if="isAdmin(memberId)" @click="demote(memberId)">
                    <v-list-item-title>Demote from admin</v-list-item-title>
                  </v-list-item>
                  <v-list-item v-else @click="promote(memberId)">
                    <v-list-item-title>Make admin</v-list-item-title>
                  </v-list-item>
                  <v-list-item
                    v-if="memberId != userId"
                    :key="`remove-${memberId}`"
                    @click="checkRemove(memberId)"
                  >
                    <v-list-item-title>Remove from conversation</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </v-list-item-action>
          </v-list-item>
        </v-list>
        <v-btn
          text
          v-if="!conversation.isDm && (!conversation.onlyAdminsInvite || isAdmin())"
          @click="invite"
        >Invite someone</v-btn>
        <v-switch
          v-if="isAdmin() && !conversation.isDm"
          v-model="onlyAdminsInviteSwitch"
          label="Only admins can invite people"
          :loading="onlyAdminsSwitchLoading"
        />
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          v-if="!conversation.isDm"
          color="red darken-1"
          text
          @click="checkLeaveConversation"
        >Leave this conversation</v-btn>
        <v-btn color="green darken-1" text @click="open = false">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>


<script lang="ts">
import Vue, { PropType } from "vue"

import ErrorAlert from "../../components/ErrorAlert.vue"
import EditableTextField from "../../components/EditableTextField.vue"
import { PropValidator } from "vue/types/options"
import { GroupChat } from "@/pb/conversations_pb"

export default Vue.extend({
  data: () => ({
    error: null as null | Error,
    onlyAdminsSwitchLoading: false,
    memberMenu: {} as { [userId: number]: boolean },
    confirmingLeave: false,
    confirmingRemoveUser: null as null | number,
  }),

  props: {
    value: {
      required: true,
      type: Boolean,
    },
    conversation: {
      required: false,
      type: Object as PropType<GroupChat.AsObject>,
    },
    userId: {
      required: true,
      type: Number,
    },
    userCache: {
      required: true,
      type: Object,
    },
  },

  components: {
    ErrorAlert,
    EditableTextField,
  },

  watch: {
    conversation() {
      this.memberMenu = {}
      this.conversation.memberUserIdsList.forEach(
        (id) => (this.memberMenu[id] = false)
      )
    },
  },

  computed: {
    open: {
      get() {
        return this.value
      },
      set(value) {
        this.$emit("input", value)
      },
    },

    confirmingRemove: {
      get() {
        return this.confirmingRemoveUser !== null
      },
      set(value) {
        if (value) {
          throw Error("Somthing tried to directly set confirmation dialog.")
        }
        this.confirmingRemoveUser = null
      },
    },

    onlyAdminsInviteSwitch: {
      get() {
        if (!this.onlyAdminsSwitchLoading) {
          return this.conversation.onlyAdminsInvite
        } else {
          return !this.conversation.onlyAdminsInvite
        }
      },
      set(value) {
        this.onlyAdminsSwitchLoading = true
        setTimeout(() => (this.onlyAdminsSwitchLoading = false), 1000)
      },
    },

    titleOrBlank() {
      return this.conversation.title || "(No title set)"
    },
  },

  methods: {
    saveTitle() {
      console.log("s")
    },

    checkLeaveConversation() {
      this.confirmingLeave = true
    },

    leaveConversation() {
      this.confirmingLeave = false
      this.open = false
      console.log("l")
    },

    invite() {
      console.log("i")
    },

    promote(userId: number) {
      console.log(`p${userId}`)
    },

    demote(userId: number) {
      console.log(`d${userId}`)
    },

    checkRemove(userId: number) {
      this.confirmingRemoveUser = userId
    },

    remove(userId: number) {
      this.confirmingRemoveUser = null
      console.log(`r${userId}`)
    },

    isAdmin(id: number | null) {
      const searchId = id == null ? this.userId : id
      return (
        this.conversation.adminUserIdsList.findIndex((id) => id == searchId) >
        -1
      )
    },
  },
})
</script>
