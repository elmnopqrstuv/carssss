const boxes = document.querySelectorAll('.box');
        const hoverSound = document.getElementById('hoverSound');
        const gunshotSound = document.getElementById('gunshotSound');
        const upsetSound = document.getElementById('upsetSound');
        const ammoDisplay = document.getElementById('ammoDisplay');
        const reloadStatus = document.getElementById('reloadStatus');
        const fireButton = document.getElementById('fireButton');
        const crosshair = document.getElementById('crosshair');
        let moveInterval;
        let shootingInterval;
        let heldBoxInterval;
        let autoFireInterval = null;
        let upsetStopTimeout = null;
        let isFiring = false;
        const autoFireRate = 120;
        const magazineSize = 30;
        let ammo = magazineSize;
        let reloading = false;
        let aimX = window.innerWidth / 2;
        let aimY = window.innerHeight / 2;
        let currentAimTarget = null;

        // Initial user interaction to enable audio context
        document.body.addEventListener('click', () => {
            hoverSound.play().catch(e => console.log('Audio playback prevented:', e));
            hoverSound.pause();
        }, { once: true });

        function updateAmmoDisplay() {
            ammoDisplay.textContent = `Ammo: ${ammo} / ${magazineSize}`;
            reloadStatus.textContent = reloading ? 'Reloading...' : 'Ready';
        }

        function setCrosshair(x, y) {
            aimX = Math.max(0, Math.min(window.innerWidth - 1, x));
            aimY = Math.max(0, Math.min(window.innerHeight - 1, y));
            crosshair.style.left = `${aimX}px`;
            crosshair.style.top = `${aimY}px`;
        }

        function startAimSound() {
            hoverSound.loop = true;
            hoverSound.currentTime = 0;
            hoverSound.play().catch(() => {});
        }

        function stopAimSound() {
            hoverSound.pause();
            hoverSound.currentTime = 0;
            hoverSound.loop = false;
        }

        function playUpsetSound() {
            clearTimeout(upsetStopTimeout);
            upsetSound.loop = false;
            upsetSound.currentTime = 0;
            upsetSound.play().catch(() => {});
            upsetStopTimeout = setTimeout(() => {
                upsetSound.pause();
                upsetSound.currentTime = 0;
            }, 500);
        }

        function reloadMagazine() {
            if (reloading) return;
            reloading = true;
            updateAmmoDisplay();
            reloadStatus.textContent = 'Reloading...';
            setTimeout(() => {
                ammo = magazineSize;
                reloading = false;
                updateAmmoDisplay();
                reloadStatus.textContent = 'Ready';
            }, 1200);
        }

        function shoot() {
            if (reloading) return;
            if (ammo <= 0) {
                reloadMagazine();
                return;
            }

            ammo -= 1;
            updateAmmoDisplay();
            stopAimSound();
            gunshotSound.currentTime = 0;
            gunshotSound.play().catch(() => {});

            const clickedElement = document.elementFromPoint(aimX, aimY);
            const target = clickedElement ? clickedElement.closest('.box') : null;
            if (target) {
                playUpsetSound();
                target.classList.remove('aimed');
                target.classList.add('hit', 'fired');
                setTimeout(() => target.classList.remove('hit', 'fired'), 160);
            }

            if (ammo <= 0) {
                reloadMagazine();
            }
        }

        function handleAimEvent(clientX, clientY) {
            setCrosshair(clientX, clientY);
            updateAimHighlight();
        }

        function updateAimHighlight() {
            const pointedElement = document.elementFromPoint(aimX, aimY);
            const newTarget = pointedElement ? pointedElement.closest('.box') : null;
            if (currentAimTarget === newTarget) return;
            if (currentAimTarget) {
                currentAimTarget.classList.remove('aimed');
                stopAimSound();
            }
            currentAimTarget = newTarget;
            if (currentAimTarget && !isFiring) {
                currentAimTarget.classList.add('aimed');
                startAimSound();
            }
        }


        function startAutoFire() {
            if (autoFireInterval) return;
            isFiring = true;
            if (currentAimTarget) {
                currentAimTarget.classList.remove('aimed');
            }
            stopAimSound();
            shoot();
            autoFireInterval = setInterval(shoot, autoFireRate);
        }

        function stopAutoFire() {
            if (!autoFireInterval) return;
            clearInterval(autoFireInterval);
            autoFireInterval = null;
            isFiring = false;
            gunshotSound.pause();
            gunshotSound.currentTime = 0;
            clearTimeout(upsetStopTimeout);
            upsetSound.pause();
            upsetSound.currentTime = 0;
            if (currentAimTarget) {
                currentAimTarget.classList.add('aimed');
                startAimSound();
            }
        }

        fireButton.addEventListener('mousedown', startAutoFire);
        fireButton.addEventListener('mouseup', stopAutoFire);
        fireButton.addEventListener('mouseleave', stopAutoFire);
        fireButton.addEventListener('touchstart', event => {
            event.preventDefault();
            const touch = event.touches[0];
            if (!touch) return;
            handleAimEvent(touch.clientX, touch.clientY);
            startAutoFire();
        }, { passive: false });
        fireButton.addEventListener('touchend', event => {
            event.preventDefault();
            stopAutoFire();
        }, { passive: false });
        fireButton.addEventListener('touchcancel', stopAutoFire, { passive: true });
        window.addEventListener('mousedown', event => {
            if (event.button !== 0) return;
            if (event.target === fireButton) return;
            handleAimEvent(event.clientX, event.clientY);
            startAutoFire();
        });
        window.addEventListener('mouseup', stopAutoFire);
        window.addEventListener('mouseleave', stopAutoFire);
        window.addEventListener('touchend', stopAutoFire);
        document.addEventListener('mousemove', event => handleAimEvent(event.clientX, event.clientY));
        document.addEventListener('touchstart', event => {
            const touch = event.touches[0];
            if (!touch) return;
            handleAimEvent(touch.clientX, touch.clientY);
        }, { passive: true });
        document.addEventListener('touchmove', event => {
            const touch = event.touches[0];
            if (!touch) return;
            handleAimEvent(touch.clientX, touch.clientY);
        }, { passive: true });
        window.addEventListener('resize', () => setCrosshair(aimX, aimY));
        updateAmmoDisplay();
        setCrosshair(aimX, aimY);

        // Function to move a box to a random position
        function moveBoxRandomly(box) {
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const newX = Math.random() * (viewportWidth - box.offsetWidth);
            const newY = Math.random() * (viewportHeight - box.offsetHeight);

            box.style.left = `${newX}px`;
            box.style.top = `${newY}px`;
        }

        // Start random movement on page load
        moveInterval = setInterval(() => {
            boxes.forEach(b => moveBoxRandomly(b));
        }, 1000); // Move every 1000ms

        updateAimHighlight();
