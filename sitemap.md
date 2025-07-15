---
title: "Sitemap"
layout: page
description: "A list of all pages and posts on the site."
permalink: /sitemap/
---

# Sitemap

## Pages
<ul>
  <li><a href="/">Home</a></li>
  <li><a href="/archive">Archive</a></li>
  <li><a href="/about">About</a></li>
  <li><a href="/notes2me">Notes2Me</a></li>
  <li><a href="/sitemap">Sitemap</a></li>
</ul>

## Posts
<ul>
{% for post in site.posts %}
  <li><a href="{{ post.url | relative_url }}">{{ post.title }}</a></li>
{% endfor %}
</ul> 