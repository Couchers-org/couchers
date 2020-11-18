---
subject: "User Report"
---

User Report

Reported by: {{ escape(complaint.author_user.username) }}

Reported User: {{ escape(complaint.reported_user.username) }}

Reason: {{ complaint.reason }}

Description:
{{ complaint.description }}
