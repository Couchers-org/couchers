<template>
  <v-dialog v-model="open" max-width="600">

    <v-dialog v-model="confirmingLeave" max-width="600">
      <v-card>
        <v-card-title>Leave conversation</v-card-title>
        <v-card-text>Are you sure you want to leave this conversation?</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="confirmingLeave = false">Nevermind</v-btn>
          <v-btn color="red darken-1" text @click="leaveConversation" :loading="leaveLoading">Leave conversation</v-btn>
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
          :save="saveTitle"
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
                  <v-btn
                    icon
                    v-on="on"
                    :loading="memberLoading[memberId]"
                  >
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
                </v-list>
              </v-menu>
            </v-list-item-action>
          </v-list-item>
        </v-list>
        <v-autocomplete
          v-if="!conversation.isDm && (isAdmin() || !conversation.onlyAdminsInvite)"
          v-model="invitee"
          :items="friendsNotInConversation"
          :disabled="inviteLoading"
          :loading="inviteLoading"
          label="Invite to conversation"
          placeholder="Invite a friend"
          prepend-icon="mdi-plus"
          @input="invite"
          no-data-text="No one to invite"
        >
          <template v-slot:selection="data">
            {{ data.item.name }} ({{ data.item.handle }})
          </template>
          <template v-slot:item="data">
            <template v-if="typeof data.item !== 'object'">
              <v-list-item-content v-text="data.item"></v-list-item-content>
            </template>
            <template v-else>
              <v-list-item-avatar>
                <v-avatar :color="data.item.avatarColor" size="36">
                  <span class="white--text">
                    {{
                    data.item.avatarText
                    }}
                  </span>
                </v-avatar>
              </v-list-item-avatar>
              <v-list-item-content>
                <v-list-item-title v-html="data.item.name"></v-list-item-title>
                <v-list-item-subtitle v-html="data.item.handle"></v-list-item-subtitle>
              </v-list-item-content>
            </template>
          </template>
        </v-autocomplete>
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
import { GroupChat, InviteToGroupChatReq, GetGroupChatReq, EditGroupChatReq, LeaveGroupChatReq, MakeGroupChatAdminReq, RemoveGroupChatAdminReq } from "@/pb/conversations_pb"
import { conversations } from '@/api'
import { StringValue, BoolValue } from 'google-protobuf/google/protobuf/wrappers_pb'

export default Vue.extend({
  data: () => ({
    error: null as null | Error,
    onlyAdminsSwitchLoading: false,
    dirtyOnlyAdminsSwitch: null as null | boolean,
    inviteLoading: false,
    leaveLoading: false,
    invitee: null as number | null,
    memberMenu: {} as { [userId: number]: boolean },
    memberLoading: {} as { [userId: number]: boolean },
    confirmingLeave: false,
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
    friends: {
      required: true,
      type: Array,
    }
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
      
      this.memberLoading = {}
      this.conversation.memberUserIdsList.forEach(
        (id) => (this.memberLoading[id] = false)
      )
    },

    open() {
      this.error = null
    }
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

    onlyAdminsInviteSwitch: {
      get() {
        if (this.dirtyOnlyAdminsSwitch === null) {
          return this.conversation.onlyAdminsInvite
        } else {
          return this.dirtyOnlyAdminsSwitch
        }
      },
      async set(value: boolean) {
        this.error = null
        this.onlyAdminsSwitchLoading = true
        this.dirtyOnlyAdminsSwitch = value
        const req = new EditGroupChatReq()
        req.setGroupChatId(this.conversation.groupChatId)
        const wrapper = new BoolValue()
        wrapper.setValue(value)
        req.setOnlyAdminsInvite(wrapper)
        try {
          await conversations.editGroupChat(req)
          await this.updateConversationInfo()
        } catch (err) {
          this.error = err
        }
        this.onlyAdminsSwitchLoading = false
        //workaround for weird back-and-forth if set immediately
        setTimeout(() => this.dirtyOnlyAdminsSwitch = null, 50)
      },
    },

    titleOrBlank() {
      return this.conversation.title || "(No title set)"
    },

    friendsNotInConversation() {
      return this.friends.filter(
        (e: any) => this.conversation.memberUserIdsList.findIndex(
          (memberId) => e.value == memberId
        ) < 0
      )
    }
  },

  methods: {
    async saveTitle(value: string | null) {
      this.error = null
      const req = new EditGroupChatReq()
      req.setGroupChatId(this.conversation.groupChatId)
      const wrapper = new StringValue()
      if (value !== null) {
        wrapper.setValue(value)
      }
      req.setTitle(wrapper)
      try {
        await conversations.editGroupChat(req)
        await this.updateConversationInfo()
      } catch (err) {
        this.error = err
      }
    },

    checkLeaveConversation() {
      this.confirmingLeave = true
    },

    async leaveConversation() {
      ///TODO: The leave button is still there if you have left
      ///Need has_left in the api
      this.error = null
      this.leaveLoading = true
      const req = new LeaveGroupChatReq()
      req.setGroupChatId(this.conversation.groupChatId)
      try {
        await conversations.leaveGroupChat(req)
        await this.updateConversationInfo()
        this.open = false
      } catch (err) {
        this.error = err
      }
      this.confirmingLeave = false
      this.leaveLoading = false
    },

    async invite(userId: number) {
      this.error = null
      this.inviteLoading = true
      const req = new InviteToGroupChatReq()
      req.setGroupChatId(this.conversation.groupChatId)
      req.setUserId(userId)
      try {
        await conversations.inviteToGroupChat(req)
        await this.updateConversationInfo()
      } catch (err) {
        this.error = err
      }
      this.inviteLoading = false
      this.invitee = null
    },

    async promote(userId: number) {
      this.error = null
      this.memberLoading[userId] = true
      const req = new MakeGroupChatAdminReq()
      req.setGroupChatId(this.conversation.groupChatId)
      req.setUserId(userId)
      try {
        await conversations.makeGroupChatAdmin(req)
        await this.updateConversationInfo()
      } catch (err) {
        this.error = err
      }
      this.memberLoading[userId] = false
    },

    async demote(userId: number) {
      this.error = null
      this.memberLoading[userId] = true
      const req = new RemoveGroupChatAdminReq()
      req.setGroupChatId(this.conversation.groupChatId)
      req.setUserId(userId)
      try {
        await conversations.removeGroupChatAdmin(req)
        await this.updateConversationInfo()
      } catch (err) {
        this.error = err
      }
      this.memberLoading[userId] = false
    },

    async updateConversationInfo() {
      const req = new GetGroupChatReq()
      req.setGroupChatId(this.conversation.groupChatId)
      const res = await conversations.getGroupChat(req)
      this.$emit("updated-conversation", res.toObject())
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
