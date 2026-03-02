(function () {
  "use strict";

  /**
   * Apply .scrolled class to the body as the page is scrolled down
   */
  function toggleScrolled() {
    const selectBody = document.querySelector("body");
    const selectHeader = document.querySelector("#header");
    if (!selectHeader || !selectBody) return; // <-- guard

    if (
      !selectHeader.classList.contains("scroll-up-sticky") &&
      !selectHeader.classList.contains("sticky-top") &&
      !selectHeader.classList.contains("fixed-top")
    )
      return;

    window.scrollY > 100
      ? selectBody.classList.add("scrolled")
      : selectBody.classList.remove("scrolled");
  }

  document.addEventListener("scroll", toggleScrolled);
  window.addEventListener("load", toggleScrolled);

  /**
   * Mobile nav toggle
   */
  const mobileNavToggleBtn = document.querySelector(".mobile-nav-toggle");

  function mobileNavToggle() {
    const body = document.querySelector("body");
    if (!body || !mobileNavToggleBtn) return;

    body.classList.toggle("mobile-nav-active");
    mobileNavToggleBtn.classList.toggle("bi-list");
    mobileNavToggleBtn.classList.toggle("bi-x");
  }

  if (mobileNavToggleBtn) {
    mobileNavToggleBtn.addEventListener("click", mobileNavToggle);
  }

  /**
   * Hide mobile nav on same-page/hash links
   */
  document.querySelectorAll("#navmenu a").forEach((navmenu) => {
    navmenu.addEventListener("click", () => {
      if (document.querySelector(".mobile-nav-active")) {
        mobileNavToggle();
      }
    });
  });

  /**
   * Toggle mobile nav dropdowns
   */
  document.querySelectorAll(".navmenu .toggle-dropdown").forEach((navmenu) => {
    navmenu.addEventListener("click", function (e) {
      e.preventDefault();
      this.parentNode?.classList.toggle("active");
      this.parentNode?.nextElementSibling?.classList.toggle("dropdown-active");
      e.stopImmediatePropagation();
    });
  });

  /**
   * Preloader
   */
  const preloader = document.querySelector("#preloader");
  if (preloader) {
    window.addEventListener("load", () => {
      preloader.remove();
    });
  }

  /**
   * Scroll top button
   */
  const scrollTop = document.querySelector(".scroll-top");
  if (scrollTop) {
    function toggleScrollTop() {
      window.scrollY > 100
        ? scrollTop.classList.add("active")
        : scrollTop.classList.remove("active");
    }

    scrollTop.addEventListener("click", (e) => {
      e.preventDefault();
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    });

    window.addEventListener("load", toggleScrollTop);
    document.addEventListener("scroll", toggleScrollTop);
  }

  /**
   * Animation on scroll function and init
   */
  function aosInit() {
    if (typeof AOS !== "undefined") {
      AOS.init({
        duration: 600,
        easing: "ease-in-out",
        once: true,
        mirror: false,
      });
    }
  }
  window.addEventListener("load", aosInit);

  /**
   * Initiate glightbox
   */
  if (typeof GLightbox !== "undefined") {
    const glightbox = GLightbox({
      selector: ".glightbox",
    });
  }

  /**
   * Initiate Pure Counter
   */
  if (typeof PureCounter !== "undefined") {
    new PureCounter();
  }

  /**
   * Init swiper sliders
   */
  function initSwiper() {
    document.querySelectorAll(".init-swiper").forEach(function (swiperElement) {
      const configEl = swiperElement.querySelector(".swiper-config");
      if (!configEl) return;
      let config = JSON.parse(configEl.innerHTML.trim());

      if (swiperElement.classList.contains("swiper-tab")) {
        if (typeof initSwiperWithCustomPagination === "function") {
          initSwiperWithCustomPagination(swiperElement, config);
        }
      } else {
        if (typeof Swiper !== "undefined") new Swiper(swiperElement, config);
      }
    });
  }
  window.addEventListener("load", initSwiper);

  /**
   * Frequently Asked Questions Toggle
   */
  document.querySelectorAll(".faq-item h3, .faq-item .faq-toggle, .faq-item .faq-header").forEach((faqItem) => {
    faqItem.addEventListener("click", () => {
      faqItem.parentNode?.classList.toggle("faq-active");
    });
  });
})();