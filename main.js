// Navbar: add scrolled class on scroll
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 40);
});

// Mobile nav toggle
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
navToggle.addEventListener('click', () => {
  navLinks.classList.toggle('open');
});

// Close mobile nav when a link is clicked
function attachNavClose() {
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => navLinks.classList.remove('open'));
  });
}
attachNavClose();

// Events: fetch upcoming, inject nav link if any exist, render page if on events.html
function fmtEventDate(iso) {
  const datePart = iso.slice(0, 10);
  const [y, , d] = datePart.split('-');
  return { month: new Date(`${datePart}T12:00:00`).toLocaleString('en-US', { month: 'short' }), day: +d, year: y };
}

function fmtEventTime(isoStr) {
  const d = new Date(isoStr);
  let h = d.getUTCHours();
  const m = d.getUTCMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}${m ? ':' + String(m).padStart(2, '0') : ''} ${ampm}`;
}

(async function loadPhotos() {
  let photoEvents = [];
  try {
    const res = await fetch('/api/photos');
    if (res.ok) {
      const data = await res.json();
      photoEvents = (data.events || []).filter(e => e.photos && e.photos.length);
    }
  } catch { /* swallow */ }

  if (photoEvents.length) {
    const voteLi = Array.from(navLinks.querySelectorAll('li'))
      .find(li => li.querySelector('a[href="vote.html"]'));
    if (voteLi) {
      const trailLi = document.createElement('li');
      trailLi.innerHTML = '<a href="on-the-trail.html">On the Trail</a>';
      navLinks.insertBefore(trailLi, voteLi);
      trailLi.querySelector('a').addEventListener('click', () => navLinks.classList.remove('open'));
    }
  }

  const carouselWrap = document.getElementById('trailCarouselWrap');
  const gallery      = document.getElementById('trailGallery');
  if (!gallery) return;

  if (!photoEvents.length) {
    gallery.innerHTML = '<p class="events-loading">No photos yet. Check back soon.</p>';
    return;
  }

  // --- Carousel (all photos across all events) ---
  const allCarouselPhotos = photoEvents.flatMap(ev =>
    [...ev.photos].sort((a, b) => a.order - b.order).map(p => ({ ...p, eventTitle: ev.title }))
  );
  const slides = allCarouselPhotos.map(p => `
    <div class="trail-carousel-slide">
      <img src="${p.url}" alt="${p.caption || p.eventTitle}" loading="lazy" />
    </div>`).join('');
  const dots = allCarouselPhotos.map((_, i) =>
    `<button class="trail-carousel-dot${i === 0 ? ' active' : ''}" data-idx="${i}" aria-label="Photo ${i + 1}"></button>`
  ).join('');

  carouselWrap.innerHTML = `
    <div class="trail-carousel" id="trailCarousel">
      <div class="trail-carousel-event">${allCarouselPhotos[0].eventTitle}</div>
      <div class="trail-carousel-track">${slides}</div>
      <button class="trail-carousel-btn prev">&#8592;</button>
      <button class="trail-carousel-btn next">&#8594;</button>
      <div class="trail-carousel-dots">${dots}</div>
      <div class="trail-carousel-caption">${allCarouselPhotos[0].caption || ''}</div>
    </div>`;

  (function initCarousel() {
    const carousel   = document.getElementById('trailCarousel');
    const track      = carousel.querySelector('.trail-carousel-track');
    const captionEl  = carousel.querySelector('.trail-carousel-caption');
    const dotEls     = carousel.querySelectorAll('.trail-carousel-dot');
    const eventLabel = carousel.querySelector('.trail-carousel-event');
    const photos     = allCarouselPhotos;
    let current      = 0;
    let timer;

    function goTo(idx) {
      current = (idx + photos.length) % photos.length;
      track.style.transform = `translateX(-${current * 100}%)`;
      captionEl.textContent = photos[current].caption || '';
      eventLabel.textContent = photos[current].eventTitle;
      dotEls.forEach((d, i) => d.classList.toggle('active', i === current));
    }

    function startTimer() { timer = setInterval(() => goTo(current + 1), 4500); }
    function stopTimer()  { clearInterval(timer); }

    carousel.querySelector('.prev').addEventListener('click', () => { stopTimer(); goTo(current - 1); startTimer(); });
    carousel.querySelector('.next').addEventListener('click', () => { stopTimer(); goTo(current + 1); startTimer(); });
    dotEls.forEach(d => d.addEventListener('click', () => { stopTimer(); goTo(+d.dataset.idx); startTimer(); }));
    carousel.addEventListener('mouseenter', stopTimer);
    carousel.addEventListener('mouseleave', startTimer);
    startTimer();
  })();

  // --- Gallery sections ---
  function fmtTrailDate(iso) {
    return new Date(iso.slice(0, 10) + 'T12:00:00').toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric'
    });
  }

  gallery.innerHTML = photoEvents.map(ev => {
    const photos = [...ev.photos].sort((a, b) => a.order - b.order);
    const grid = photos.map(p => `
      <div class="trail-photo" data-url="${p.url}" data-caption="${(p.caption || '').replace(/"/g, '&quot;')}">
        <img src="${p.url}" alt="${p.caption || ev.title}" loading="lazy" />
        ${p.caption ? `<p class="trail-photo-caption">${p.caption}</p>` : ''}
      </div>`).join('');
    return `
      <div class="trail-section">
        <div class="trail-section-header">
          <h2>${ev.title}</h2>
          <span class="trail-section-date">${fmtTrailDate(ev.date)}</span>
        </div>
        <div class="trail-grid">${grid}</div>
      </div>`;
  }).join('');

  // --- Lightbox ---
  const allPhotos = photoEvents.flatMap(ev =>
    [...ev.photos].sort((a, b) => a.order - b.order).map(p => ({ url: p.url, caption: p.caption || '' }))
  );

  const lightbox = document.createElement('div');
  lightbox.className = 'trail-lightbox';
  lightbox.id = 'trailLightbox';
  lightbox.innerHTML = `
    <button class="trail-lightbox-close">&times;</button>
    <button class="trail-lightbox-btn prev">&#8592;</button>
    <img src="" alt="" />
    <button class="trail-lightbox-btn next">&#8594;</button>
    <div class="trail-lightbox-caption"></div>`;
  document.body.appendChild(lightbox);

  let lbIndex = 0;
  const lbImg     = lightbox.querySelector('img');
  const lbCaption = lightbox.querySelector('.trail-lightbox-caption');

  function lbGoTo(idx) {
    lbIndex = (idx + allPhotos.length) % allPhotos.length;
    lbImg.src = allPhotos[lbIndex].url;
    lbCaption.textContent = allPhotos[lbIndex].caption;
  }

  gallery.addEventListener('click', e => {
    const photo = e.target.closest('.trail-photo');
    if (!photo) return;
    const url = photo.dataset.url;
    lbIndex = allPhotos.findIndex(p => p.url === url);
    lbGoTo(lbIndex);
    lightbox.classList.add('open');
  });

  lightbox.querySelector('.trail-lightbox-close').addEventListener('click', () => lightbox.classList.remove('open'));
  lightbox.querySelector('.prev').addEventListener('click', () => lbGoTo(lbIndex - 1));
  lightbox.querySelector('.next').addEventListener('click', () => lbGoTo(lbIndex + 1));
  lightbox.addEventListener('click', e => { if (e.target === lightbox) lightbox.classList.remove('open'); });
})();

(async function loadEvents() {
  let items = [];
  try {
    const res = await fetch('/api/events');
    if (res.ok) {
      const data = await res.json();
      items = data.items || [];
    }
  } catch { /* swallow — no events shown */ }

  if (items.length) {
    const contactLi = Array.from(navLinks.querySelectorAll('li'))
      .find(li => li.querySelector('a[href="contact.html"]'));
    if (contactLi) {
      const eventsLi = document.createElement('li');
      eventsLi.innerHTML = '<a href="events.html">Events</a>';
      navLinks.insertBefore(eventsLi, contactLi);
      eventsLi.querySelector('a').addEventListener('click', () => navLinks.classList.remove('open'));
    }
  }

  const container = document.getElementById('eventsContainer');
  if (!container) return;

  if (!items.length) {
    container.innerHTML = '<p class="events-loading">No upcoming events at this time. Check back soon.</p>';
    return;
  }

  container.innerHTML = items.map(ev => {
    const { month, day, year } = fmtEventDate(ev.event_date);
    const timePart = ev.event_time ? `&#128336; ${fmtEventTime(ev.event_time)}` : '';
    const locParts = [ev.location_name, ev.city].filter(Boolean);
    const locPart  = locParts.length ? `&#128205; ${locParts.join(', ')}` : '';
    const meta     = [timePart, locPart].filter(Boolean)
      .map(s => `<span>${s}</span>`).join('');
    const notes    = ev.notes ? `<p class="event-notes">${ev.notes}</p>` : '';
    const detailsBtn = ev.event_url
      ? ev.cta_label
        ? `<a href="${ev.event_url}" target="_blank" rel="noopener" class="btn btn-primary">${ev.cta_label} &#8599;</a>`
        : `<a href="${ev.event_url}" target="_blank" rel="noopener" class="event-details-link">More info &#8599;</a>`
      : '';

    const mapQ = [ev.address, ev.city, ev.state, ev.zip].filter(Boolean).join(', ');
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQ)}`;
    const mapStrip = mapQ ? `
      <div class="event-map-wrap">
        <div class="event-map-strip">
          <a href="${mapsUrl}" target="_blank" rel="noopener" aria-label="Open in Google Maps">
            <img class="event-map-img" src="/api/mapimage?q=${encodeURIComponent(mapQ)}" alt="Map for ${ev.name.trim()}" loading="lazy" />
          </a>
        </div>
        <button class="event-map-toggle">&#9660; Expand map</button>
      </div>` : '';

    return `
      <div class="event-card">
        <div class="event-card-main">
          <div class="event-date-badge">
            <div class="event-date-month">${month}</div>
            <div class="event-date-day">${day}</div>
            <div class="event-date-year">${year}</div>
          </div>
          <div class="event-body">
            <div class="event-name">${ev.name}</div>
            ${meta ? `<div class="event-meta">${meta}</div>` : ''}
            ${notes}
          </div>
          <div class="event-actions">
            ${detailsBtn}
            <button class="btn btn-primary event-register-btn" data-id="${ev.id}" data-name="${ev.name.trim()}">Join Us!</button>
          </div>
        </div>
        ${mapStrip}
      </div>`;
  }).join('');

  container.addEventListener('click', e => {
    const toggle = e.target.closest('.event-map-toggle');
    if (!toggle) return;
    const strip = toggle.closest('.event-map-wrap').querySelector('.event-map-strip');
    const expanded = strip.classList.toggle('expanded');
    toggle.textContent = expanded ? '▲ Show less' : '▼ Expand map';
  });

  // Registration modal
  const modal = document.createElement('div');
  modal.className = 'modal-backdrop';
  modal.id = 'registerModal';
  modal.innerHTML = `
    <div class="modal-box">
      <button class="modal-close" id="registerModalClose">&times;</button>
      <h2 id="registerModalTitle">Register for Event</h2>
      <form id="registerForm">
        <div class="form-row">
          <div class="form-group">
            <label for="regFirstName">First Name</label>
            <input type="text" id="regFirstName" placeholder="First name" required />
          </div>
          <div class="form-group">
            <label for="regLastName">Last Name</label>
            <input type="text" id="regLastName" placeholder="Last name" required />
          </div>
        </div>
        <div class="form-group">
          <label for="regEmail">Email</label>
          <input type="email" id="regEmail" placeholder="your@email.com" required />
        </div>
        <div class="form-group">
          <label for="regPhone">Phone</label>
          <input type="tel" id="regPhone" placeholder="(555) 555-5555" />
        </div>
        <button type="submit" class="btn btn-primary full-width">Sign Me Up</button>
      </form>
    </div>`;
  document.body.appendChild(modal);

  let activeEventId = null;

  container.addEventListener('click', e => {
    const btn = e.target.closest('.event-register-btn');
    if (!btn) return;
    activeEventId = btn.dataset.id;
    document.getElementById('registerModalTitle').textContent = `Register — ${btn.dataset.name}`;
    document.getElementById('registerForm').reset();
    document.getElementById('registerForm').style.display = '';
    modal.classList.add('modal-open');
  });

  document.getElementById('registerModalClose').addEventListener('click', () => modal.classList.remove('modal-open'));
  modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('modal-open'); });

  document.getElementById('registerForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const submitBtn = this.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting…';

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId:    activeEventId,
          first_name: document.getElementById('regFirstName').value.trim(),
          last_name:  document.getElementById('regLastName').value.trim(),
          email:      document.getElementById('regEmail').value.trim(),
          phone:      document.getElementById('regPhone').value.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error('Server error');
      this.style.display = 'none';
      this.insertAdjacentHTML('afterend', '<p style="text-align:center;font-size:1.1rem;font-weight:700;color:#1a3a6b;padding:24px 0">You\'re registered! Check your email for confirmation.</p>');
    } catch {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Sign Me Up';
      alert('Something went wrong. Please try again or email us at info@walkerforpa.com');
    }
  });
})();

// Election Day countdown
const electionDate = new Date('2026-11-03T00:00:00');
const cdDays = document.getElementById('cd-days');
const cdHours = document.getElementById('cd-hours');
const cdMinutes = document.getElementById('cd-minutes');
const cdSeconds = document.getElementById('cd-seconds');

if (cdDays) {
  function updateCountdown() {
    const now = new Date();
    const diff = electionDate - now;
    if (diff <= 0) {
      cdDays.textContent = cdHours.textContent = cdMinutes.textContent = cdSeconds.textContent = '0';
      return;
    }
    cdDays.textContent    = Math.floor(diff / 86400000);
    cdHours.textContent   = Math.floor((diff % 86400000) / 3600000);
    cdMinutes.textContent = Math.floor((diff % 3600000) / 60000);
    cdSeconds.textContent = Math.floor((diff % 60000) / 1000);
  }
  updateCountdown();
  setInterval(updateCountdown, 1000);
}

// Volunteer / contact form submission
const volunteerForm = document.getElementById('volunteerForm');
if (volunteerForm) {
  const smsOptIn   = document.getElementById('smsOptIn');
  const mobileInput = document.getElementById('mobile');
  smsOptIn.addEventListener('change', function () {
    mobileInput.required = this.checked;
  });

  volunteerForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    const btn = this.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Submitting…';

    const interests = Array.from(this.querySelectorAll('input[name="interests"]:checked'))
      .map(cb => cb.value);

    const data = {
      firstName: this.firstName.value.trim(),
      lastName:  this.lastName.value.trim(),
      email:     this.email.value.trim(),
      mobile:    this.mobile.value.trim(),
      street:    this.street.value.trim(),
      city:      this.city.value.trim(),
      state:     this.state.value,
      zip:       this.zip.value.trim(),
      interests,
      message:   document.getElementById('volunteerMessage').value.trim(),
      smsOptIn:  smsOptIn.checked,
    };

    try {
      const res = await fetch('/api/volunteer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Server error');
      this.innerHTML = '<p style="text-align:center;font-size:1.2rem;font-weight:700;color:#1a3a6b;padding:32px 0">Thanks for reaching out! The campaign will be in touch soon.</p>';
    } catch {
      btn.disabled = false;
      btn.textContent = 'Count Me In';
      alert('Something went wrong. Please try again or email us at info@walkerforpa.com');
    }
  });
}

// Yard sign form submission
const yardSignForm = document.getElementById('yardSignForm');
if (yardSignForm) {
  yardSignForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    const btn = this.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Submitting…';

    const data = {
      firstName: this.firstName.value.trim(),
      lastName: this.lastName.value.trim(),
      email: this.email.value.trim(),
      mobile: this.mobile.value.trim(),
      street: this.street.value.trim(),
      city: this.city.value.trim(),
      state: this.state.value,
      zip: this.zip.value.trim(),
    };

    try {
      const res = await fetch('/api/yardsign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Server error');
      this.innerHTML = '<p style="text-align:center;font-size:1.2rem;font-weight:700;color:#1a3a6b;padding:32px 0">Request received! A volunteer will be in touch to coordinate delivery.</p>';
    } catch {
      btn.disabled = false;
      btn.textContent = 'Request My Sign';
      alert('Something went wrong. Please try again or email us at info@walkerforpa.com');
    }
  });
}

// Close modals on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-backdrop.modal-open').forEach(m => m.classList.remove('modal-open'));
    document.querySelectorAll('.trail-lightbox.open').forEach(l => l.classList.remove('open'));
  }
});

