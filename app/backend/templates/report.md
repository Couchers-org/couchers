---
subject: "User Report"
---

User Report

Reported by: "{{ complaint.author_user.username|couchers_escape }}" ({{ complaint.author_user.email|couchers_escape }}, id: {{ complaint.author_user.id|couchers_escape }})

Reported User: "{{ complaint.reported_user.username|couchers_escape }}" ({{ complaint.reported_user.email|couchers_escape }}, id: {{ complaint.reported_user.id|couchers_escape }})

Reason: "{{ complaint.reason|couchers_escape }}"

Description:
"{{ complaint.description|couchers_escape }}"
