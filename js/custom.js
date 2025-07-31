

// gsap animation start
gsap.registerPlugin(ScrollTrigger, ScrollSmoother);


ScrollTrigger.normalizeScroll(true)

// create the smooth scroller FIRST!
let smoother = ScrollSmoother.create({
    smooth: 2,
    effects: true,
    normalizeScroll: true
});

// testti tabs

document.querySelectorAll('.test-tabs').forEach(tab => {
  tab.addEventListener('click', function() {
      // Remove active class from all tabs and hide all content
      document.querySelectorAll('.test-tabs').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.content').forEach(c => c.classList.remove('active'));
      
      // Add active class to the clicked tab
      this.classList.add('active');
      
      // Show content associated with the active tab
      let tabId = this.getAttribute('data-tab');
      document.querySelector(`.content[data-tab-content="${tabId}"]`).classList.add('active');
  });
});

// Set the first tab and its content as active by default
const accordions = document.querySelectorAll(".accordion");

accordions.forEach((accordion, index) => {
  const header = accordion.querySelector(".accordion__header");
  const content = accordion.querySelector(".accordion__content");
  const icon = accordion.querySelector(".accordion__icon i");

  header.addEventListener("click", () => {
    const isOpen = content.style.height === `${content.scrollHeight}px`;

    accordions.forEach((a, i) => {
      const c = a.querySelector(".accordion__content");
      const ic = a.querySelector(".accordion__icon i");

      if (i === index) {
        c.style.height = isOpen ? "0px" : `${c.scrollHeight}px`;
        ic.classList.toggle("fa-plus", isOpen);
        ic.classList.toggle("fa-minus", !isOpen);
      } else {
        c.style.height = "0px";
        ic.classList.remove("fa-minus");
        ic.classList.add("fa-plus");
      }
    });
  });
});

const navItem = document.querySelector('.nav-item');
const icon = document.querySelector('#service-icon');

navItem.addEventListener('mouseenter', () => {
    icon.classList.remove('fa-chevron-down');
    icon.classList.add('fa-chevron-up');
});

navItem.addEventListener('mouseleave', () => {
    icon.classList.remove('fa-chevron-up');
    icon.classList.add('fa-chevron-down');
});
  
  

