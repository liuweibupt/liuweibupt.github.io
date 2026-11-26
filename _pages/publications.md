---
layout: archive
title: "Publications"
permalink: /publications/
author_profile: true
---

{% include base_path %}

{% if site.author.googlescholar %}
  {% assign scholar = site.data.scholar %}
  <p class="lw-subtitle">
    <a href="{{ site.author.googlescholar | escape }}">Google Scholar</a> · {{ scholar.citations }} citations · h-index {{ scholar.h_index }} · i10-index {{ scholar.i10_index }}
    <br>Snapshot dated {{ scholar.snapshot_date }}.
  </p>
{% endif %}

{% for post in site.publications reversed %}
  {% unless post.type == 'tutorial' %}{% include archive-single.html %}{% endunless %}
{% endfor %}

<h2 class="lw-section-title">Tutorials</h2>

{% for post in site.publications reversed %}
  {% if post.type == 'tutorial' %}{% include archive-single.html %}{% endif %}
{% endfor %}
