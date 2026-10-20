---
title: Couch Crash Calendar
description: Large-scale, multi-day, community-organized couch surfing events
  across the globe.
crumb: Couch Crash Calendar
type: general
hide_title: true
---
<style>
  /* --- COUCHERS.ORG DESIGN SYSTEM & LIGHT MODE DEFAULTS --- */
  .cc-wrapper {
    /* Default Light Mode Variables */
    --cc-font: 'Ubuntu', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    --cc-text: #313539;
    --cc-text-muted: #4a5568;
    --cc-text-light: #666666;
    --cc-heading: #313539;
    --cc-card-bg: #ffffff;
    --cc-border: #e0e0e0;
    --cc-border-light: #eeeeee;
    --cc-date-bg: #e6f6f5;
    --cc-date-text: #007a72;
    --cc-tag-bg: #f4f5f7;
    --cc-tag-text: #4a5568;
    --cc-propose-bg: #fdf8f3;
    --cc-propose-border: #f9d8b6;
    --cc-past-border: #9e9e9e;

    font-family: var(--cc-font);
    color: var(--cc-text);
    line-height: 1.5;
    max-width: 100%;
    position: relative;
  }

  /* --- NATIVE DARK MODE TOGGLE HOOKS --- */
  .dark .cc-wrapper,
  .dark-mode .cc-wrapper,
  .theme-dark .cc-wrapper,
  [data-theme="dark"] .cc-wrapper,
  html.dark .cc-wrapper,
  body.dark .cc-wrapper {
    --cc-text: #e2e8f0;
    --cc-text-muted: #94a3b8;
    --cc-text-light: #94a3b8;
    --cc-heading: #f8fafc;
    --cc-card-bg: #1e293b;
    --cc-border: #334155;
    --cc-border-light: #273548;
    --cc-date-bg: #042f2e;
    --cc-date-text: #2dd4bf;
    --cc-tag-bg: #334155;
    --cc-tag-text: #cbd5e1;
    --cc-propose-bg: #221a12;
    --cc-propose-border: #78350f;
    --cc-past-border: #64748b;
  }

  /* Couchers.org Hero Styles */
  .cc-hero {
    position: relative;
    width: 100%;
    height: 300px;
    border-radius: 8px;
    overflow: hidden;
    margin-bottom: 24px;
    background-color: var(--cc-card-bg);
    border: 1px solid var(--cc-border);
  }
  .cc-hero-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
    display: block;
  }
  .cc-hero-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(180deg, rgba(0, 0, 0, 0.15) 0%, rgba(0, 0, 0, 0.65) 100%);
    z-index: 1;
  }
  .cc-hero-credit {
    position: absolute;
    bottom: 0;
    right: 0;
    background: rgba(0, 0, 0, 0.5);
    color: rgba(255, 255, 255, 0.85);
    font-size: 0.75rem;
    line-height: 1.4;
    padding: 3px 8px;
    margin: 0;
    border-top-left-radius: 4px;
    z-index: 3;
  }
  .cc-hero-credit a {
    color: #ffffff;
    text-decoration: underline;
  }
  .cc-hero-credit a:hover {
    color: #00A398;
  }
  .cc-hero-content {
    position: absolute;
    bottom: 28px;
    left: 24px;
    right: 24px;
    z-index: 2;
  }
  .cc-hero-content h1 {
    font-size: 2.75rem;
    font-weight: 700;
    color: #ffffff;
    margin: 0 0 8px 0;
    line-height: 1.2;
    letter-spacing: -0.01em;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.35);
  }
  .cc-hero-content p {
    font-size: 1.05rem;
    color: rgba(255, 255, 255, 0.95);
    margin: 0;
    max-width: 720px;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.35);
  }
  @media (max-width: 600px) {
    .cc-hero {
      height: 240px;
    }
    .cc-hero-content {
      bottom: 32px;
      left: 16px;
      right: 16px;
    }
    .cc-hero-content h1 {
      font-size: 2rem;
    }
    .cc-hero-content p {
      font-size: 0.95rem;
    }
  }

  /* Expandable Info Drawers */
  .cc-drawer {
    background: var(--cc-card-bg);
    border: 1px solid var(--cc-border);
    border-radius: 8px;
    padding: 12px 16px;
    margin-bottom: 16px;
  }
  .cc-drawer.cc-drawer-past {
    margin-top: 32px;
  }
  .cc-drawer summary {
    font-weight: 500;
    cursor: pointer;
    font-size: 1.25rem;
    color: #00A398;
    outline: none;
  }
  .cc-drawer summary:hover {
    text-decoration: underline;
  }
  .cc-drawer-content {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid var(--cc-border-light);
    font-size: 0.95rem;
    color: var(--cc-text-muted);
  }
  .cc-drawer-content p {
    margin: 0 0 10px 0;
  }
  .cc-drawer-content p:last-child {
    margin-bottom: 0;
  }
  .cc-drawer-content p.important-block {
    margin-left: 30px;
  }

  /* Section & Month Headers */
  .cc-section-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--cc-heading);
    margin: 32px 0 8px 0;
  }
  .cc-month, .cc-year {
    margin: 24px 0 12px 0;
    padding-bottom: 6px;
    border-bottom: 2px solid var(--cc-border-light);
    font-size: 1.2rem;
    font-weight: 700;
    color: #00A398;
  }
  .cc-year-first {
    margin-top: 0;
  }

  /* Responsive Card Grid */
  .cc-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
    gap: 16px;
    margin: 8px 0 24px 0;
  }
  .cc-grid-last {
    margin-bottom: 0;
  }

  /* Individual Event Card */
  .cc-card {
    background: var(--cc-card-bg);
    border: 1px solid var(--cc-border);
    border-top: 4px solid #00A398;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    transition: box-shadow 0.2s ease, transform 0.2s ease;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .cc-card:hover {
    box-shadow: 0 6px 14px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }
  .cc-card.overlap {
    border-top-color: #E47701;
  }
  .cc-card.past {
    border-top-color: var(--cc-past-border);
  }

  /* Event Card Image */
  .cc-card-img {
    width: 100%;
    height: 145px;
    object-fit: cover;
    display: block;
    border-bottom: 1px solid var(--cc-border-light);
  }
  .cc-card-img[src=""] {
    display: none;
  }

  .cc-card-body {
    padding: 16px;
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    justify-content: space-between;
  }

  .cc-date-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
    gap: 8px;
    flex-wrap: wrap;
  }
  .cc-date {
    background: var(--cc-date-bg);
    color: var(--cc-date-text);
    font-weight: 500;
    font-size: 0.85rem;
    padding: 3px 10px;
    border-radius: 4px;
  }
  .cc-date.past {
    background: var(--cc-tag-bg);
    color: var(--cc-tag-text);
  }
  .cc-overlap-tag {
    background: #fdf1e6;
    color: #E47701;
    border: 1px solid #f9d8b6;
    font-size: 0.75rem;
    font-weight: 500;
    padding: 2px 8px;
    border-radius: 4px;
  }

  .cc-title {
    font-size: 1.15rem;
    font-weight: 700;
    margin: 0 0 8px 0;
  }
  .cc-title a {
    color: var(--cc-heading);
    text-decoration: none;
  }
  .cc-title a:hover {
    color: #00A398;
    text-decoration: underline;
  }

  .cc-meta {
    font-size: 0.92rem;
    color: var(--cc-text-muted);
    margin-bottom: 12px;
  }

  .cc-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 14px;
  }
  .cc-tag {
    background: var(--cc-tag-bg);
    color: var(--cc-tag-text);
    font-size: 0.78rem;
    font-weight: 500;
    padding: 3px 8px;
    border-radius: 4px;
  }

  .cc-organizer {
    font-size: 0.85rem;
    color: var(--cc-text-light);
    border-top: 1px solid var(--cc-border-light);
    padding-top: 10px;
  }
  .cc-organizer a {
    color: #00A398;
    font-weight: 500;
    text-decoration: none;
  }
  .cc-organizer a:hover {
    text-decoration: underline;
  }

  /* Button Style */
  .cc-btn {
    display: inline-block;
    background-color: #00A398;
    color: #ffffff !important;
    font-family: 'Ubuntu', sans-serif;
    font-weight: 500;
    font-size: 0.92rem;
    padding: 8px 18px;
    border-radius: 6px;
    text-decoration: none !important;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.14);
    transition: background-color 0.2s ease, box-shadow 0.2s ease, transform 0.15s ease, opacity 0.25s ease;
  }
  .cc-btn:hover {
    background-color: #00877e;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    transform: translateY(-1px);
  }

  /* Floating Wrapper */
  .cc-fab-container {
    position: sticky;
    bottom: 24px;
    display: flex;
    justify-content: flex-end;
    pointer-events: none;
    z-index: 999;
    margin-top: 16px;
  }
  .cc-fab-container .cc-btn {
    pointer-events: auto;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.22);
  }
  .cc-fab-hidden {
    opacity: 0;
    pointer-events: none !important;
  }

  /* Propose Box */
  .cc-propose-box {
    background: var(--cc-propose-bg);
    border: 1px solid var(--cc-propose-border);
    border-left: 6px solid #E47701;
    border-radius: 8px;
    padding: 20px 24px;
    margin-top: 24px;
  }
  .cc-propose-box h3 {
    margin: 0 0 8px 0;
    color: var(--cc-heading);
    font-size: 1.25rem;
    font-weight: 700;
  }
  .cc-propose-box p {
    color: var(--cc-text);
  }
  .cc-propose-box a:not(.cc-btn) {
    color: #00A398;
    font-weight: 500;
    text-decoration: none;
  }
  .cc-propose-box a:not(.cc-btn):hover {
    text-decoration: underline;
  }
  .cc-propose-spacing {
    margin-top: 14px;
    margin-bottom: 0;
  }
  .cc-propose-spacing-top {
    margin-top: 14px;
  }
