if (window.jQuery && window.jQuery.fn.bgswitcher) {
    jQuery(function ($) {
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
        $('.firstview-background').bgswitcher({
            images: [
                'img/firstview/firstview1.png',
                'img/firstview/firstview2.png',
                'img/firstview/firstview3.png',
                'img/firstview/firstview4.png',
            ],
            effect: 'fade',
            interval: 5000,
            duration: 1200,
            start: !reducedMotion.matches,
            loop: true,
        });
        reducedMotion.addEventListener('change', (event) => {
            $('.firstview-background').bgswitcher(event.matches ? 'stop' : 'start');
        });
    });
}

// 用意されたSlickを使い、中央の写真の左右に前後の写真を表示する。
if (window.jQuery && window.jQuery.fn.slick) {
    jQuery(function ($) {
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
        const arrow = (direction, label, path) =>
            `<button class="gallery-arrow gallery-arrow--${direction}" type="button" aria-label="${label}"><svg viewBox="0 0 40 40" fill="none" aria-hidden="true" focusable="false"><path d="${path}" /></svg></button>`;

        $('.gallery-slider').slick({
            slidesToShow: 1,
            slidesToScroll: 1,
            centerMode: true,
            centerPadding: '24.5%',
            infinite: true,
            dots: true,
            appendDots: $('.gallery-dots'),
            arrows: true,
            prevArrow: arrow('prev', '前の写真を見る', 'M26 7 8 20l18 13'),
            nextArrow: arrow('next', '次の写真を見る', 'm14 7 18 13-18 13'),
            speed: reducedMotion.matches ? 0 : 400,
            autoplay: false,
            rows: 0,
            customPaging: (slider, index) =>
                `<button type="button" aria-label="写真${index + 1}を表示">${index + 1}</button>`,
        });
    });
}

// 本文を見ている間だけ、流れるセクションナビを表示する。
(() => {
    const nav = document.querySelector('.section-nav');
    const track = nav.querySelector('.section-nav-track');
    const items = nav.querySelector('.section-nav-items');
    const duplicate = items.cloneNode(true);
    duplicate.setAttribute('aria-hidden', 'true');
    duplicate.querySelectorAll('a').forEach((link) => { link.tabIndex = -1; });
    track.append(duplicate);

    const header = document.querySelector('.firstview');
    const footer = document.querySelector('.site-footer');
    const sections = [...document.querySelectorAll('section[id]')];
    const links = [...nav.querySelectorAll('a')];
    let scheduled = false;

    function updateNavigation() {
        scheduled = false;
        const boundary = 64;
        // スクロール方向ではなく、画面上端が本文の範囲内かだけで判定する。
        const viewportTop = window.scrollY + 10;
        const contentStart = header.offsetTop + header.offsetHeight;
        const contentEnd = footer.offsetTop;
        nav.hidden = viewportTop < contentStart || viewportTop >= contentEnd;
        let active = sections[0];
        for (const section of sections) {
            if (section.getBoundingClientRect().top <= boundary + 1) active = section;
        }
        links.forEach((link) => {
            const current = link.hash === `#${active.id}`;
            link.classList.toggle('is-current', current);
            if (current) link.setAttribute('aria-current', 'location');
            else link.removeAttribute('aria-current');
        });
    }

    function scheduleUpdate() {
        if (scheduled) return;
        scheduled = true;
        requestAnimationFrame(updateNavigation);
    }

    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);
    window.addEventListener('pageshow', scheduleUpdate);
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', scheduleUpdate);
        window.visualViewport.addEventListener('scroll', scheduleUpdate);
    }
    window.addEventListener('load', scheduleUpdate);
    new ResizeObserver(scheduleUpdate).observe(document.body);
    updateNavigation();
})();
