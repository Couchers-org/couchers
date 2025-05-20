---
subject: "Possible host request spam by user {{ user.username }}"
---

User {{ user.username }} has sent {{ threshold }} friend requests in the past {{ time_interval_str }}.

{% if user_is_blocked %}**The user has been blocked from sending further friend requests for today.**{% endif %}

**User info:**
- Name: {{ user.name }}
- Email: {{ user.email }}
- Username: {{ user.username }}
- User ID: {{ user.id }}
- Joined: {{ user.joined }}
- City: {{ user.city }}


**Friend requests:**

| time sent | to_user (ID) | to_user (username) | status |
|-----------|--------------|---------------|--------|
{% for friend_request in friend_requests -%} 
| {{ friend_request.time_sent }} | {{ friend_request.to_user_id }} | {{ friend_request.to_user.username }} | {{ friend_request.status }} |
{% endfor %}
