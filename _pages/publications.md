---
layout: archive
title: "Publications"
permalink: /publications/
author_profile: true
---

<ul class="lw-entry-list" role="list">
  {% for post in site.publications reversed %}
    {% unless post.type == 'tutorial' %}{% include archive-single.html %}{% endunless %}
  {% endfor %}
</ul>

<h2>Tutorials</h2>

<ul class="lw-entry-list" role="list">
  {% for post in site.publications reversed %}
    {% if post.type == 'tutorial' %}{% include archive-single.html heading="h3" %}{% endif %}
  {% endfor %}
</ul>
