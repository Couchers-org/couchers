---
subject: "Content Report #{{ report.id|couchers_escape }}"
---

{% from "macros.html" import button, link, support_email, email_link, newline %}

Content Report #{{ report.id|couchers_escape }}.


* Reason{{ newline(html)|couchers_safe }}
{{ report.reason|couchers_escape }}


* Description{{ newline(html)|couchers_safe }}
{{ report.description|couchers_escape }}


* Content reference{{ newline(html)|couchers_safe }}
{{ report.content_ref|couchers_escape }}


* User who reported content{{ newline(html)|couchers_safe }}
Name: {{ report.reporting_user.name|couchers_escape }}{{ newline(html)|couchers_safe }}
Email: {{ report.reporting_user.email|couchers_escape }}{{ newline(html)|couchers_safe }}
Username: {{ report.reporting_user.username|couchers_escape }}{{ newline(html)|couchers_safe }}
Profile: {{ link(reporting_user_user_link, html)|couchers_safe }}


* User who authored content{{ newline(html)|couchers_safe }}
Name: {{ report.author_user.name|couchers_escape }}{{ newline(html)|couchers_safe }}
Email: {{ report.author_user.email|couchers_escape }}{{ newline(html)|couchers_safe }}
Username: {{ report.author_user.username|couchers_escape }}{{ newline(html)|couchers_safe }}
Profile: {{ link(author_user_user_link, html)|couchers_safe }}


* Other info{{ newline(html)|couchers_safe }}
Page: {{ report.page|couchers_escape }}{{ newline(html)|couchers_safe }}
User-agent: {{ report.user_agent|couchers_escape }}{{ newline(html)|couchers_safe }}
Reported at: {{ report.time|couchers_escape }}{{ newline(html)|couchers_safe }}
