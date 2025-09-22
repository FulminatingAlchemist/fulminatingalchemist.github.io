---
layout: about
title: about
permalink: /
subtitle: PhD student at the University of Bristol.

#profile:
#  align: right
#  image: prof_pic.jpg
#  image_circular: false # crops the image to make it circular
#  more_info: >
#    <p>555 your office number</p>
#    <p>123 your address street</p>
#    <p>Your City, State 12345</p>

news: true # includes a list of news items
selected_papers: true # includes a list of papers marked as "selected={true}"
social: true # includes social icons at the bottom of the page
---
I'm a passionate chemist specialising in functional inorganic materials and their synthesis. As a PhD researcher at the University of Bristol, I combine academic research with hands-on lab management to drive innovation and environmental responsibility. I developed the BANG method (Bristol Accelerated Nanoparticle Generation), a novel approach to synthesising functional nanoparticles through controlled detonation — an exciting technique that's opened up new possibilities in the field. I led my lab to a gold LEAF certification, proving my commitment to both precision and sustainability. Outside the lab, I practice karate and enjoy tinkering with electronics.

Feel free to get in touch via LinkedIn or email.

---
<section id="awards">
  <h2>🏆 Recent Awards</h2>
  <ul>
    {% for award in site.data.awards %}
      <li>
        <strong>{{ award.title }}</strong><br>
        <em>{{ award.issuer }}</em> — {{ award.date }}
        {% if award.organisation %}<br>{{ award.organisation }}{% endif %}
        {% if award.description %}
          <p>{{ award.description }}</p>
        {% endif %}
        {% if award.image %}
          <img src="{{ award.image }}" alt="{{ award.title }} certificate" style="max-width:300px;">
        {% endif %}
      </li>
    {% endfor %}
  </ul>
</section>
<!-- NEW SECTION END -->