</style>

<div class="cc-wrapper">

  <!-- HERO SECTION -->

  <div class="cc-hero">
    <img class="cc-hero-img" sizes="100vw" alt="Couchers community" srcset="https://cdn.couchers.org/img/hero/1024.jpeg 1024w, https://cdn.couchers.org/img/hero/2048.jpeg 2048w, https://cdn.couchers.org/img/hero/4096.jpeg 4096w" src="https://cdn.couchers.org/img/hero/2048.jpeg">
    <div class="cc-hero-overlay"></div>
    <p class="cc-hero-credit">Photo by <a href="https://unsplash.com/@directormesut?utm_source=unsplash&amp;utm_medium=referral&amp;utm_content=creditCopyText" rel="noreferrer noopener" target="_blank">Mesut Kaya</a> on <a href="https://unsplash.com/?utm_source=unsplash&amp;utm_medium=referral&amp;utm_content=creditCopyText" rel="noreferrer noopener" target="_blank">Unsplash</a></p>
    <div class="cc-hero-content">
      <h1>Couch Crash Calendar</h1>
      <p>Discover upcoming multi-day Couch Crashes and connect with local hosts and travelers around the world.</p>
    </div>
  </div>

  <!-- COLLAPSIBLE INFO -->

  <details class="cc-drawer">
    <summary>What is a Couch Crash & Note on Accommodation</summary>
    <div class="cc-drawer-content">
      <p>A Couch Crash (sometimes called an Invasion or Camp) is a multi-day couch surfing event organized by locals to welcome the global community. Whether structured like a city weekend or an outdoor festival, it is designed to showcase the hosts' corner of the world to visiting members.</p>
      <p>Unlike regular meetups and events, Couch Crashes usually feature a multi-day itinerary including tours, potlucks, and parties. Local couch surfers organize the events and host the influx of visiting couch surfers.</p>
      <p class="important-block"><strong>Note on Accommodation:</strong> A Couch Crash is a community gathering, not guaranteed lodging. Local members host when possible, but attendees are encouraged to send requests early or arrange backup accommodation (hostels, camping, or guesthouses).</p>
    </div>
  </details>

  <!-- UPCOMING CRASHES -->

  <h2 class="cc-section-title">Upcoming Crashes</h2>

  <h3 class="cc-month">December 2026</h3>
  <div class="cc-grid">
    <div class="cc-card">
      <img class="cc-card-img" src="https://images.unsplash.com/photo-1519197924294-4ba991a11128?auto=format&fit=crop&w=600&q=80" alt="Awesome Event" />
      <div class="cc-card-body">
        <div class="cc-date-row">
          <span class="cc-date">📅 November 24 – 29, 2026</span>
        </div>
        <h4 class="cc-title">
          <a href="https://couchers.org/event/7766/wroclaw-cs-winter-camp">Awesome Event</a>
        </h4>
        <div class="cc-meta">📍 NYC, United States</div>
        <div class="cc-tags">
          <span class="cc-tag">City & Culture</span>
          <span class="cc-tag">Nightlife</span>
        </div>
        <div class="cc-organizer">
          👤 Organized by <a href="https://couchers.org/user/aapeli">Aapeli</a>
        </div>
      </div>
    </div>
    
    <div class="cc-card">
      <img class="cc-card-img" src="https://usercontent.couchershq.org/media/img/full/7aca5034aa9bbcfc7752467ee812246b4257b864656b5f81f2450d5b23dfe232.jpg" alt="Wrocław CS Winter Camp" />
      <div class="cc-card-body">
        <div class="cc-date-row">
          <span class="cc-date">📅 Dec 30, 2026 – Jan 4, 2027</span>
        </div>
        <h4 class="cc-title">
          <a href="https://couchers.org/event/7766/wroclaw-cs-winter-camp">Wrocław CS Winter Camp</a>
        </h4>
        <div class="cc-meta">📍 Wrocław, Poland</div>
        <div class="cc-tags">
          <span class="cc-tag">Winter Camp</span>
          <span class="cc-tag">City & Culture</span>
        </div>
        <div class="cc-organizer">
          👤 Organized by <a href="https://couchers.org/user/christr">Chris</a>
        </div>
      </div>
    </div>
  </div>
    
  <h3 class="cc-month">January 2027</h3>
  <div class="cc-grid">
    <div class="cc-card overlap">
      <img class="cc-card-img" src="https://usercontent.couchershq.org/media/img/full/9158c0ae91ed57e09caa203a5d415a3edaa8172a273ee1cc1e6bd7a4a937f477.jpg" alt="New Years Event Berlin" />
      <div class="cc-card-body">
        <div class="cc-date-row">
          <span class="cc-date">📅 January 6 – 10, 2027</span>
          <span class="cc-overlap-tag">Same Weekend</span>
        </div>
        <h4 class="cc-title">
          <a href="https://couchers.org/event/7766/wroclaw-cs-winter-camp">New Years Event Berlin</a>
        </h4>
        <div class="cc-meta">📍 Berlin, Germany</div>
        <div class="cc-tags">
          <span class="cc-tag">City & Culture</span>
          <span class="cc-tag">Winter</span>
        </div>
        <div class="cc-organizer">
          👤 Organized by <a href="https://couchers.org/user/chrisk">ChrisK</a>
        </div>
      </div>
    </div>    
    
    <div class="cc-card overlap">
      <img class="cc-card-img" src="https://usercontent.couchershq.org/media/img/full/7ecbd262e071ea0539d4614c6ecba42ac96eddd61479677d0e396273c7e64b5e.jpg" alt="New Years Event Leipzig" />
      <div class="cc-card-body">
        <div class="cc-date-row">
          <span class="cc-date">📅 January 7 – 10, 2027</span>
          <span class="cc-overlap-tag">Same Weekend</span>
        </div>
        <h4 class="cc-title">
          <a href="https://couchers.org/event/7766/wroclaw-cs-winter-camp">New Years Event Leipzig</a>
        </h4>
        <div class="cc-meta">📍 Leipzig, Germany</div>
        <div class="cc-tags">
          <span class="cc-tag">New Year</span>
          <span class="cc-tag">Winter</span>
        </div>
        <div class="cc-organizer">
          👤 Organized by <a href="https://couchers.org/user/chrisk">Iason</a>
        </div>
      </div>
    </div>
        
    <div class="cc-card">
      <img class="cc-card-img" src="https://usercontent.couchershq.org/media/img/full/4af3edfd5e38c45967ca81b1475e2da608be6f77842919a35113f88c0f323491.jpg" alt="Sydney Summer Crash" />
      <div class="cc-card-body">
        <div class="cc-date-row">
          <span class="cc-date">📅 January 21 – 24, 2027</span>
        </div>
        <h4 class="cc-title">
          <a href="https://couchers.org/event/7684/couchers-fortnight-meet-greet">Sydney Summer Crash</a>
        </h4>
        <div class="cc-meta">📍 Sydney, Australia</div>
        <div class="cc-tags">
          <span class="cc-tag">Summer</span>
          <span class="cc-tag">City Beach</span>
        </div>
        <div class="cc-organizer">
          👤 Organized by <a href="https://couchers.org/user/chrisk">Jesse</a>
        </div>
      </div>
    </div>
  </div>

  <!-- PAST CRASHES -->

  <details class="cc-drawer cc-drawer-past">
    <summary>Past Crashes</summary>
    <div class="cc-drawer-content">
      <div class="cc-year cc-year-first">2026</div>
      <div class="cc-grid cc-grid-last">
        <div class="cc-card past">
          <img class="cc-card-img" src="https://images.unsplash.com/photo-1519197924294-4ba991a11128?auto=format&fit=crop&w=600&q=80" alt="Brisbane Christmas in July" />
          <div class="cc-card-body">
            <div class="cc-date-row">
              <span class="cc-date past">📅 Jul 23 – 26, 2026</span>
            </div>
            <h4 class="cc-title">Brisbane Christmas in July Couch Crash 2026</h4>
            <div class="cc-meta">📍 Brisbane, Australia</div>
            <div class="cc-organizer">
              👤 Organized by <a href="https://couchers.org/user/chrisk">ChrisK</a>
            </div>
          </div>
        </div>
      </div>
    
      <div class="cc-year">2025</div>
      <div class="cc-grid cc-grid-last">
        <div class="cc-card past">
          <img class="cc-card-img" src="https://usercontent.couchershq.org/media/img/full/37e6f814d49027a6fff6f07b8fe271f09f1651385bfbe3d7859e40018c59fef9.jpg" alt="Perth Christmas in July" />
          <div class="cc-card-body">
            <div class="cc-date-row">
              <span class="cc-date past">📅 Jul 23 – 26, 2025</span>
            </div>
            <h4 class="cc-title">Perth Christmas in July Couch Crash 2025</h4>
            <div class="cc-meta">📍 Perth, Australia</div>
            <div class="cc-organizer">
              👤 Organized by <a href="https://couchers.org/user/chrisk">ChrisK</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </details>

  <!-- FLOATING PROPOSE BUTTON -->

  <div class="cc-fab-container" id="cc-floating-btn">
    <a href="#propose-crash" class="cc-btn">Propose a Crash</a>
  </div>

  <!-- PROPOSE A CRASH SECTION -->

  <div id="propose-crash" class="cc-propose-box">
    <h3>Propose a Crash</h3>
    <p>Want your Couch Crash listed here? Send a message to <a href="https://couchers.org/user/chrisk">ChrisK</a> with the following line: <br /><br />
    <code>Couch Crash: (Link to event)</code></p>
    <p class="cc-propose-spacing">
      <a href="https://couchers.org/user/chrisk" class="cc-btn">Message ChrisK to Submit</a>
    </p>
    <p class="cc-propose-spacing-top">If your community organizes a Couch Crash, be sure to reach out to your local <strong>Community Builder</strong> (found on the "Local Info" tab of your <a href="https://couchers.org/communities">Community Page</a>) to let them know and consider collaborating.</p>
    <p>Want to become a Community Builder? <a href="https://help.couchers.org/hc/couchersorg-help-center/articles/1743977410-what-is-a-community-builder">Learn more here</a>.</p>
  </div>

</div>

<!-- SCRIPT -->

<script>
  document.addEventListener("DOMContentLoaded", function() {
    var fab = document.getElementById('cc-floating-btn');
    var target = document.getElementById('propose-crash');
    
    if (fab && target && 'IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            fab.classList.add('cc-fab-hidden');
          } else {
            fab.classList.remove('cc-fab-hidden');
          }
        });
      }, { threshold: 0.6 });
      observer.observe(target);
    }
  });
</script>