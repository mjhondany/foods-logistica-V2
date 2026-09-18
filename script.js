document.addEventListener('DOMContentLoaded', () => {
    const loader = document.getElementById('loader-wrapper');
    const header = document.getElementById('site-header');
    const hero = document.querySelector('.hero-premium');
    const slides = [...document.querySelectorAll('.hero-slider .slide')];
    const interactiveImages = [...document.querySelectorAll('.interactive-image')];
    const letters = [...document.querySelectorAll('.interactive-letter')];
    const status = document.querySelector('.slider-status strong');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    window.addEventListener('load', () => loader?.classList.add('loader-hidden'), { once: true });

    if (header) {
        const updateHeader = () => header.classList.toggle('is-scrolled', window.scrollY > 24);
        updateHeader();
        window.addEventListener('scroll', updateHeader, { passive: true });
    }

    if (!hero || !slides.length) return;

    let currentSlide = 0;
    let currentImage = 0;
    let timer = null;
    let pointerRaf = 0;
    let pendingX = 0;
    let pendingY = 0;

    const setSlide = (index, syncInteractive = false) => {
        currentSlide = (index + slides.length) % slides.length;
        slides.forEach((slide, i) => slide.classList.toggle('active', i === currentSlide));
        if (status) status.textContent = String(currentSlide + 1).padStart(2, '0');
        if (syncInteractive && interactiveImages.length) setImage(currentSlide % interactiveImages.length, false);
    };

    const setImage = (index, highlightLetter = true) => {
        if (!interactiveImages.length) return;
        currentImage = (index + interactiveImages.length) % interactiveImages.length;
        interactiveImages.forEach((image, i) => image.classList.toggle('active', i === currentImage));
        if (highlightLetter) letters.forEach(letter => letter.classList.toggle('is-active', Number(letter.dataset.image) === currentImage));
        if (status) status.textContent = String(currentImage + 1).padStart(2, '0');
    };

    const stopTimer = () => { if (timer) { clearInterval(timer); timer = null; } };
    const startTimer = () => {
        stopTimer();
        if (reduceMotion || slides.length < 2) return;
        timer = setInterval(() => setSlide(currentSlide + 1, false), 5000);
    };

    const updateFromPointer = () => {
        pointerRaf = 0;
        const rect = hero.getBoundingClientRect();
        const x = Math.max(0, Math.min(rect.width, pendingX - rect.left));
        const ratio = rect.width ? x / rect.width : 0;
        const index = Math.min(letters.length - 1, Math.floor(ratio * letters.length));
        if (index >= 0 && letters.length) {
            const imageIndex = Number(letters[index].dataset.image || 0);
            setImage(imageIndex, true);
            stopTimer();
        }
    };

    if (finePointer && interactiveImages.length && letters.length) {
        hero.classList.add('interactive-ready');
        hero.addEventListener('pointermove', event => {
            pendingX = event.clientX;
            pendingY = event.clientY;
            if (!pointerRaf) pointerRaf = requestAnimationFrame(updateFromPointer);
        }, { passive: true });
        hero.addEventListener('pointerleave', () => {
            letters.forEach(letter => letter.classList.remove('is-active'));
            setImage(currentSlide % interactiveImages.length, false);
            startTimer();
        });
        letters.forEach(letter => {
            letter.addEventListener('pointerenter', () => {
                const imageIndex = Number(letter.dataset.image || 0);
                setImage(imageIndex, true);
                stopTimer();
            });
        });
        setImage(0, true);
    }

    if (!finePointer) startTimer();
    else startTimer();

    document.querySelectorAll('.slider-dots .dot').forEach((dot, index) => {
        dot.addEventListener('click', () => {
            setSlide(index, true);
            startTimer();
        });
    });

    window.addEventListener('pagehide', stopTimer);
});

/* FASE 2 — interacción de servicios y revelado por scroll */
(() => {
    const rows = [...document.querySelectorAll('.service-row')];
    const previews = [...document.querySelectorAll('.service-preview-image')];
    const details = [...document.querySelectorAll('.service-detail')];
    const reveals = [...document.querySelectorAll('.reveal-section')];
    if (!rows.length) return;

    const activateService = index => {
        rows.forEach((row, i) => row.classList.toggle('is-active', i === index));
        previews.forEach((image, i) => image.classList.toggle('is-active', i === index));
        details.forEach((detail, i) => detail.classList.toggle('is-active', i === index));
    };

    rows.forEach((row, index) => {
        row.addEventListener('mouseenter', () => activateService(index));
        row.addEventListener('focus', () => activateService(index));
    });

    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.14 });
        reveals.forEach(element => observer.observe(element));
    } else {
        reveals.forEach(element => element.classList.add('is-visible'));
    }
})();


/* FASE 3 — progreso visual del proceso */
(() => {
    const track = document.querySelector('.proceso-track');
    if (!track || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                track.classList.add('is-visible');
                observer.unobserve(track);
            }
        });
    }, { threshold: 0.25 });
    observer.observe(track);
})();

/* FASE 4 — validación y estado accesible del formulario */
(() => {
    const form = document.getElementById('cotizacion-form');
    const status = document.querySelector('.form-status');
    if (!form || !status) return;

    form.addEventListener('submit', event => {
        event.preventDefault();
        status.className = 'form-status';

        if (!form.checkValidity()) {
            status.textContent = 'Revisa los campos obligatorios antes de enviar tu requerimiento.';
            status.classList.add('is-error');
            form.reportValidity();
            return;
        }

        status.textContent = 'Formulario validado. Para activar el envío real, conecta este formulario con tu servicio de recepción de solicitudes.';
        status.classList.add('is-success');
    });
})();

/* =========================================================
   FASE 5 — PROTECCIONES Y ACCESIBILIDAD
   ========================================================= */

(function () {
    'use strict';

    // Evita trabajo innecesario de efectos basados en pointer cuando no existe mouse.
    const isFinePointer = window.matchMedia('(pointer: fine)').matches;
    document.documentElement.classList.toggle('fine-pointer', isFinePointer);

    // Mantiene aria-expanded sincronizado para un menú móvil si existe.
    const menuButton = document.querySelector(
        '.menu-toggle, .hamburger, [aria-label="Abrir menú"]'
    );

    if (menuButton) {
        const syncMenuState = () => {
            const expanded = menuButton.getAttribute('aria-expanded') === 'true';
            menuButton.setAttribute(
                'aria-label',
                expanded ? 'Cerrar menú' : 'Abrir menú'
            );
        };

        syncMenuState();

        menuButton.addEventListener('click', () => {
            requestAnimationFrame(syncMenuState);
        });
    }

    // Reduce actualizaciones de layout mientras el usuario desplaza la página.
    let ticking = false;
    const onScroll = () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
            document.documentElement.classList.toggle('is-scrolling', window.scrollY > 8);
            ticking = false;
        });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
})();

