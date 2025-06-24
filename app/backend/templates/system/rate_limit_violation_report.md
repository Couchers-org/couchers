---
subject: "{{ action.value }} limit rate violation by user {{ user.username }}"
---

User {{ user.username }} has sent {{ threshold }} {{ action.value }}s in the past {{ time_interval_str }}.

{% if is_hard_limit %}**The user has been blocked from sending further {{ action.value }}s for now.**

{% endif %}
**User info:**
- Name: {{ user.name }}
- Email: {{ user.email }}
- Username: {{ user.username }}
- User ID: {{ user.id }}
- Joined: {{ user.joined }}
- City: {{ user.city }}

**host requests (past {{ time_interval_str }}):**

| created | host id | host username | host city |
|---|---|---|---|
{% for entry in events["host_requests"] %}
|{% for value in entry.values() %} {{value}} |{% endfor %}

{% endfor %}

**friend requests (past {{ time_interval_str }}):**

| time sent | to user (ID) | to user (username) | status |
|---|---|---|---|
{% for entry in events["friend_requests"] %}
|{% for value in entry.values() %} {{value}} |{% endfor %}

{% endfor %}

**chat initiations (past {{ time_interval_str }}):**

| id | created | title | is_dm | participants |
|---|---|---|---|---|
{% for entry in events["chat_initiations"] %}
|{% for value in entry.values() %} {{value}} |{% endfor %}

{% endfor %}
