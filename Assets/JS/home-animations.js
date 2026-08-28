(function () {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const visualSelector = [
        ".hero-stats article",
        ".info-card",
        ".module-grid article",
        ".role-grid a"
    ].join(",");

    document.querySelectorAll(visualSelector).forEach((element, index) => {
        element.classList.add("visual-animate");

        if (!reducedMotion) {
            element.style.transitionDelay = `${Math.min(index * 45, 260)}ms`;
            setTimeout(() => {
                element.style.transitionDelay = "";
            }, 720);
        }

        element.addEventListener("mouseenter", () => {
            element.classList.add("is-hovered");
        });

        element.addEventListener("mouseleave", () => {
            element.classList.remove("is-hovered");
        });

        requestAnimationFrame(() => {
            element.classList.add("is-visible");
        });
    });
})();
