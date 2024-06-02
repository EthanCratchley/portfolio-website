document.addEventListener("DOMContentLoaded", function() {
  const fadeIns = document.querySelectorAll('.fade-in');

  const appearOptions = {
      threshold: 0,
      rootMargin: "0px 0px -50px 0px"
  };

  const appearOnScroll = new IntersectionObserver(function(entries, appearOnScroll) {
      entries.forEach(entry => {
          if (!entry.isIntersecting) {
              return;
          } else {
              entry.target.classList.add('fade-in-visible');
              appearOnScroll.unobserve(entry.target);
          }
      });
  }, appearOptions);

  fadeIns.forEach(fadeIn => {
      appearOnScroll.observe(fadeIn);
  });
});
