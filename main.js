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

// Volunteer form submission (placeholder)
document.getElementById('volunteerForm').addEventListener('submit', function (e) {
  e.preventDefault();
  this.innerHTML = '<p style="text-align:center;font-size:1.2rem;font-weight:700;color:#1a3a6b;padding:32px 0">Thanks for signing up! We\'ll be in touch soon.</p>';
});

// Contact form submission (placeholder)
document.getElementById('contactForm').addEventListener('submit', function (e) {
  e.preventDefault();
  this.innerHTML = '<p style="text-align:center;font-size:1.2rem;font-weight:700;color:#1a3a6b;padding:32px 0">Message sent! The campaign will get back to you shortly.</p>';
});
