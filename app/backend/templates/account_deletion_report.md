---
subject: "Account deletion reason #{{ reason.id|couchers_escape }}"
---

{% from "macros.html" import button, link, support_email, email_link, newline %}

Someone deleted their account and wrote a reason.


* Reason{{ newline(html)|couchers_safe }}
{{ reason.reason|couchers_escape }}


* Deleted user{{ newline(html)|couchers_safe }}
Name: {{ reason.user.name|couchers_escape }}{{ newline(html)|couchers_safe }}
Email: {{ reason.user.email|couchers_escape }}{{ newline(html)|couchers_safe }}
Username: {{ reason.user.username|couchers_escape }}{{ newline(html)|couchers_safe }}
User ID: {{ reason.user.id|couchers_escape }}{{ newline(html)|couchers_safe }}


* Time{{ newline(html)|couchers_safe }}
{{ reason.created|couchers_escape }}
