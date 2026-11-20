/**
 * SWAYÉ THEATRE PARTY — BRUTALIST THEATRE NOIR
 * Main Interactive Script
 */

document.addEventListener('DOMContentLoaded', () => {
    // --------------------------------------------------------------------------
    // 0. MINIMAL ASSET PRELOADER (Intro Video, Hero, & Poster - Max 3s Cap)
    // --------------------------------------------------------------------------
    const appLoader = document.getElementById('app-loader');
    const loaderBar = document.getElementById('loader-bar');
    const loaderCounter = document.getElementById('loader-counter');
    const curtainVideoEl = document.getElementById('curtain-video');

    const loaderAssets = [
        { type: 'image', url: 'images/Premiere_IntroThumb.webp', weight: 25 },
        { type: 'image', url: 'images/sec1_hero.avif', weight: 35 },
        { type: 'video', el: curtainVideoEl, weight: 40 }
    ];

    let currentProgress = 0;
    let targetProgress = 0;
    let isLoaderDismissed = false;

    function setVisualProgress(val) {
        currentProgress = Math.min(100, Math.max(currentProgress, Math.round(val)));
        if (loaderBar) loaderBar.style.width = `${currentProgress}%`;
        if (loaderCounter) {
            const formatted = String(currentProgress).padStart(2, '0');
            loaderCounter.textContent = `${formatted}%`;
        }
    }

    // Smooth animation step
    const progressInterval = setInterval(() => {
        if (currentProgress < targetProgress) {
            setVisualProgress(currentProgress + 1);
        }
    }, 20);

    function completeAndDismissLoader() {
        if (isLoaderDismissed) return;
        isLoaderDismissed = true;
        clearInterval(progressInterval);
        setVisualProgress(100);

        setTimeout(() => {
            if (appLoader) {
                appLoader.classList.add('loaded');
                setTimeout(() => {
                    appLoader.style.display = 'none';
                }, 700);
            }
        }, 250);
    }

    // Hard ceiling: max 3 seconds total
    const maxLoaderTimeout = setTimeout(() => {
        completeAndDismissLoader();
    }, 3000);

    // Track loading promises
    let loadedWeight = 0;
    function registerAssetProgress(weight) {
        loadedWeight += weight;
        targetProgress = Math.min(100, loadedWeight);
        if (loadedWeight >= 100) {
            clearTimeout(maxLoaderTimeout);
            completeAndDismissLoader();
        }
    }

    // 1. Preload images
    loaderAssets.forEach((item) => {
        if (item.type === 'image') {
            const img = new Image();
            img.onload = () => registerAssetProgress(item.weight);
            img.onerror = () => registerAssetProgress(item.weight);
            img.src = item.url;
            if (img.complete) {
                registerAssetProgress(item.weight);
            }
        }
    });

    // 2. Preload video (Curtain layer intro video)
    if (curtainVideoEl) {
        if (curtainVideoEl.readyState >= 2) {
            registerAssetProgress(40);
        } else {
            const onVideoReady = () => {
                curtainVideoEl.removeEventListener('loadeddata', onVideoReady);
                curtainVideoEl.removeEventListener('canplay', onVideoReady);
                curtainVideoEl.removeEventListener('error', onVideoReady);
                registerAssetProgress(40);
            };
            curtainVideoEl.addEventListener('loadeddata', onVideoReady, { once: true });
            curtainVideoEl.addEventListener('canplay', onVideoReady, { once: true });
            curtainVideoEl.addEventListener('error', onVideoReady, { once: true });
            try {
                curtainVideoEl.load();
            } catch (err) {
                console.warn('Video load trigger notice:', err);
            }
        }
    } else {
        registerAssetProgress(40);
    }

    // --------------------------------------------------------------------------
    // 1. SCROLL RESTORATION & INITIAL POSITION
    // --------------------------------------------------------------------------
    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);

    // --------------------------------------------------------------------------
    // 2. SWIPER INITIALIZATION FOR TICKET STUBS (2 Cards)
    // --------------------------------------------------------------------------
    const pricingSwiper = new Swiper('.pricing-swiper', {
        slidesPerView: 'auto',
        centeredSlides: false,       // left-align: active card anchors left, next peeks right
        spaceBetween: 12,            // ~2.5cqw gap between cards
        grabCursor: true,
        initialSlide: 0,
        resistanceRatio: 0.75,       // slight resistance at edges for feel
        pagination: {
            el: '.swiper-pagination',
            clickable: true,
        },
    });

    // --------------------------------------------------------------------------
    // 3. INTRO VIDEO / CURTAIN LAYER FLOW
    // --------------------------------------------------------------------------
    const curtainLayer = document.getElementById('curtain-layer');
    const curtainVideo = document.getElementById('curtain-video');
    const bgMusic = document.getElementById('bg-music');
    const mfab = document.getElementById('mfab');
    const scrollIndicator = document.getElementById('scroll-cue');

    let hasInteracted = false;

    function openIntro() {
        if (hasInteracted) return;
        hasInteracted = true;

        const tapOverlay = document.querySelector('.tap-overlay');
        if (tapOverlay) {
            tapOverlay.style.opacity = '0';
            tapOverlay.style.transition = 'opacity 0.4s ease';
            setTimeout(() => {
                tapOverlay.style.display = 'none';
            }, 400);
        }

        if (curtainVideo) {
            curtainVideo.muted = false;
            curtainVideo.volume = 1.0;
            const playPromise = curtainVideo.play();
            if (playPromise !== undefined) {
                playPromise.catch((e) => {
                    console.warn('Video unmuted playback failed, falling back:', e);
                    curtainVideo.muted = true;
                    curtainVideo.play().catch((err) => {
                        console.log('Video play blocked:', err);
                        unlockExperience();
                    });
                });
            }

            curtainVideo.addEventListener('ended', unlockExperience, { once: true });
        } else {
            unlockExperience();
        }
    }

    if (curtainLayer) {
        curtainLayer.addEventListener('click', openIntro);
    }

    function unlockExperience() {
        if (curtainLayer) {
            curtainLayer.classList.add('hidden');
        }
        document.body.classList.add('unlocked');

        if (scrollIndicator) {
            scrollIndicator.classList.add('visible');
        }

        if (bgMusic) {
            bgMusic.volume = 0.4;
            bgMusic.play().catch((e) => {
                console.log('Audio autoplay prevented:', e);
                if (mfab) mfab.classList.add('muted');
            });
        }
    }

    // Audio Toggle (Rectangular pill on bottom-left)
    if (mfab && bgMusic) {
        mfab.addEventListener('click', () => {
            if (bgMusic.paused) {
                bgMusic.play().then(() => {
                    mfab.classList.remove('muted');
                }).catch((e) => console.log('Audio play error:', e));
            } else {
                bgMusic.pause();
                mfab.classList.add('muted');
            }
        });
    }

    // Hide scroll cue on scroll
    window.addEventListener('scroll', () => {
        if (!scrollIndicator) return;
        if (window.scrollY > 50) {
            scrollIndicator.style.opacity = '0';
        } else if (document.body.classList.contains('unlocked')) {
            scrollIndicator.style.opacity = '0.75';
        }
    });

    // --------------------------------------------------------------------------
    // 4. CHECKOUT CALCULATOR & TIER SELECTION (Early Bird ₹500 / Regular ₹600)
    // --------------------------------------------------------------------------
    const fticket = document.getElementById('fticket');
    const totalPriceEl = document.getElementById('total-price');
    const fname = document.getElementById('fname');
    const finsta = document.getElementById('finsta');
    const fphone = document.getElementById('fphone');
    const rsvpForm = document.getElementById('rsvp-form');

    function updateTotal() {
        if (!fticket || !totalPriceEl) return;
        const price = parseInt(fticket.value, 10) || 500;
        totalPriceEl.textContent = `₹${price.toLocaleString()}`;
    }

    if (fticket) {
        fticket.addEventListener('change', () => {
            updateTotal();
            validateField(fticket, true);
        });
    }

    // Select tier called from ticket stub CTA click
    window.selectTier = function(value) {
        if (!fticket) return;
        fticket.value = value;
        updateTotal();
        validateField(fticket, true);

        const rsvpContainer = document.getElementById('rsvp-container');
        if (rsvpContainer) {
            rsvpContainer.scrollIntoView({ behavior: 'smooth' });
        }
    };

    // --------------------------------------------------------------------------
    // 5. FORM VALIDATION & SANITIZATION (4 Fields)
    // --------------------------------------------------------------------------
    function validateName(el) {
        if (!el) return true;
        const val = el.value.trim();
        const isValid = val.length >= 2;
        setFieldValidation(el, isValid);
        return isValid;
    }

    /**
     * Robust Instagram Profile Validator & Extractor:
     * Accepts:
     * - Handle: @username, username, or uppercase/lowercase variants
     * - Direct URLs:
     *     https://instagram.com/username
     *     http://www.instagram.com/username/
     *     instagram.com/username
     *     www.instagram.com/username
     *     instagr.am/username
     * - Mobile app deep links:
     *     https://www.instagram.com/_u/username
     * - URLs with query tracking params / hashes:
     *     https://www.instagram.com/username/?igsh=MWZzZDNrbDVtY2hpMw==&utm_source=qr
     * 
     * Rejects:
     * - Non-profile routes (e.g. /p/..., /reel/..., /stories/..., /explore/...)
     * - Non-Instagram URLs (e.g. facebook.com, google.com)
     * - Usernames with consecutive dots (..), leading/trailing dots, spaces, or illegal characters
     */
    function extractInstagramUsername(input) {
        if (!input) return null;
        let str = input.trim();
        if (!str) return null;

        // Strip query parameters (?igsh=..., ?utm_source=...) and hash fragments (#...)
        str = str.split('?')[0].split('#')[0].replace(/\/+$/, '');

        // Check if input is a URL format
        const urlMatch = str.match(/^(?:https?:\/\/)?(?:www\.)?(?:instagram\.com|instagr\.am)(?:\/_u)?\/([a-zA-Z0-9._]+)$/i);
        if (urlMatch) {
            const candidate = urlMatch[1];
            // Exclude system/content routes that are not user profiles
            const reserved = ['p', 'reel', 'reels', 'stories', 'explore', 'direct', 'accounts', 'tv', 'about', 'legal', 'developer'];
            if (reserved.includes(candidate.toLowerCase())) return null;
            str = candidate;
        } else if (str.startsWith('@')) {
            str = str.substring(1);
        }

        // Instagram handle criteria:
        // 1-30 chars, alphanumeric + dots + underscores
        // Cannot start with a dot, cannot end with a dot, no consecutive dots
        const handleRegex = /^(?!.*\.\.)(?!^\.)(?!.*\.$)[a-zA-Z0-9._]{1,30}$/;
        if (handleRegex.test(str)) {
            return str;
        }
        return null;
    }

    function isValidInstagram(input) {
        return extractInstagramUsername(input) !== null;
    }

    function validateInstagram(el) {
        if (!el) return true;
        const isValid = isValidInstagram(el.value);
        setFieldValidation(el, isValid);
        return isValid;
    }

    /**
     * Strict Indian Phone Number validation:
     * Accepts:
     * - +919456565656
     * - +91 94565 65656
     * - 9456565656
     * - 09456565656
     * Allows optional gaps/dashes, optional +91, 91, or 0 prefix, followed by a valid 10-digit Indian mobile number (starts with 6, 7, 8, or 9).
     */
    function isValidIndianPhone(input) {
        if (!input) return false;
        // Strip out spaces, hyphens, and parentheses
        const clean = input.trim().replace(/[\s\-()]/g, '');
        // Match optional +91, 91, or 0 followed by 10 digits starting with 6-9
        const indianPhoneRegex = /^(?:\+91|91|0)?[6-9]\d{9}$/;
        return indianPhoneRegex.test(clean);
    }

    function validatePhone() {
        if (!fphone) return true;
        const isValid = isValidIndianPhone(fphone.value);
        setFieldValidation(fphone, isValid);
        return isValid;
    }

    function validateField(el, isValid) {
        setFieldValidation(el, isValid);
    }

    function setFieldValidation(el, isValid) {
        if (!el) return;
        if (isValid) {
            el.classList.remove('is-invalid');
            el.classList.add('is-valid');
        } else {
            el.classList.remove('is-valid');
            el.classList.add('is-invalid');
        }
    }

    function formatInstagramUrl(val) {
        const username = extractInstagramUsername(val);
        return username ? `https://instagram.com/${username}` : (val || '').trim();
    }

    function formatPhoneNumber(val) {
        if (!val) return '';
        const clean = val.trim().replace(/[\s\-()]/g, '');
        // Normalize to +91XXXXXXXXXX
        const match = clean.match(/^(?:\+91|91|0)?([6-9]\d{9})$/);
        return match ? `'+91 ${match[1]}` : `'${val.trim()}`;
    }

    if (fname) {
        fname.addEventListener('input', () => {
            if (fname.classList.contains('is-invalid') || fname.value.trim().length >= 2) validateName(fname);
        });
        fname.addEventListener('blur', () => validateName(fname));
    }

    if (finsta) {
        finsta.addEventListener('input', () => {
            if (finsta.classList.contains('is-invalid') || finsta.value.trim().length >= 1) validateInstagram(finsta);
        });
        finsta.addEventListener('blur', () => validateInstagram(finsta));
    }

    if (fphone) {
        fphone.addEventListener('input', () => {
            if (fphone.classList.contains('is-invalid') || fphone.value.replace(/\D/g, '').length >= 10) validatePhone();
        });
        fphone.addEventListener('blur', validatePhone);
    }

    // Terms Acceptance Checkbox
    const agreeTerms = document.getElementById('agree-terms');
    const tncRow = document.getElementById('tnc-agreement-row');

    function validateTerms() {
        if (!agreeTerms) return true;
        const isValid = agreeTerms.checked;
        if (tncRow) {
            if (isValid) {
                tncRow.classList.remove('has-terms-error');
            } else {
                tncRow.classList.add('has-terms-error');
            }
        }
        return isValid;
    }

    if (agreeTerms) {
        agreeTerms.addEventListener('change', validateTerms);
    }

    // --------------------------------------------------------------------------
    // 6. GOOGLE APPS SCRIPT SUBMISSION
    // --------------------------------------------------------------------------
    const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw1ZCVFrgw_X9-t66e9GZDXbKk47FGIqG3JwmH85HQQhD_m6U688DsiY_Eh3M5NOZvMUQ/exec";
    let isSubmitting = false;

    if (rsvpForm) {
        rsvpForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (isSubmitting) return;

            const isNameValid = validateName(fname);
            const isInstaValid = validateInstagram(finsta);
            const isPhoneValid = validatePhone();
            const isTermsValid = validateTerms();

            if (!isNameValid || !isInstaValid || !isPhoneValid || !isTermsValid) {
                if (!isNameValid && fname) {
                    fname.focus();
                } else if (!isInstaValid && finsta) {
                    finsta.focus();
                } else if (!isPhoneValid && fphone) {
                    fphone.focus();
                } else if (!isTermsValid && agreeTerms) {
                    agreeTerms.focus();
                    if (tncRow) tncRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
                return;
            }

            const name = fname ? fname.value.trim() : '';
            const insta = finsta ? formatInstagramUrl(finsta.value) : '';
            const phone = fphone ? formatPhoneNumber(fphone.value) : '';
            const ticketText = fticket ? fticket.options[fticket.selectedIndex].text : '';
            const total = totalPriceEl ? totalPriceEl.textContent : '';

            const payload = {
                timestamp: new Date().toISOString(),
                passTier: ticketText,
                totalPrice: total,
                guest1Name: name,
                guest1Instagram: insta,
                contactNumber: phone,
                phone: phone,
                termsAccepted: 'Yes'
            };

            const submitBtn = document.getElementById('submit-btn');
            const confirmMsg = document.getElementById('confirm-msg');
            const errorMsg = document.getElementById('error-msg');

            isSubmitting = true;
            if (confirmMsg) confirmMsg.style.display = 'none';
            if (errorMsg) errorMsg.style.display = 'none';
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="btn-spinner"></span> RESERVING PASS...';
            }

            function onSubmissionSuccess() {
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.innerHTML = 'RESERVATION REGISTERED';
                }
                if (confirmMsg) {
                    confirmMsg.style.display = 'block';
                    confirmMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
                rsvpForm.reset();
                if (agreeTerms) agreeTerms.checked = false;
                if (tncRow) tncRow.classList.remove('has-terms-error');
                updateTotal();

                if (fname) fname.classList.remove('is-valid', 'is-invalid');
                if (finsta) finsta.classList.remove('is-valid', 'is-invalid');
                if (fphone) fphone.classList.remove('is-valid', 'is-invalid');

                setTimeout(() => {
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = 'RESERVE TICKET';
                    }
                    isSubmitting = false;
                }, 4000);
            }

            function onSubmissionError(err) {
                console.error('Submission error:', err);
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = 'RESERVE TICKET';
                }
                isSubmitting = false;
                if (errorMsg) {
                    errorMsg.style.display = 'block';
                    errorMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            }

            if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL.includes('YOUR_SCRIPT_ID')) {
                console.warn('Simulation mode active for Google script.');
                setTimeout(onSubmissionSuccess, 750);
            } else {
                fetch(GOOGLE_SCRIPT_URL, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                })
                .then(onSubmissionSuccess)
                .catch(onSubmissionError);
            }
        });
    }

    // --------------------------------------------------------------------------
    // 7. CANVAS ANIMATION (Atmospheric Noir: Ambient Dust Motes & Stage Haze)
    // --------------------------------------------------------------------------
    const canvas = document.getElementById('theatre-canvas');
    const appEl = document.getElementById('app');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let width, height;

        function resize() {
            width = canvas.width = appEl ? appEl.clientWidth : Math.min(window.innerWidth, 480);
            height = canvas.height = window.innerHeight;
        }
        window.addEventListener('resize', resize);
        resize();

        // 1. Ambient Gold/Crimson Floating Dust Motes (Warm theatre air)
        class DustParticle {
            constructor() {
                this.reset();
                this.y = Math.random() * height; // start distributed
            }
            reset() {
                this.x = Math.random() * width;
                this.y = height + 10;
                this.size = Math.random() * 1.8 + 0.6;
                this.speedY = Math.random() * 0.4 + 0.15;
                this.speedX = (Math.random() - 0.5) * 0.3;
                this.maxAlpha = Math.random() * 0.45 + 0.15;
                this.alpha = 0;
                this.fadeSpeed = Math.random() * 0.005 + 0.003;
                // Alternate between amber/gold sparkle and muted warm red
                this.isRed = Math.random() > 0.6;
            }
            update() {
                this.y -= this.speedY;
                this.x += this.speedX + Math.sin(this.y * 0.01) * 0.2;

                if (this.y < height * 0.8 && this.alpha < this.maxAlpha) {
                    this.alpha += this.fadeSpeed;
                } else if (this.y < 50) {
                    this.alpha -= this.fadeSpeed * 2;
                }

                if (this.y < -10 || this.alpha <= 0 && this.y < height * 0.5) {
                    this.reset();
                }
            }
            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                if (this.isRed) {
                    ctx.fillStyle = `rgba(212, 21, 26, ${Math.max(0, this.alpha)})`;
                    ctx.shadowColor = 'rgba(212, 21, 26, 0.5)';
                } else {
                    ctx.fillStyle = `rgba(237, 224, 196, ${Math.max(0, this.alpha)})`;
                    ctx.shadowColor = 'rgba(237, 224, 196, 0.4)';
                }
                ctx.shadowBlur = 4;
                ctx.fill();
                ctx.shadowBlur = 0;
            }
        }

        // 2. Soft Ambient Vignette / Spotlight Haze (Atmospheric subtle breathing)
        class AmbientHaze {
            constructor() {
                this.time = 0;
            }
            update() {
                this.time += 0.008;
            }
            draw() {
                const pulse = Math.sin(this.time) * 0.04 + 0.08;
                const grad = ctx.createRadialGradient(width / 2, height * 0.35, 20, width / 2, height * 0.35, width * 0.85);
                grad.addColorStop(0, `rgba(212, 21, 26, ${pulse})`);
                grad.addColorStop(0.5, `rgba(140, 10, 10, ${pulse * 0.4})`);
                grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, width, height);
            }
        }

        // 3. Vintage Cinematic Film Gate Glitch (Celluloid film jitter & horizontal tape splice)
        class FilmGateGlitch {
            constructor() {
                this.timer = Math.random() * 200 + 120;
                this.active = false;
                this.glitchFrames = 0;
                this.slices = [];
            }
            trigger() {
                this.active = true;
                this.glitchFrames = Math.floor(Math.random() * 4) + 2; // 2 to 5 quick frames
                this.slices = [];
                const count = Math.floor(Math.random() * 3) + 2;
                for (let i = 0; i < count; i++) {
                    this.slices.push({
                        y: Math.random() * height,
                        h: Math.random() * 14 + 4,
                        offset: (Math.random() - 0.5) * 16,
                        color: Math.random() > 0.5 ? 'rgba(212, 21, 26, 0.22)' : 'rgba(237, 224, 196, 0.12)'
                    });
                }
            }
            update() {
                this.timer--;
                if (this.timer <= 0 && !this.active) {
                    this.trigger();
                    this.timer = Math.random() * 320 + 200; // occurs organically every 3-5s
                }
                if (this.active) {
                    this.glitchFrames--;
                    if (this.glitchFrames <= 0) {
                        this.active = false;
                    }
                }
            }
            draw() {
                if (!this.active) return;
                // Quick horizontal tape splice bands
                this.slices.forEach((s) => {
                    ctx.fillStyle = s.color;
                    ctx.fillRect(0, s.y, width, s.h);
                    // Slight RGB split bar
                    ctx.fillStyle = 'rgba(212, 21, 26, 0.15)';
                    ctx.fillRect(s.offset, s.y + 1, width, 1.5);
                });

                // Micro projector frame flash
                if (Math.random() > 0.6) {
                    ctx.fillStyle = 'rgba(212, 21, 26, 0.035)';
                    ctx.fillRect(0, 0, width, height);
                }
            }
        }

        // Initialize particles & effects
        const particles = [];
        const particleCount = 28;
        for (let i = 0; i < particleCount; i++) {
            particles.push(new DustParticle());
        }
        const haze = new AmbientHaze();
        const glitch = new FilmGateGlitch();

        function renderScene() {
            ctx.clearRect(0, 0, width, height);
            haze.update();
            haze.draw();
            particles.forEach((p) => {
                p.update();
                p.draw();
            });
            glitch.update();
            glitch.draw();
            requestAnimationFrame(renderScene);
        }

        renderScene();
    }

    // --------------------------------------------------------------------------
    // 6. Terms & Conditions Scroll Fade Indicator
    // --------------------------------------------------------------------------
    const tncBox = document.getElementById('tnc-scroll-box');
    const tncFade = document.getElementById('tnc-scroll-fade');
    if (tncBox && tncFade) {
        const updateTncFade = () => {
            const isNearBottom = tncBox.scrollTop + tncBox.clientHeight >= tncBox.scrollHeight - 12;
            tncFade.style.opacity = isNearBottom ? '0' : '1';
        };
        tncBox.addEventListener('scroll', updateTncFade, { passive: true });
        // Initial check in case content fits without scrolling
        setTimeout(updateTncFade, 200);
    }
});
