---
subject: "Possible host request spam by user {{ user.username }}"
---

User {{ user.username }} has sent {{ threshold }} host requests in the past {{ time_interval_str }}.

{% if user_is_blocked %}**The user has been blocked from sending further host requests for today.**{% endif %}

**User info:**
- Name: {{ user.name }}
- Email: {{ user.email }}
- Username: {{ user.username }}
- User ID: {{ user.id }}
- Joined: {{ user.joined }}
- City: {{ user.city }}


**Host requests:**

| creation date | host ID | host username | host city |
|---------------|---------|---------------|-----------|
{% for host_request, conversation in host_requests -%} 
| {{ conversation.created }} | {{ host_request.host.id }} | {{ host_request.host.username }} | {{ host_request.host.city }} |
{% endfor %}
