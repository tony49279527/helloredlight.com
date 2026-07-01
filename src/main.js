import './style.css'

// 1. Reveal on Scroll Animation
const setupRevealAnimations = () => {
  const elements = document.querySelectorAll('.animate-reveal');
  if (elements.length === 0) return;

  if (
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
    !('IntersectionObserver' in window)
  ) {
    elements.forEach((el) => el.classList.add('reveal-visible'));
    return;
  }

  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -20px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.remove('reveal-pending');
        entry.target.classList.add('reveal-visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  elements.forEach((el) => {
    if (el.getBoundingClientRect().top > window.innerHeight * 0.9) {
      el.classList.add('reveal-pending');
    }
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

const normalizePath = (pathname) => pathname.replace(/\/index\.html$/, '/').replace(/\.html$/, '');

const pushAnalyticsEvent = (eventName, payload = {}) => {
  window.dataLayer = window.dataLayer || [];
  const eventPayload = {
    event: eventName,
    page_path: normalizePath(window.location.pathname) || '/',
    page_title: document.title,
    page_language: document.documentElement.lang || 'en',
    ...payload
  };

  window.dataLayer.push(eventPayload);
  document.dispatchEvent(new CustomEvent(`analytics:${eventName}`, { detail: eventPayload }));
};

const getTrackedParams = () => {
  const sourceParams = new URLSearchParams(window.location.search);
  const tracked = {};
  [
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_term',
    'utm_content',
    'gclid',
    'fbclid',
    'sku',
    'intent',
    'source_page',
    'source_title',
    'cta_label'
  ].forEach((key) => {
    const value = sourceParams.get(key);
    if (value) {
      tracked[key] = value;
    }
  });
  return tracked;
};

const appendHiddenField = (form, name, value) => {
  if (!value) return;

  let input = form.querySelector(`input[name="${name}"]`);
  if (!input) {
    input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    form.appendChild(input);
  }

  input.value = value;
};

const setupLeadTrackingLinks = () => {
  const contactLinks = document.querySelectorAll('a[href]');
  const trackedParams = getTrackedParams();
  const sourcePage = normalizePath(window.location.pathname) || '/';
  const sourceTitle = document.title;

  contactLinks.forEach((link) => {
    const href = link.getAttribute('href');
    if (!href || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('#')) {
      return;
    }

    const url = new URL(href, window.location.origin);
    const isContactPage = /^\/(zh\/)?contact(?:\.html)?$/.test(url.pathname.replace(/^\//, '')) ||
      /^\/(zh\/)?contact(?:\.html)?$/.test(url.pathname);

    if (!isContactPage) return;

    Object.entries(trackedParams).forEach(([key, value]) => {
      if (!url.searchParams.has(key)) {
        url.searchParams.set(key, value);
      }
    });

    if (!url.searchParams.has('source_page')) {
      url.searchParams.set('source_page', sourcePage);
    }
    if (!url.searchParams.has('source_title')) {
      url.searchParams.set('source_title', sourceTitle);
    }

    const ctaLabel = (link.dataset.ctaLabel || link.textContent || link.title || '').trim().replace(/\s+/g, ' ');
    if (ctaLabel && !url.searchParams.has('cta_label')) {
      url.searchParams.set('cta_label', ctaLabel);
    }

    const finalHref = `${url.pathname}${url.search}${url.hash}`;
    link.setAttribute('href', finalHref);
  });
};

const setupContactForms = () => {
  const forms = document.querySelectorAll('form[action*="web3forms.com/submit"]');
  if (forms.length === 0) return;

  const trackedParams = getTrackedParams();
  const lang = document.documentElement.lang || 'en';
  const isChinese = lang.toLowerCase().startsWith('zh');
  const thankYouPath = isChinese ? '/zh/thank-you' : '/thank-you';
  const pageUrl = window.location.href;
  const sourcePage = trackedParams.source_page || normalizePath(window.location.pathname) || '/';
  const sourceTitle = trackedParams.source_title || document.title;

  forms.forEach((form) => {
    appendHiddenField(form, 'redirect', `${window.location.origin}${thankYouPath}`);
    appendHiddenField(form, 'page_url', pageUrl);
    appendHiddenField(form, 'source_page', sourcePage);
    appendHiddenField(form, 'source_title', sourceTitle);
    appendHiddenField(form, 'referrer', document.referrer || 'direct');
    appendHiddenField(form, 'form_locale', lang);

    Object.entries(trackedParams).forEach(([key, value]) => {
      appendHiddenField(form, key, value);
    });

    const categorySelect = form.querySelector('select[name="product_category"]');
    if (categorySelect && trackedParams.sku && !categorySelect.value) {
      if (trackedParams.sku.includes('MASK')) {
        categorySelect.value = 'masks';
      } else if (trackedParams.sku.includes('LUXOR') || trackedParams.sku.includes('BED')) {
        categorySelect.value = isChinese ? 'beds' : 'pods';
      } else if (trackedParams.sku.includes('PRO') || trackedParams.sku.includes('PANEL')) {
        categorySelect.value = 'panels';
      }
    }

    const textarea = form.querySelector('textarea[name="message"]');
    if (textarea && !textarea.value.trim()) {
      const sku = trackedParams.sku;
      const intent = trackedParams.intent;
      const lines = [];

      if (sku) {
        lines.push(isChinese ? `意向产品 SKU: ${sku}` : `Interested SKU: ${sku}`);
      }
      if (intent) {
        lines.push(isChinese ? `咨询意图: ${intent}` : `Inquiry intent: ${intent}`);
      }

      if (lines.length > 0) {
        textarea.value = `${lines.join('\n')}\n`;
      }
    }

    const keyInput = form.querySelector('input[name="access_key"]');
    const hasPlaceholderKey = keyInput && keyInput.value === 'YOUR_ACCESS_KEY_HERE';
    if (hasPlaceholderKey) {
      let status = form.querySelector('[data-form-status]');
      if (!status) {
        status = document.createElement('div');
        status.dataset.formStatus = 'true';
        status.className = 'form-status-warning';
        form.prepend(status);
      }

      status.textContent = isChinese
        ? '当前页面已经保留询盘来源与产品意图，但正式发送仍需补入 Web3Forms access key。未配置前，请同时通过邮箱接收询盘。'
        : 'Lead source tracking is active, but the final form delivery still requires a valid Web3Forms access key. Until then, use the email on this page as the fallback channel.';
    } else {
      return;
    }

    form.addEventListener('submit', (event) => {
      event.preventDefault();

      let status = form.querySelector('[data-form-status]');
      if (!status) {
        status = document.createElement('div');
        status.dataset.formStatus = 'true';
        status.className = 'form-status-warning';
        form.prepend(status);
      }

      status.textContent = isChinese
        ? '表单发送配置尚未完成。请暂时使用页面中的邮箱联系，或补入 Web3Forms access key 后启用表单。'
        : 'The inquiry form is not configured yet. Please use the email on this page for now, or add a valid Web3Forms access key to enable submissions.';

      pushAnalyticsEvent('lead_form_submit_blocked', {
        form_type: form.closest('#distributor') ? 'distributor' : 'inquiry',
        sku: trackedParams.sku || '',
        intent: trackedParams.intent || ''
      });
    }, { once: true });
  });
};

const setupContactContext = () => {
  const formTabs = document.querySelector('#form-tabs');
  if (!formTabs) return;

  const trackedParams = getTrackedParams();
  if (!trackedParams.sku && !trackedParams.intent && !trackedParams.source_title) return;

  const isChinese = (document.documentElement.lang || 'en').toLowerCase().startsWith('zh');
  const card = document.createElement('div');
  card.className = 'contact-context-card';

  const parts = [];
  if (trackedParams.sku) {
    parts.push(isChinese ? `意向 SKU: ${trackedParams.sku}` : `Interested SKU: ${trackedParams.sku}`);
  }
  if (trackedParams.intent) {
    parts.push(isChinese ? `需求类型: ${trackedParams.intent}` : `Request type: ${trackedParams.intent}`);
  }
  if (trackedParams.source_title) {
    parts.push(isChinese ? `来源页面: ${trackedParams.source_title}` : `Source page: ${trackedParams.source_title}`);
  }

  card.innerHTML = `
    <div class="contact-context-eyebrow">${isChinese ? '已捕获询盘上下文' : 'Inquiry context captured'}</div>
    <div class="contact-context-copy">${parts.join(' · ')}</div>
  `;

  formTabs.parentNode.insertBefore(card, formTabs);
};

const setupMobileNavigation = () => {
  const desktopNav = document.querySelector('header nav.hidden.md\\:flex');
  const headerBar = document.querySelector('header > div');
  const header = document.querySelector('header');

  if (!desktopNav || !headerBar || !header || header.querySelector('.mobile-nav-toggle')) {
    return;
  }

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'mobile-nav-toggle md:hidden';
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-label', 'Open navigation menu');
  toggle.innerHTML = `
    <span class="mobile-nav-toggle-bar"></span>
    <span class="mobile-nav-toggle-bar"></span>
    <span class="mobile-nav-toggle-bar"></span>
  `;

  const panel = document.createElement('div');
  panel.className = 'mobile-nav-panel md:hidden';
  panel.setAttribute('hidden', '');

  const panelBody = document.createElement('div');
  panelBody.className = 'mobile-nav-panel-body';

  desktopNav.querySelectorAll('a[href]').forEach((link) => {
    const item = link.cloneNode(true);
    item.className = 'mobile-nav-link';
    panelBody.appendChild(item);
  });

  panel.appendChild(panelBody);
  headerBar.appendChild(toggle);
  header.appendChild(panel);

  const closeMenu = () => {
    toggle.setAttribute('aria-expanded', 'false');
    panel.setAttribute('hidden', '');
    document.body.classList.remove('mobile-nav-open');
  };

  toggle.addEventListener('click', () => {
    const isOpen = toggle.getAttribute('aria-expanded') === 'true';
    if (isOpen) {
      closeMenu();
      pushAnalyticsEvent('mobile_nav_close');
      return;
    }

    toggle.setAttribute('aria-expanded', 'true');
    panel.removeAttribute('hidden');
    document.body.classList.add('mobile-nav-open');
    pushAnalyticsEvent('mobile_nav_open');
  });

  panel.addEventListener('click', (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      closeMenu();
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth >= 768) {
      closeMenu();
    }
  });
};

const setupMobileCta = () => {
  if (document.querySelector('.sticky-mobile-cta')) return;

  const path = normalizePath(window.location.pathname);
  if (path.includes('/contact') || path.includes('/thank-you')) return;

  const isChinese = (document.documentElement.lang || 'en').toLowerCase().startsWith('zh');
  const wrapper = document.createElement('div');
  wrapper.className = 'sticky-mobile-cta';

  const primary = document.createElement('a');
  primary.href = isChinese ? '/zh/contact.html?intent=mobile-cta' : '/contact.html?intent=mobile-cta';
  primary.className = 'flex-grow btn btn-primary text-sm py-3 shadow-lg uppercase tracking-wider';
  primary.textContent = isChinese ? '立即询价' : 'Inquire Now';

  const secondary = document.createElement('a');
  secondary.href = 'https://wa.me/8618309285711';
  secondary.className = 'btn btn-secondary px-4 py-3';
  secondary.textContent = 'WA';
  secondary.title = isChinese ? 'WhatsApp 沟通' : 'WhatsApp chat';

  wrapper.append(primary, secondary);
  document.body.appendChild(wrapper);
};

const setupAnalyticsTracking = () => {
  const trackedParams = getTrackedParams();
  pushAnalyticsEvent('page_view_custom', {
    sku: trackedParams.sku || '',
    intent: trackedParams.intent || '',
    source_page: trackedParams.source_page || ''
  });

  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target.closest('a, button') : null;
    if (!target) return;

    const label = (target.textContent || target.getAttribute('title') || '').trim().replace(/\s+/g, ' ');
    const href = target instanceof HTMLAnchorElement ? target.getAttribute('href') || '' : '';

    if (href.includes('/contact')) {
      pushAnalyticsEvent('lead_cta_click', { cta_label: label, href });
      return;
    }

    if (href.startsWith('https://wa.me/')) {
      pushAnalyticsEvent('whatsapp_click', { cta_label: label, href });
      return;
    }

    if (href.startsWith('mailto:')) {
      pushAnalyticsEvent('email_click', { cta_label: label, href });
      return;
    }

    if (href.includes('/resources')) {
      pushAnalyticsEvent('resource_center_click', { cta_label: label, href });
    }
  });
};

// 3. Initialize Everything
document.addEventListener('DOMContentLoaded', () => {
  setupRevealAnimations();
  setupProductTabs();
  setupAnalyticsTracking();
  setupLeadTrackingLinks();
  setupContactForms();
  setupContactContext();
  setupMobileNavigation();
  setupMobileCta();

  // Clean up any vite leftover app element if it exists
  const app = document.querySelector('#app');
  if (app && app.innerHTML.includes('Vite logo')) {
    app.style.display = 'none';
  }
});
