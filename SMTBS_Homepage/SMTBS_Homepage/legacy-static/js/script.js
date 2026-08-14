const chips = document.querySelectorAll(".chip");
const cards = document.querySelectorAll(".card");

const movieSearch = document.getElementById("movieSearch");
const searchButton = document.getElementById("searchButton");
const noResults = document.getElementById("noResults");

let selectedGenre = "all";

function filterMovies() {
  const searchText = movieSearch.value.trim().toLowerCase();
  let visibleMovies = 0;

  cards.forEach((card) => {
    const cardGenre = card.dataset.genre;
    const cardTitle = card.dataset.title.toLowerCase();

    const matchesGenre =
      selectedGenre === "all" || cardGenre === selectedGenre;

    const matchesSearch =
      searchText === "" || cardTitle.includes(searchText);

    const shouldShow = matchesGenre && matchesSearch;

    card.style.display = shouldShow ? "block" : "none";

    if (shouldShow) {
      visibleMovies += 1;
    }
  });

  noResults.style.display = visibleMovies === 0 ? "block" : "none";
}

chips.forEach((chip) => {
  chip.addEventListener("click", () => {
    chips.forEach((item) => {
      item.classList.remove("active");
    });

    chip.classList.add("active");
    selectedGenre = chip.dataset.genre;

    filterMovies();
  });
});

searchButton.addEventListener("click", () => {
  filterMovies();

  document.getElementById("movies").scrollIntoView({
    behavior: "smooth"
  });
});

movieSearch.addEventListener("input", () => {
  filterMovies();
});

movieSearch.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    filterMovies();

    document.getElementById("movies").scrollIntoView({
      behavior: "smooth"
    });
  }
});

// Staggered fade-in for movie cards as they enter the viewport
if ("IntersectionObserver" in window) {
  const cardObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const index = Array.from(cards).indexOf(entry.target);
          entry.target.style.transitionDelay = `${Math.min(index, 8) * 60}ms`;
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  cards.forEach((card) => cardObserver.observe(card));
} else {
  cards.forEach((card) => card.classList.add("in-view"));
}

const timeButtons = document.querySelectorAll(".time");

timeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const card = button.closest(".card");
    const cardTimes = card.querySelectorAll(".time");

    cardTimes.forEach((time) => {
      time.classList.remove("selected");
    });

    button.classList.add("selected");
  });
});

// Mobile nav toggle
const navToggle = document.querySelector('.nav-toggle');
const mainNav = document.getElementById('mainNav');

if (navToggle && mainNav) {
  navToggle.addEventListener('click', () => {
    const expanded = navToggle.getAttribute('aria-expanded') === 'true';
    const willOpen = !expanded;
    navToggle.setAttribute('aria-expanded', String(willOpen));
    mainNav.classList.toggle('open');
    navToggle.classList.toggle('open');
    navToggle.setAttribute('aria-label', willOpen ? 'Close menu' : 'Open menu');
  });

  // Close mobile nav when a link is clicked
  mainNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      if (mainNav.classList.contains('open')) {
        mainNav.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mainNav.classList.contains('open')) {
      mainNav.classList.remove('open');
      navToggle.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.setAttribute('aria-label', 'Open menu');
      navToggle.focus();
    }
  });

  // Close when clicking outside the menu (overlay background)
  mainNav.addEventListener('click', (e) => {
    if (e.target === mainNav && mainNav.classList.contains('open')) {
      mainNav.classList.remove('open');
      navToggle.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.setAttribute('aria-label', 'Open menu');
    }
  });
}

// Hero slider
const slides = document.querySelectorAll('.hero .slide');
const prevBtn = document.querySelector('.hero-prev');
const nextBtn = document.querySelector('.hero-next');
const indicators = document.querySelectorAll('.indicator');
let currentSlide = 0;
let slideInterval = null;

function goToSlide(n) {
  slides.forEach((s, i) => {
    const isActive = i === n;
    s.classList.toggle('active', isActive);
    s.setAttribute('aria-hidden', isActive ? 'false' : 'true');
  });
  indicators.forEach((ind, i) => {
    ind.classList.toggle('active', i === n);
    ind.setAttribute('aria-selected', i === n ? 'true' : 'false');
  });
  currentSlide = n;
}

function nextSlide() {
  goToSlide((currentSlide + 1) % slides.length);
}

function prevSlide() {
  goToSlide((currentSlide - 1 + slides.length) % slides.length);
}

if (slides.length > 0) {
  goToSlide(0);
  slideInterval = setInterval(nextSlide, 6000);

  if (nextBtn) nextBtn.addEventListener('click', () => { clearInterval(slideInterval); nextSlide(); });
  if (prevBtn) prevBtn.addEventListener('click', () => { clearInterval(slideInterval); prevSlide(); });

  indicators.forEach((ind) => {
    ind.addEventListener('click', (e) => {
      const idx = Number(ind.dataset.slide);
      const target = ind.dataset.target;
      clearInterval(slideInterval);
      goToSlide(idx);

      if (target) {
        const el = document.querySelector(target);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('card-highlight');
          setTimeout(() => el.classList.remove('card-highlight'), 1600);
        }
      }
    });
  });
}

