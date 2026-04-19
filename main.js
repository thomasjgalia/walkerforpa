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
    const btn      = ev.event_url
      ? `<div class="event-actions"><a href="${ev.event_url}" target="_blank" rel="noopener" class="btn btn-primary">Details</a></div>`
      : '';
    return `
      <div class="event-card">
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
        ${btn}
      </div>`;
  }).join('');
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

// Volunteer form submission
const volunteerForm = document.getElementById('volunteerForm');
if (volunteerForm) {
  volunteerForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    const btn = this.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Submitting…';

    const interests = Array.from(this.querySelectorAll('input[name="interests"]:checked'))
      .map(cb => cb.value);

    const data = {
      firstName: this.firstName.value.trim(),
      lastName: this.lastName.value.trim(),
      email: this.email.value.trim(),
      mobile: this.mobile.value.trim(),
      street: this.street.value.trim(),
      city: this.city.value.trim(),
      state: this.state.value,
      zip: this.zip.value.trim(),
      interests,
    };

    try {
      const res = await fetch('/api/volunteer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Server error');
      this.innerHTML = '<p style="text-align:center;font-size:1.2rem;font-weight:700;color:#1a3a6b;padding:32px 0">Thanks for signing up! We\'ll be in touch soon.</p>';
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
  }
});

// Contact form submission
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  const smsOptIn = document.getElementById('smsOptIn');
  const mobileInput = document.getElementById('mobile');

  smsOptIn.addEventListener('change', function () {
    mobileInput.required = this.checked;
  });

  contactForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    const btn = this.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Sending…';

    const data = {
      firstName: this.firstName.value.trim(),
      lastName: this.lastName.value.trim(),
      email: this.elements['email'].value.trim(),
      mobile: this.mobile.value.trim(),
      street: this.street.value.trim(),
      city: this.city.value.trim(),
      state: this.state.value,
      zip: this.zip.value.trim(),
      message: this.elements['message'].value.trim(),
      smsOptIn: smsOptIn.checked,
    };

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Server error');
      this.innerHTML = '<p style="text-align:center;font-size:1.2rem;font-weight:700;color:#1a3a6b;padding:32px 0">Message sent! The campaign will get back to you shortly.</p>';
    } catch {
      btn.disabled = false;
      btn.textContent = 'Send Message';
      alert('Something went wrong. Please try again or email us at info@walkerforpa.com');
    }
  });
}
