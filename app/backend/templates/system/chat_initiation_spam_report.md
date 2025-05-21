---
subject: "Possible host request spam by user {{ user.username }}"
---

User {{ user.username }} has initiated {{ threshold }} chats in the past {{ time_interval_str }}.

{% if user_is_blocked %}**The user has been blocked from initiating further chats for today.**

{% endif %}
**User info:**
- Name: {{ user.name }}
- Email: {{ user.email }}
- Username: {{ user.username }}
- User ID: {{ user.id }}
- Joined: {{ user.joined }}
- City: {{ user.city }}


**Initiated chats:**

| creation date | is_dm |
|---------------|-------|
{% for group_chat, conversation in initiated_chats -%}
| {{ conversation.created }} | {{ group_chat.is_dm }} |
{% endfor %}
