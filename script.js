document.addEventListener("DOMContentLoaded", function () {
    const fadeInElements = document.querySelectorAll(".fade-in");

    const observer = new IntersectionObserver(
        (entries, observer) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("visible");
                    observer.unobserve(entry.target); // Stops observing once visible
                }
            });
        },
        {
            threshold: 0.2, // Triggers when 20% of the element is visible
        }
    );

    fadeInElements.forEach((element) => {
        observer.observe(element);
    });
});
