---
subject: "{{ action.value }} limit rate violation by user {{ user.username }}"
---

User {{ user.username }} has sent {{ threshold }} {{ action.value }}s in the past {{ hours }} hours.

{% if is_hard_limit %}**The user has been blocked from sending further {{ action.value }}s for now.**

{% endif %}
**User info:**
Name: {{ user.name }}
Email: {{ user.email }}
Username: {{ user.username }}
User ID: {{ user.id }}
Joined: {{ user.joined }}
City: {{ user.city }}
Gender: {{ user.gender }}

{% for action, entries in events.items() -%}
**{{ action.value }}s (past {{ hours }} hours):**

{% if entries %}
|{% for key in entries[0].keys() %} {{ key }} |{% endfor %}

|{% for _ in entries[0].keys() %} --- |{% endfor %}

{% for entry in entries %}
|{% for value in entry.values() %} {{ value | join(', ') if value is iterable and value is not string else value }} |{% endfor %}

{% endfor %}

{% else %}
No {{ action.value }}s found in the past {{ hours }} hours.

{% endif %}
{%- endfor %}