// ---------- Theme toggle (dark mode) ----------
const themeToggle = document.getElementById('themeToggle');
const rootEl = document.documentElement;

function syncThemeToggleUI() {
  if (!themeToggle) return;
  const isDark = rootEl.getAttribute('data-theme') === 'dark';
  themeToggle.setAttribute('aria-pressed', String(isDark));
  themeToggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
  const icon = themeToggle.querySelector('.theme-icon');
  if (icon) icon.textContent = isDark ? '☀️' : '🌙';
}

if (themeToggle) {
  syncThemeToggleUI();

  themeToggle.addEventListener('click', () => {
    const isDark = rootEl.getAttribute('data-theme') === 'dark';

    if (isDark) {
      rootEl.removeAttribute('data-theme');
    } else {
      rootEl.setAttribute('data-theme', 'dark');
    }

    try {
      localStorage.setItem('smtbs-theme', isDark ? 'light' : 'dark');
    } catch (e) {
      /* localStorage unavailable (e.g. private browsing) — theme just won't persist */
    }

    syncThemeToggleUI();
  });
}

// ---------- Toast notifications ----------
const toastEl = document.getElementById('toast');
let toastTimeout = null;

function showToast(message) {
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toastEl.classList.remove('show'), 3200);
}

// ---------- Generic modal helpers ----------
function openModal(overlay) {
  if (!overlay) return;
  overlay.hidden = false;
  document.body.classList.add('modal-open');
  const focusable = overlay.querySelector(
    'button, input, [href], select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  if (focusable) focusable.focus();
}

function closeModal(overlay) {
  if (!overlay) return;
  overlay.hidden = true;
  document.body.classList.remove('modal-open');
}

document.querySelectorAll('.modal-overlay').forEach((overlay) => {
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal(overlay);
  });
});

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  document.querySelectorAll('.modal-overlay:not([hidden])').forEach((overlay) => closeModal(overlay));
});

// ---------- Booking modal ----------
const bookingModal = document.getElementById('bookingModal');
const bookingModalClose = document.getElementById('bookingModalClose');
const bookingView = document.getElementById('bookingView');
const bookingSuccess = document.getElementById('bookingSuccess');
const bookingPoster = document.getElementById('bookingPoster');
const bookingModalTitle = document.getElementById('bookingModalTitle');
const bookingMeta = document.getElementById('bookingMeta');
const bookingTimesEl = document.getElementById('bookingTimes');
const seatMapEl = document.getElementById('seatMap');
const seatCountEl = document.getElementById('seatCount');
const bookingTotalEl = document.getElementById('bookingTotal');
const confirmBookingBtn = document.getElementById('confirmBooking');
const closeSuccessBtn = document.getElementById('closeSuccess');
const bookingRefEl = document.getElementById('bookingRef');
const successDetailsEl = document.getElementById('successDetails');

const SEAT_ROWS = ['A', 'B', 'C', 'D', 'E', 'F'];
const SEATS_PER_ROW = 8;
const MAX_SEATS = 6;

let selectedTime = '';
let selectedSeats = [];
let ticketPrice = 12;
let currentMovieTitle = '';

function parsePrice(text) {
  const match = text.match(/\d+(\.\d+)?/);
  return match ? Number(match[0]) : 12;
}

function updateBookingSummary() {
  seatCountEl.textContent = String(selectedSeats.length);
  bookingTotalEl.textContent = `$${selectedSeats.length * ticketPrice}`;
  confirmBookingBtn.disabled = selectedSeats.length === 0 || !selectedTime;
}

function toggleSeat(seat) {
  const seatId = seat.dataset.seat;
  const isSelected = selectedSeats.includes(seatId);

  if (isSelected) {
    selectedSeats = selectedSeats.filter((s) => s !== seatId);
    seat.classList.remove('is-selected');
  } else {
    if (selectedSeats.length >= MAX_SEATS) {
      showToast(`You can select up to ${MAX_SEATS} seats`);
      return;
    }
    selectedSeats.push(seatId);
    seat.classList.add('is-selected');
  }

  updateBookingSummary();
}

