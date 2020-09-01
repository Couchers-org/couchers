<template>
    <div>
      <template v-for="(result, index) in results">
        <v-divider :key="index + 'divider'"></v-divider>
        <v-list-item
          :key="`result-${index}`"
          @click="selectConversation(result.groupChatId)"
          :class="result.groupChatId == selectedConversation ? 'v-list-item--active' : ''"
        >
          <v-list-item-avatar>
            <v-avatar
              :color="avatarFunction(chatCache[result.groupChatId])"
              size="40"
            />
          </v-list-item-avatar>
          <v-list-item-content>
            <v-list-item-title
              v-html="titleFunction(chatCache[result.groupChatId])"
            ></v-list-item-title>
            <v-list-item-subtitle>{{ result.message.text.text }}</v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
      </template>
      <v-list-item v-if="results.length == 0 && !loading">
        <v-list-item-content>
          <v-list-item-title>No results.</v-list-item-title>
        </v-list-item-content>
      </v-list-item>

      <v-list-item v-if="!noMore">
        <v-list-item-content>
          <v-btn
            text
            @click="() => search(true)"
            :loading="loading"
          >
            Load more...
          </v-btn>
        </v-list-item-content>
      </v-list-item>
    </div>
</template>


<script lang="ts">
import Vue, { PropType } from "vue"

import { conversations } from "@/api"
import { SearchMessagesReq, MessageSearchResult, SearchMessagesRes, GroupChat, GetGroupChatReq } from '@/pb/conversations_pb'

export default Vue.extend({
  data: () => ({
    loading: true,
    debounce: 0,
    results: [] as Array<MessageSearchResult.AsObject>,
    chatCache: {} as { [groupChatId: number]: GroupChat.AsObject },
    noMore: false,
  }),

  props: {
    query: {
      required: true,
      type: String,
    },
    selectedConversation: {
      required: false,
      type: Number,
    },
    avatarFunction: {
      required: true,
      type: Function,
    },
    titleFunction: {
      required: true,
      type: Function,
    },
  },

  watch: {
    query() {
      if (this.debounce) clearTimeout(this.debounce)
      this.debounce = setTimeout(this.search, 500)
    },
  },

  methods: {
    selectConversation(conversationId: number) {
      this.$emit('selected', conversationId)
    },

    async search(more = false) {
      this.loading = true
      const req = new SearchMessagesReq()
      let results = [] as Array<MessageSearchResult.AsObject>
      if (more) {
        if (this.results.length > 0) {
          req.setLastMessageId(
            this.results[this.results.length - 1].message!.messageId
          )
        }
      }
      req.setQuery(this.query)
      try {
        const res = await conversations.searchMessages(req)
        this.noMore = res.getNoMore()
        results = res.getResultsList().map((e) => e.toObject())
      } catch (err) {
        this.$emit('error', err)
      }

      await Promise.all(results.map(async (result) => {
        if (result.groupChatId in this.chatCache) return

        const req = new GetGroupChatReq()
        req.setGroupChatId(result.groupChatId)
        const res = await conversations.getGroupChat(req)
        this.chatCache[result.groupChatId] = res.toObject()
      }))

      if (more) {
        this.results = [...this.results, ...results]
      } else {
        this.results = results
      }

      this.loading = false
    }
  },
})
</script>
