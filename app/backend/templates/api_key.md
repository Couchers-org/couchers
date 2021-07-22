---
subject: "Your API key for Couchers.org"
---

{% from "macros.html" import button, link, support_email %}
Hi {{ user.name|couchers_escape }},

You recently requested an API key for Couchers.org. We've issued you with the following API key:

{% if html %}
<code>{{ token }}</code>
{% else %}
{{ token }}
{% endif %}

The token expires at {% if html %}<code>{{ expiry }}</code>{% else %}`{{ expiry }}`{% endif %}.

Please remember to abide by our Terms of Service, our Community Guidelines, and other policies while using our APIs. All access is logged analyzed, and we may terminate your access if you abuse our service. For any questions, please contact us at {{ support_email(html)|couchers_safe }}.

The Couchers.org team
