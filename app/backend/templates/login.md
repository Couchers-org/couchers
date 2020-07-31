Hi {{ user.name or "there" }}!

Here's a login link for Couchers.org:

{% if html %}

{{ button("Sign in", login_link) }}

Alternatively, click the following link: <{{ login_link }}>.

{% else %}

<{{ login_link }}>

{% endif %}

See you in a bit :).

The Couchers.org team