function buildSeatMap() {
  seatMapEl.innerHTML = '';
  selectedSeats = [];

  SEAT_ROWS.forEach((row) => {
    for (let i = 1; i <= SEATS_PER_ROW; i += 1) {
      const seatId = `${row}${i}`;
      const seat = document.createElement('button');
      seat.type = 'button';
      seat.className = 'seat';
      seat.textContent = seatId;
      seat.dataset.seat = seatId;
      seat.setAttribute('aria-label', `Seat ${seatId}`);

      if (Math.random() < 0.18) {
        seat.disabled = true;
        seat.setAttribute('aria-label', `Seat ${seatId}, taken`);
      }

      seat.addEventListener('click', () => toggleSeat(seat));
      seatMapEl.appendChild(seat);
    }
  });

  updateBookingSummary();
}

function buildBookingTimes(times) {
  bookingTimesEl.innerHTML = '';
  selectedTime = '';

  times.forEach((time, index) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'booking-time';
    btn.textContent = time;

    if (index === 0) {
      btn.classList.add('selected');
      selectedTime = time;
    }

    btn.addEventListener('click', () => {
      bookingTimesEl.querySelectorAll('.booking-time').forEach((b) => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedTime = time;
      updateBookingSummary();
    });

    bookingTimesEl.appendChild(btn);
  });

  updateBookingSummary();
}

function addSuccessDetail(label, value) {
  const row = document.createElement('div');
  const dt = document.createElement('dt');
  dt.textContent = label;
  const dd = document.createElement('dd');
  dd.textContent = value;
  row.append(dt, dd);
  successDetailsEl.appendChild(row);
}

function openBookingModal(trigger) {
  const card = trigger.closest('.card');
  const featured = trigger.closest('.featured-movie');
  const context = card || featured;
  if (!context) return;

  const title = context.querySelector('h2, h3')?.textContent.trim() || 'Selected movie';
  const poster = context.querySelector('img')?.src || '';

  let times = [];
  let priceText = '$12';
  let metaText = '';

  if (card) {
    metaText = card.querySelector('.meta')?.textContent.trim() || '';
    times = Array.from(card.querySelectorAll('.time')).map((t) => t.textContent.trim());
    priceText = card.querySelector('.price strong')?.textContent.trim() || '$12';
  } else {
    metaText = featured.querySelector('.featured-meta')?.textContent.trim() || '';
    const infoStrongs = featured.querySelectorAll('.featured-information strong');
    const showtimesText = infoStrongs[0]?.textContent.trim() || '';
    times = showtimesText.split('·').map((t) => t.trim()).filter(Boolean);
    priceText = infoStrongs[1]?.textContent.trim() || '$12';
  }

  currentMovieTitle = title;
  ticketPrice = parsePrice(priceText);

  bookingPoster.src = poster;
  bookingPoster.alt = `${title} poster`;
  bookingModalTitle.textContent = title;
  bookingMeta.textContent = metaText;

  buildBookingTimes(times.length ? times : ['7:00 PM']);
  buildSeatMap();

  bookingView.hidden = false;
  bookingSuccess.hidden = true;

  openModal(bookingModal);
}

document.querySelectorAll('.card-button, .featured-button').forEach((btn) => {
  btn.addEventListener('click', () => openBookingModal(btn));
});

if (bookingModalClose) {
  bookingModalClose.addEventListener('click', () => closeModal(bookingModal));
}

if (confirmBookingBtn) {
  confirmBookingBtn.addEventListener('click', () => {
    const ref = `SMTBS-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    bookingRefEl.textContent = ref;

    successDetailsEl.innerHTML = '';
    addSuccessDetail('Movie', currentMovieTitle);
    addSuccessDetail('Showtime', selectedTime);
    addSuccessDetail('Seats', selectedSeats.join(', '));
    addSuccessDetail('Total paid', `$${selectedSeats.length * ticketPrice}`);

    bookingView.hidden = true;
    bookingSuccess.hidden = false;
  });
}

if (closeSuccessBtn) {
  closeSuccessBtn.addEventListener('click', () => closeModal(bookingModal));
}

// ---------- Login modal ----------
const loginModal = document.getElementById('loginModal');
const loginTrigger = document.getElementById('loginTrigger');
const loginModalClose = document.getElementById('loginModalClose');
const loginForm = document.getElementById('loginForm');

if (loginTrigger) {
  loginTrigger.addEventListener('click', () => openModal(loginModal));
}

if (loginModalClose) {
  loginModalClose.addEventListener('click', () => closeModal(loginModal));
}

if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();

    if (!loginForm.checkValidity()) {
      loginForm.reportValidity();
      return;
    }

    const email = loginForm.email.value;
    closeModal(loginModal);
    loginForm.reset();
    showToast(`Signed in as ${email} (demo only)`);
  });
}

// ---------- Scroll to top ----------
const scrollTopBtn = document.getElementById('scrollTop');

if (scrollTopBtn) {
  scrollTopBtn.hidden = false;

  window.addEventListener(
    'scroll',
    () => {
      scrollTopBtn.classList.toggle('show', window.scrollY > 600);
    },
    { passive: true }
  );

  scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}