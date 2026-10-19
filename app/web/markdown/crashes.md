---
title: Couch Crash Calendar
description: Large-scale, multi-day, community-organized couch surfing events
  across the globe.
crumb: Couch Crash Calendar
type: general
hide_title: true
---
<style>
  /* --- COUCHERS.ORG DESIGN SYSTEM STYLES (DO NOT EDIT) --- */
  .cc-wrapper {
    font-family: 'Ubuntu', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #313539;
    line-height: 1.5;
    max-width: 100%;
    position: relative;
  }

  /* Hero Section with Banner Image */
  .cc-hero {
    background-color: #f4fbfb;
    border: 1px solid #ccece9;
    border-radius: 8px;
    overflow: hidden;
    margin-bottom: 16px;
  }
  .cc-hero-banner {
    width: 100%;
    height: 200px;
    object-fit: cover;
    display: block;
    background-color: #e6f6f5;
  }
  .cc-hero-body {
    padding: 20px 24px;
    border-left: 6px solid #00A398;
  }
  .cc-hero h1 {
    margin: 0 0 8px 0;
    font-size: 1.75rem;
    font-weight: 700;
    color: #00A398;
  }
  .cc-hero p {
    margin: 0;
    font-size: 1rem;
    color: #313539;
    max-width: 760px;
  }

  /* Expandable Info Drawers */
  .cc-drawer {
    background: #ffffff;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 12px 16px;
    margin-bottom: 16px;
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
    border-top: 1px solid #eeeeee;
    font-size: 0.95rem;
    color: #4a5568;
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
    color: #313539;
    margin: 32px 0 8px 0;
  }
  .cc-month {
    margin: 24px 0 12px 0;
    padding-bottom: 6px;
    border-bottom: 2px solid #eeeeee;
    font-size: 1.2rem;
    font-weight: 700;
    color: #00A398;
  }
  .cc-year {
    margin: 24px 0 12px 0;
    padding-bottom: 6px;
    border-bottom: 2px solid #eeeeee;
    font-size: 1.2rem;
    font-weight: 700;
    color: #00A398;
  }

  /* Responsive Card Grid */
  .cc-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
    gap: 16px;
    margin-bottom: 24px;
  }

  /* Individual Event Card with Cover Image */
  .cc-card {
    background: #ffffff;
    border: 1px solid #e0e0e0;
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

  /* Secondary Orange Accent for Overlapping Weekend Events */
  .cc-card.overlap {
    border-top-color: #E47701;
  }

  /* Event Card Image (Automatically hides if src="" is left empty) */
  .cc-card-img {
    width: 100%;
    height: 145px;
    object-fit: cover;
    display: block;
    border-bottom: 1px solid #eeeeee;
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
    background: #e6f6f5;
    color: #007a72;
    font-weight: 500;
    font-size: 0.85rem;
    padding: 3px 10px;
    border-radius: 4px;
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
    color: #313539;
    text-decoration: none;
  }
  .cc-title a:hover {
    color: #00A398;
    text-decoration: underline;
  }

  .cc-meta {
    font-size: 0.92rem;
    color: #4a5568;
    margin-bottom: 12px;
  }

  .cc-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 14px;
  }
  .cc-tag {
    background: #f4f5f7;
    color: #4a5568;
    font-size: 0.78rem;
    font-weight: 500;
    padding: 3px 8px;
    border-radius: 4px;
  }

  .cc-organizer {
    font-size: 0.85rem;
    color: #666666;
    border-top: 1px solid #eeeeee;
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

  /* Unified Couchers MUI Button Style (Used for Both Propose & Submit) */
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

  /* Sticky Floating Wrapper: Stays floating while scrolling events, 
     naturally disappears once you reach the Propose Box at the bottom */
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

  /* Propose a Crash Callout Box */
  .cc-propose-box {
    background: #fdf8f3;
    border: 1px solid #f9d8b6;
    border-left: 6px solid #E47701;
    border-radius: 8px;
    padding: 20px 24px;
    margin-top: 24px;
  }
  .cc-propose-box h3 {
    margin: 0 0 8px 0;
    color: #313539;
    font-size: 1.25rem;
    font-weight: 700;
  }
  .cc-propose-box a:not(.cc-btn) {
    color: #00A398;
    font-weight: 500;
    text-decoration: none;
  }
  .cc-propose-box a:not(.cc-btn):hover {
    text-decoration: underline;
  }
</style>

<div class="cc-wrapper">

  <!-- HERO SECTION WITH BANNER IMAGE -->

  <div class="cc-hero">
    <img class="cc-hero-banner" src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80" alt="Couchers community gathering" />
    <div class="cc-hero-body">
      <h1>Couch Crash Calendar</h1>
      <p>Browse upcoming Crashes below, pack your bags, and discover a new place through the eyes of locals while connecting with couch surfers from around the world!</p>
    </div>
  </div>

  <!-- COLLAPSIBLE INFO & ACCOMMODATION NOTE -->

  <details class="cc-drawer">
    <summary>What is a Couch Crash & Note on Accommodation</summary>
    <div class="cc-drawer-content">
      <p>A Couch Crash (sometimes called an Invasion or Camp) is a multi-day couch surfing event organized by locals to welcome the global community. Whether structured like a city weekend or an outdoor festival, it is designed to showcase the hosts' corner of the world to visiting members.</p>
      <p>Unlike regular meetups and events, Couch Crashes usually feature a multi-day itinerary including tours, potlucks, and parties. Local couch surfers organize the events and host the influx of visiting couch surfers.</p>
      <p class="important-block"><strong>Note on Accommodation:</strong> A Couch Crash is a community gathering, not guaranteed lodging. Local members host when possible, but attendees are encouraged to send requests early or arrange backup accommodation (hostels, camping, or guesthouses).</p>
    </div>
  </details>

  <!-- ================= UPCOMING CRASHES ================= -->

  <h2 class="cc-section-title">Upcoming Crashes</h2>

  <h3 class="cc-month">December 2026</h3>
  <div class="cc-grid">
  
    <div class="cc-card">
      <img class="cc-card-img" src="https://images.unsplash.com/photo-1519197924294-4ba991a11128?auto=format&fit=crop&w=600&q=80" alt="EVENT 2" />
      <div class="cc-card-body">
        <div>
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
        </div>
        <div class="cc-organizer">
          👤 Organized by <a href="https://couchers.org/user/aapeli">Aapeli</a>
        </div>
      </div>
    </div>
	
    <div class="cc-card">
      <img class="cc-card-img" src="https://usercontent.couchershq.org/media/img/full/7aca5034aa9bbcfc7752467ee812246b4257b864656b5f81f2450d5b23dfe232.jpg" alt="Wrocław CS Winter Camp" />
      <div class="cc-card-body">
        <div>
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
      <img class="cc-card-img" src="https://usercontent.couchershq.org/media/img/full/9158c0ae91ed57e09caa203a5d415a3edaa8172a273ee1cc1e6bd7a4a937f477.jpg" alt="EVENT 3" />
      <div class="cc-card-body">
        <div>
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
        </div>
        <div class="cc-organizer">
          👤 Organized by <a href="https://couchers.org/user/chrisk">ChrisK</a>
        </div>
      </div>
    </div>	
	
    <div class="cc-card overlap">
      <img class="cc-card-img" src="https://usercontent.couchershq.org/media/img/full/7ecbd262e071ea0539d4614c6ecba42ac96eddd61479677d0e396273c7e64b5e.jpg" alt="EVENT 4" />
      <div class="cc-card-body">
        <div>
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
        </div>
        <div class="cc-organizer">
          👤 Organized by <a href="https://couchers.org/user/chrisk">Iason</a>
        </div>
      </div>
    </div>
		
    <div class="cc-card">
      <img class="cc-card-img" src="https://usercontent.couchershq.org/media/img/full/4af3edfd5e38c45967ca81b1475e2da608be6f77842919a35113f88c0f323491.jpg" alt="EVENT 5" />
      <div class="cc-card-body">
        <div>
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
        </div>
        <div class="cc-organizer">
          👤 Organized by <a href="https://couchers.org/user/chrisk">Jesse</a>
        </div>
      </div>
    </div>

  </div>

<!-- ================= PAST CRASHES ================= -->

  <details class="cc-drawer" style="margin-top: 32px;">
    <summary>Past Crashes</summary>
    <div class="cc-drawer-content">
      
      <div class="cc-year" style="margin-top: 0;">2026</div>
      <div class="cc-grid" style="margin-top: 8px; margin-bottom: 24px;">
        <div class="cc-card" style="border-top-color: #9e9e9e;">
          <img class="cc-card-img" src="https://images.unsplash.com/photo-1519197924294-4ba991a11128?auto=format&fit=crop&w=600&q=80" alt="Brisbane Christmas in July" />
          <div class="cc-card-body">
            <div>
              <div class="cc-date-row">
                <span class="cc-date" style="background: #f4f5f7; color: #4a5568;">📅 Jul 23 – 26, 2026</span>
              </div>
              <h4 class="cc-title">Brisbane Christmas in July Couch Crash 2026</h4>
              <div class="cc-meta">📍 Brisbane, Australia</div>
            </div>
            <div class="cc-organizer">
              👤 Organized by <a href="https://couchers.org/user/chrisk">ChrisK</a>
            </div>
          </div>
        </div>
      </div>
	
      <div class="cc-year">2025</div>
      <div class="cc-grid" style="margin-top: 8px; margin-bottom: 0;">
        <div class="cc-card" style="border-top-color: #9e9e9e;">
          <img class="cc-card-img" src="https://usercontent.couchershq.org/media/img/full/37e6f814d49027a6fff6f07b8fe271f09f1651385bfbe3d7859e40018c59fef9.jpg" alt="Perth Christmas in July" />
          <div class="cc-card-body">
            <div>
              <div class="cc-date-row">
                <span class="cc-date" style="background: #f4f5f7; color: #4a5568;">📅 Jul 23 – 26, 2025</span>
              </div>
              <h4 class="cc-title">Perth Christmas in July Couch Crash 2025</h4>
              <div class="cc-meta">📍 Perth, Australia</div>
            </div>
            <div class="cc-organizer">
              👤 Organized by <a href="https://couchers.org/user/chrisk">ChrisK</a>
            </div>
          </div>
        </div>
      </div>

```

```

  </details>

  <!-- FLOATING PROPOSE BUTTON -->

  <div class="cc-fab-container" id="cc-floating-btn">
    <a href="#propose-crash" class="cc-btn">Propose a Crash</a>
  </div>

  <!-- ================= PROPOSE A CRASH SECTION ================= -->

  <div id="propose-crash" class="cc-propose-box">
    <h3>Propose a Crash</h3>
    <p>Want your Couch Crash listed here? Send a message to <a href="https://couchers.org/user/chrisk">ChrisK</a> with the following line: <br />
	<code>Couch Crash: (Link to event)</code></p>
	<p style="margin-top: 14px; margin-bottom: 0;">
      <a href="https://couchers.org/user/chrisk" class="cc-btn">Message ChrisK to Submit</a><br />
    </p>
    <p>If your community organizes a Couch Crash, be sure to reach out to your local <strong>Community Builder</strong> (found on the "Local Info" tab of your <a href="https://couchers.org/communities">Community Page</a>) to let them know and consider collaborating.</p>
	<p>Want to become a Community Builder? <a href="https://help.couchers.org/hc/couchersorg-help-center/articles/1743977410-what-is-a-community-builder">Learn more here</a>.</p>

  </div>

</div>

<!-- Optional: Smoothly fades out the floating button when the Propose box enters the screen -->

<script>
  document.addEventListener("DOMContentLoaded", function() {
    var fab = document.getElementById('cc-floating-btn');
    var target = document.getElementById('propose-crash');
    
    if (fab && target) {
      if ('IntersectionObserver' in window) {
        var observer = new IntersectionObserver(function(entries) {
          entries.forEach(function(entry) {
            if (entry.isIntersecting) {
              fab.classList.add('cc-fab-hidden');
            } else {
              fab.classList.remove('cc-fab-hidden');
            }
          });
        }, { threshold: 0.6 }); // Triggered when 60% of the propose box is visible
        observer.observe(target);
      } else {
        // Fallback for older browsers if needed
        fab.style.display = 'block';
      }
    }
  });
</script>