---
subject: "Duplicate Strong Verification attempt"
---

A user tried to do Strong Verification, but that passport is already tied to another user.

* User who tried to reverify with an existing passport
Verification attempt ID: {{ new_attempt_id }}
Name: {{ new_user.name }}
Email: {{ new_user.email }}
Username: {{ new_user.username }}
User ID: {{ new_user.id }}


* User who the passport is already tied to
Verification attempt ID: {{ old_attempt_id }}
Name: {{ old_user.name }}
Email: {{ old_user.email }}
Username: {{ old_user.username }}
User ID: {{ old_user.id }}
