---
subject: "Content Report"
---

Content Report

Reported by: {{ content_report.user.username|couchers_escape }} ({{ content_report.user.email|couchers_escape }}, id: {{ content_report.user.id|couchers_escape }})

Subject: "{{ content_report.subject|couchers_escape }}"

Description: "{{ content_report.description|couchers_escape }}"

Content repoted: "{{ content_report.content_ref|couchers_escape }}"

User owning reported content: {{ content_report.content_owner.username|couchers_escape}} {{ content_report.content_owner.email|couchers_escape}}

