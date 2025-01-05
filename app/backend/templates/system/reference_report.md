---
subject: "Reference report about ref #{{ reference.id }}"
---

Someone wrote a bad reference.


* Rating
{{ reference.rating }}


* Was appropriate?
{{ reference.was_appropriate }}


* Reference type
{{ reference.reference_type }}


* Reference text
{{ reference.text }}


* User who wrote the reference
Name: {{ reference.from_user.name }}
Email: {{ reference.from_user.email }}
Username: {{ reference.from_user.username }}
User ID: {{ reference.from_user.id }}


* User who the reference is about
Name: {{ reference.to_user.name }}
Email: {{ reference.to_user.email }}
Username: {{ reference.to_user.username }}
User ID: {{ reference.to_user.id }}


* Time
{{ reference.time }}
