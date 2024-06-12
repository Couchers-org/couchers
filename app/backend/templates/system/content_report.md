---
subject: "Content Report #{{ report.id }}: {{ report.reason }}"
---

Content Report #{{ report.id }}.


* Reason
{{ report.reason }}


* Description
{{ report.description }}


* Content reference
{{ report.content_ref }}


* User who reported content
Name: {{ report.reporting_user.name }}
Email: {{ report.reporting_user.email }}
Username: {{ report.reporting_user.username }}
User ID: {{ report.reporting_user.id }}
Profile: <{{ reporting_user_user_link }}


* User who authored content
Name: {{ report.author_user.name }}
Email: {{ report.author_user.email }}
Username: {{ report.author_user.username }}
User ID: {{ report.author_user.id }}
Profile: <{{ author_user_user_link }}


* Other info
Page: {{ report.page }}
User-agent: {{ report.user_agent }}
Reported at: {{ report.time }}
