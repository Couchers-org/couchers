# Blocks mjml template

HTML for emails is more complex than modern HTML/CSS for the web because it needs to be compatible with a wide range of legacy email clients. This makes writing the HTML by hand impractical. To solve this problem we use the [MJML](https://mjml.io) format, which compiles down to email-ready HTML. You can edit and visualize MJML online in the [MJML Live editor](https://mjml.io/try-it-live/).

Our email system supports building emails in code out of well-known building blocks like paragraphs and buttons. `blocks.mjml` defines our email template with standard header and footer, and uses begin/end comment pairs to define templates for each such block. The MJML compiler will preserve those comments in the HTML, allowing us to extract the relevant snippets of HTML code. Then when the code wants an email with two paragraphs followed by a button, we can assemble the HTML out of the header, footer, and relevant block templates.

When editing `blocks.mjml`, run `./_build.sh` to regenerate `generated_html/blocks.html`.
