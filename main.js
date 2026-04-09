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
navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => navLinks.classList.remove('open'));
});

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
      phone: this.phone.value.trim(),
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
      phone: this.phone.value.trim(),
      address: this.address.value.trim(),
      city: this.city.value.trim(),
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
  contactForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    const btn = this.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Sending…';

    const data = {
      name: this.elements['name'].value.trim(),
      email: this.elements['email'].value.trim(),
      message: this.elements['message'].value.trim(),
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
