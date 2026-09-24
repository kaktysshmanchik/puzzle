(() => {
    const puzzle = document.querySelector('[data-message-rebuild]');
    if (!puzzle) return;

    const pile = puzzle.querySelector('[data-message-pile]');
    const grid = puzzle.querySelector('[data-message-grid]');
    const envelope = puzzle.querySelector('[data-message-envelope]');
    const flap = puzzle.querySelector('[data-envelope-flap]');
    const STORAGE_KEY = 'loreMessageRebuildV1';

    const files = [
        '1j.png','2k.png','3j.png','4k.png','5j.png','6k.png','7j.png','8k.png','9j.png','10k.png',
        '11j.png','12k.png','13j.png','14k.png','15j.png','16k.png','17j.png','18k.png','19j.png','20k.png'
    ];

    const pieces = files.map((file, index) => ({
        file,
        position: index + 1,
        speaker: file.toLowerCase().includes('j') ? 'J' : 'K'
    }));

    let state = loadState();
    let drag = null;

    function loadState() {
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
            if (saved && typeof saved === 'object') {
                return {
                    slots: saved.slots && typeof saved.slots === 'object' ? saved.slots : {},
                    free: saved.free && typeof saved.free === 'object' ? saved.free : {},
                    opened: !!saved.opened,
                    shuffle: Array.isArray(saved.shuffle) && saved.shuffle.length === 20 ? saved.shuffle : makeShuffle()
                };
            }
        } catch (_) {}
        return { slots: {}, free: {}, opened: false, shuffle: makeShuffle() };
    }

    function makeShuffle() {
        const a = pieces.map(p => p.position);
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    function saveState() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }

    function createPiece(piece) {
        const img = document.createElement('img');
        img.className = 'message-piece';
        img.src = `assets/images/lore/message/${piece.file}`;
        img.alt = `Message fragment ${piece.position}`;
        img.draggable = false;
        img.dataset.piece = String(piece.position);
        img.addEventListener('pointerdown', beginDrag);
        return img;
    }

    function defaultFreePosition(position, pileIndex) {
        /* A tight shuffled heap in the middle, with enough offset to show there are many pieces. */
        return {
            x: 50 + ((((pileIndex * 37) + position * 11) % 18) - 9),
            y: 50 + ((((pileIndex * 53) + position * 7) % 22) - 11)
        };
    }

    function render() {
        pile.innerHTML = '';
        grid.innerHTML = '';

        const placed = new Set(Object.values(state.slots).map(Number));
        const freePositions = state.shuffle.filter(position => !placed.has(position));

        freePositions.forEach((position, i) => {
            const piece = pieces[position - 1];
            const img = createPiece(piece);
            const pos = state.free[position] || defaultFreePosition(position, i);
            const angle = ((position * 17) % 15) - 7;
            img.style.setProperty('--free-x', `${pos.x}%`);
            img.style.setProperty('--free-y', `${pos.y}%`);
            img.style.setProperty('--pile-r', `${angle}deg`);
            img.style.zIndex = String(i + 1);
            pile.appendChild(img);
        });

        pieces.forEach(piece => {
            const row = document.createElement('div');
            row.className = 'message-slot-row';

            const label = document.createElement('div');
            label.className = 'message-slot-label';
            label.textContent = `${piece.speaker}:`;

            const slot = document.createElement('div');
            slot.className = 'message-slot';
            slot.dataset.slot = String(piece.position);

            const occupant = Number(state.slots[piece.position]);
            if (occupant) {
                const img = createPiece(pieces[occupant - 1]);
                slot.appendChild(img);
                if (occupant === piece.position) {
                    slot.classList.add('is-correct');
                    img.removeEventListener('pointerdown', beginDrag);
                } else {
                    slot.classList.add('is-wrong');
                }
            }

            row.append(label, slot);
            grid.appendChild(row);
        });

        const complete = pieces.every(p => Number(state.slots[p.position]) === p.position);
        envelope.hidden = !complete;
        pile.hidden = complete;
        envelope.classList.toggle('is-open', complete && state.opened);
    }

    function beginDrag(event) {
        if (event.button !== 0 && event.pointerType !== 'touch') return;
        const img = event.currentTarget;
        const piecePosition = Number(img.dataset.piece);
        const parentSlot = img.closest('.message-slot');
        if (parentSlot && parentSlot.classList.contains('is-correct')) return;

        event.preventDefault();
        const rect = img.getBoundingClientRect();
        drag = {
            img,
            piecePosition,
            fromSlot: parentSlot ? Number(parentSlot.dataset.slot) : null,
            offsetX: event.clientX - rect.left,
            offsetY: event.clientY - rect.top,
            target: null,
            clientX: event.clientX,
            clientY: event.clientY
        };

        img.style.setProperty('--drag-width', `${rect.width}px`);
        document.body.appendChild(img);
        img.classList.add('is-dragging');
        moveDrag(event);
        window.addEventListener('pointermove', moveDrag, { passive: false });
        window.addEventListener('pointerup', endDrag, { once: true });
        window.addEventListener('pointercancel', endDrag, { once: true });
    }

    function moveDrag(event) {
        if (!drag) return;
        event.preventDefault();
        drag.clientX = event.clientX;
        drag.clientY = event.clientY;
        drag.img.style.setProperty('--drag-x', `${event.clientX - drag.offsetX}px`);
        drag.img.style.setProperty('--drag-y', `${event.clientY - drag.offsetY}px`);

        document.querySelectorAll('.message-slot.is-target').forEach(el => el.classList.remove('is-target'));
        drag.img.style.visibility = 'hidden';
        const under = document.elementFromPoint(event.clientX, event.clientY);
        drag.img.style.visibility = '';
        const slot = under && under.closest('.message-slot');
        drag.target = slot && !slot.classList.contains('is-correct') ? slot : null;
        if (drag.target) drag.target.classList.add('is-target');
    }

    function endDrag() {
        if (!drag) return;
        window.removeEventListener('pointermove', moveDrag);
        document.querySelectorAll('.message-slot.is-target').forEach(el => el.classList.remove('is-target'));

        const targetPosition = drag.target ? Number(drag.target.dataset.slot) : null;
        if (drag.fromSlot && Number(state.slots[drag.fromSlot]) === drag.piecePosition) {
            delete state.slots[drag.fromSlot];
        }

        if (targetPosition) {
            const displaced = Number(state.slots[targetPosition]);
            if (displaced && displaced !== drag.piecePosition) {
                delete state.slots[targetPosition];
                /* A displaced wrong piece goes back onto the free table. */
                state.free[displaced] = { x: 50, y: 50 };
            }
            state.slots[targetPosition] = drag.piecePosition;
            delete state.free[drag.piecePosition];
        } else {
            /* Dropping anywhere outside a slot leaves the piece on the freeform table. */
            const rect = pile.getBoundingClientRect();
            const centreX = drag.clientX - drag.offsetX + (drag.img.getBoundingClientRect().width / 2);
            const centreY = drag.clientY - drag.offsetY + (drag.img.getBoundingClientRect().height / 2);
            const x = Math.max(5, Math.min(95, ((centreX - rect.left) / rect.width) * 100));
            const y = Math.max(5, Math.min(95, ((centreY - rect.top) / rect.height) * 100));
            state.free[drag.piecePosition] = { x, y };
        }

        drag.img.remove();
        drag = null;
        saveState();
        render();
    }

    let flapStartY = null;
    flap.addEventListener('pointerdown', event => {
        if (envelope.classList.contains('is-open')) return;
        flapStartY = event.clientY;
        flap.setPointerCapture?.(event.pointerId);
    });
    flap.addEventListener('pointerup', event => {
        if (flapStartY === null) return;
        const pulled = Math.abs(event.clientY - flapStartY) > 20;
        flapStartY = null;
        if (!pulled) return;
        state.opened = true;
        saveState();
        envelope.classList.add('is-open');
    });

    render();
})();
