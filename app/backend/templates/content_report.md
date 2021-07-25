---
subject: "Content Report"
---

Content Report

Reported by: "{{ content_reports.user_id.username|couchers_escape }}" ({{ content_reports.author_user.email|couchers_escape }}, id: {{ content_reports.user.id|couchers_escape }})

Subject: "{{ content_reports.subject|couchers_escape }}"

Description: ""{{ content_reports.content_ref|couchers_escape }}""

