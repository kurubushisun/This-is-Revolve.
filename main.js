const disclosureMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const disclosureAnimations = new Map();

function animateDisclosure(element, from, to, onFinish = () => {}) {
    disclosureAnimations.get(element)?.finish();
    if (disclosureMotion.matches || from === to) {
        onFinish();
        return;
    }
    const animation = element.animate([
        { height: `${from}px`, overflow: 'hidden', boxSizing: 'border-box' },
        { height: `${to}px`, overflow: 'hidden', boxSizing: 'border-box' },
    ], { duration: 280, easing: 'ease-in-out' });
    disclosureAnimations.set(element, animation);
    animation.onfinish = () => {
        disclosureAnimations.delete(element);
        onFinish();
    };
}

disclosureMotion.addEventListener('change', () => {
    if (disclosureMotion.matches) {
        disclosureAnimations.forEach((animation) => animation.finish());
    }
});

document.querySelectorAll('.faq-item').forEach((item) => {
    const summary = item.querySelector('summary');
    let expanded = item.open;
    summary.addEventListener('click', (event) => {
        event.preventDefault();
        const from = item.getBoundingClientRect().height;
        const previous = disclosureAnimations.get(item);
        if (previous) {
            previous.cancel();
            disclosureAnimations.delete(item);
        }
        expanded = !expanded;
        item.open = expanded;
        const to = item.getBoundingClientRect().height;
        // 閉じる間も回答を描画し、アニメーション終了後に閉じる。
        item.open = true;
        animateDisclosure(item, from, to, () => { item.open = expanded; });
    });
});

// カレンダーの写真を開閉し、ボタンの読み上げ内容も切り替える。
document.querySelectorAll('.calendar-toggle').forEach((toggle) => {
    const event = toggle.closest('.calendar-event');
    const image = document.getElementById(toggle.getAttribute('aria-controls'));
    const intro = event.querySelector('#orientation-intro');
    const title = event.querySelector('.calendar-event-title').textContent;

    let request = 0;
    toggle.addEventListener('click', async () => {
        const currentRequest = ++request;
        const expanded = toggle.getAttribute('aria-expanded') !== 'true';
        toggle.setAttribute('aria-expanded', String(expanded));
        toggle.setAttribute('aria-label', `${title}の写真を${expanded ? '閉じる' : '開く'}`);
        if (expanded) {
            image.loading = 'eager';
            await image.decode().catch(() => {});
            if (currentRequest !== request) return;
        }
        const from = image.hidden ? 0 : image.getBoundingClientRect().height;
        const previous = disclosureAnimations.get(image);
        if (previous) {
            previous.cancel();
            disclosureAnimations.delete(image);
        }
        image.hidden = false;
        const to = expanded ? image.getBoundingClientRect().height : 0;
        animateDisclosure(image, from, to, () => { image.hidden = !expanded; });
        if (intro) intro.hidden = expanded;
    });
});

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

    // 自動送りも手動操作も同じスクロール位置を使う。
    const navReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let cycleWidth = 0;
    let pauseUntil = 0;
    let touching = false;
    let previousTime = 0;

    function measureTrack() {
        if (nav.hidden) return;
        cycleWidth = items.getBoundingClientRect().width;
        if (!cycleWidth || navReducedMotion.matches) return;
        const count = Math.ceil(nav.clientWidth / cycleWidth) + 2;
        while (track.children.length < count) track.append(duplicate.cloneNode(true));
    }

    function pauseAutoScroll() {
        pauseUntil = performance.now() + 1200;
    }

    nav.addEventListener('wheel', (event) => {
        if (event.ctrlKey) return;
        const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
        if (!delta || nav.scrollWidth <= nav.clientWidth) return;
        event.preventDefault();
        pauseAutoScroll();
        const unit = event.deltaMode === 1 ? 22 : event.deltaMode === 2 ? nav.clientWidth : 1;
        nav.scrollLeft += delta * unit;
    }, { passive: false });
    nav.addEventListener('touchstart', () => { touching = true; }, { passive: true });
    const endTouch = () => { touching = false; pauseAutoScroll(); };
    nav.addEventListener('touchend', endTouch, { passive: true });
    nav.addEventListener('touchcancel', endTouch, { passive: true });
    nav.addEventListener('scroll', () => {
        if (!cycleWidth || navReducedMotion.matches || nav.contains(document.activeElement)) return;
        if (nav.scrollLeft >= cycleWidth * 2) nav.scrollLeft -= cycleWidth;
        else if (nav.scrollLeft < cycleWidth) nav.scrollLeft += cycleWidth;
    }, { passive: true });

    function animateNavigation(time) {
        const elapsed = previousTime ? Math.min(time - previousTime, 50) : 0;
        previousTime = time;
        if (!nav.hidden && cycleWidth && !navReducedMotion.matches && !touching &&
            time >= pauseUntil && !nav.contains(document.activeElement)) {
            nav.scrollLeft += cycleWidth * elapsed / 24000;
        }
        requestAnimationFrame(animateNavigation);
    }
    new ResizeObserver(measureTrack).observe(nav);
    new ResizeObserver(measureTrack).observe(items);
    navReducedMotion.addEventListener('change', () => {
        nav.scrollLeft = 0;
        measureTrack();
    });
    requestAnimationFrame(animateNavigation);

    const header = document.querySelector('.firstview');
    const footer = document.querySelector('.site-footer');
    const sections = [...document.querySelectorAll('section[id]')];
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
        nav.querySelectorAll('a').forEach((link) => {
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
