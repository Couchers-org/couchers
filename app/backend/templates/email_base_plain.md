{% if content %}
{{ content|couchers_safe }}
{% else %}
Sorry, an unknown error occurred, please forward this email to <bugs@couchers.org> so we can investigate further.
{% endif %}

---

You're receiving this email because you signed up for Couchers.org. If you have any issues, email us at <support@couchers.org>.

{% if _footer_unsub_link %}
If you wish to stop receiving emails from Couchers, click on this link: <{{ _footer_unsub_link|couchers_safe }}>
{% endif %}
