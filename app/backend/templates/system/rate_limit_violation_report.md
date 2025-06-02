---
subject: "{{ action.value }} limit rate violation by user {{ user.username }}"
---

User {{ user.username }} has sent {{ threshold }} {{ action.value }}s in the past {{ time_interval_str }}.

{% if hard_limit %}**The user has been blocked from sending further {{ action.value }}s for now.**

{% endif %}
**User info:**
- Name: {{ user.name }}
- Email: {{ user.email }}
- Username: {{ user.username }}
- User ID: {{ user.id }}
- Joined: {{ user.joined }}
- City: {{ user.city }}
