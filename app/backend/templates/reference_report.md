---
subject: "Reference report about ref #{{ reference.id|couchers_escape }}"
---

{% from "macros.html" import button, link, support_email, email_link, newline %}

Someone wrote a bad reference.


* Rating{{ newline(html)|couchers_safe }}
{{ reference.rating|couchers_escape }}


* Was appropriate?{{ newline(html)|couchers_safe }}
{{ reference.was_appropriate|couchers_escape }}


* Reference type{{ newline(html)|couchers_safe }}
{{ reference.reference_type|couchers_escape }}


* Reference text{{ newline(html)|couchers_safe }}
{{ reference.text|couchers_escape }}


* User who wrote the reference{{ newline(html)|couchers_safe }}
Name: {{ reference.from_user.name|couchers_escape }}{{ newline(html)|couchers_safe }}
Email: {{ reference.from_user.email|couchers_escape }}{{ newline(html)|couchers_safe }}
Username: {{ reference.from_user.username|couchers_escape }}{{ newline(html)|couchers_safe }}
Profile: {{ link(from_user_user_link, html)|couchers_safe }}


* User who the reference is about{{ newline(html)|couchers_safe }}
Name: {{ reference.to_user.name|couchers_escape }}{{ newline(html)|couchers_safe }}
Email: {{ reference.to_user.email|couchers_escape }}{{ newline(html)|couchers_safe }}
Username: {{ reference.to_user.username|couchers_escape }}{{ newline(html)|couchers_safe }}
Profile: {{ link(to_user_user_link, html)|couchers_safe }}


* Time{{ newline(html)|couchers_safe }}
{{ reference.time|couchers_escape }}
