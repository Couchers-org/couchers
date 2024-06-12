---
subject: "Account deletion reason #{{ reason.id }}"
---

Someone deleted their account and wrote a reason.


* Reason
{{ reason.reason }}


* Deleted user
Name: {{ reason.user.name }}
Email: {{ reason.user.email }}
Username: {{ reason.user.username }}
User ID: {{ reason.user.id }}


* Time
{{ reason.created }}
