{% from "macros.html" import button %}

<p> Hi {{ name_recipient }}! </p>

You've received a message!

Check it out here:

{% if html %}

{{ button("Messages", messages_link) }}

Alternatively, click the following link: <{{ messages_link }}>.

{% else %}
<{{ messages_link }}>
{% endif %}

Someone's waiting for you, go reply!

The Couchers.org team
