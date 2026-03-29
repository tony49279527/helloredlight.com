import './style.css'

// 1. Reveal on Scroll Animation
const setupRevealAnimations = () => {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -20px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('reveal-visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.animate-reveal').forEach((el) => {
    observer.observe(el);
  });
};

// 2. Product Detail Tab Switching
const setupProductTabs = () => {
  const tabButtons = document.querySelectorAll('[aria-label="Tabs"] button, [aria-label="Tabs"] a[data-tab-target]');
  if (tabButtons.length === 0) return;

  const tabContentBlocks = document.querySelectorAll('.tab-content-block');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = btn.getAttribute('data-tab-target');
      if (!targetId) return;

      // Update button styles
      tabButtons.forEach(b => {
        b.classList.remove('border-brand-primary', 'text-brand-primary', 'active-tab');
        b.classList.add('border-transparent', 'text-gray-500');
      });
      btn.classList.add('border-brand-primary', 'text-brand-primary', 'active-tab');
      btn.classList.remove('border-transparent', 'text-gray-500');

      // Update content visibility
      tabContentBlocks.forEach(block => {
        if (block.id === targetId) {
          block.classList.remove('hidden');
          block.classList.add('animate-reveal', 'reveal-visible');
        } else {
          block.classList.add('hidden');
        }
      });
    });
  });
};

// 3. Initialize Everything
document.addEventListener('DOMContentLoaded', () => {
  setupRevealAnimations();
  setupProductTabs();
  
  // Clean up any vite leftover app element if it exists
  const app = document.querySelector('#app');
  if (app && app.innerHTML.includes('Vite logo')) {
    app.style.display = 'none';
  }
});
