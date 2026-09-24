(function () {
    "use strict";

    const STORAGE_KEY = "jonathanScrabbleStateV1";
    const PLAYER_TWO_PASSCODE = "2x9W1rMxDaLT16s91PhOoZm8vBk";

    const TILE_DEFS = {
        "main-p": { id: "main-p", letter: "P", value: 3, page: "index.html", mode: "scatter", x: 87, y: 72, rotate: -7 },
        "dossier-u": { id: "dossier-u", letter: "U", value: 4, page: "dossier.html", mode: "scatter", x: 7, y: 24, rotate: 8 },
        "dossier-a": { id: "dossier-a", letter: "A", value: 1, page: "dossier.html", mode: "scatter", x: 88, y: 76, rotate: -5 },
        "achievements-p": { id: "achievements-p", letter: "P", value: 3, page: "achievements.html", mode: "scatter", x: 6, y: 34, rotate: -8 },
        "achievements-e": { id: "achievements-e", letter: "E", value: 1, page: "achievements.html", mode: "peek", target: "achievement", heading: "Identity Theft Speedrun", side: "right", rotate: 5 },
        "achievements-l": { id: "achievements-l", letter: "L", value: 1, page: "achievements.html", mode: "scatter", x: 90, y: 72, rotate: 7 },
        "statistics-p": { id: "statistics-p", letter: "P", value: 3, page: "notable-incidents.html", mode: "peek", target: "statistics", answer: "604", side: "right", rotate: -6 },
        "statistics-r": { id: "statistics-r", letter: "R", value: 1, page: "notable-incidents.html", mode: "scatter", x: 8, y: 67, rotate: 8 },
        "lore-y": { id: "lore-y", letter: "Y", value: 1, page: "lore.html", mode: "scatter", x: 10, y: 24, rotate: -8 },
        "lore-p": { id: "lore-p", letter: "P", value: 3, page: "lore.html", mode: "scatter", x: 86, y: 49, rotate: 7 },
        "lore-t": { id: "lore-t", letter: "T", value: 1, page: "lore.html", mode: "scatter", x: 22, y: 72, rotate: -4 }
    };

    const currentPage = (window.location.pathname.split("/").pop() || "index.html").toLowerCase();
    let state = loadState();
    let inventoryButton = null;
    let inventoryPanel = null;
    let inventoryList = null;
    let grid = null;
    let activeDrag = null;

    function defaultState() {
        return {
            foundOrder: [],
            placements: {},
            solved: false
        };
    }

    function loadState() {
        try {
            const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
            if (!parsed || typeof parsed !== "object") {
                return defaultState();
            }

            const rawFound = Array.isArray(parsed.foundOrder) ? parsed.foundOrder : [];
            const foundOrder = [];
            rawFound.forEach(function (rawId) {
                const id = rawId === "lore-r" ? "lore-p" : rawId;
                if (TILE_DEFS[id] && !foundOrder.includes(id)) {
                    foundOrder.push(id);
                }
            });

            const placements = parsed.placements && typeof parsed.placements === "object"
                ? Object.assign({}, parsed.placements)
                : {};

            if (placements["lore-r"] && !placements["lore-p"]) {
                placements["lore-p"] = placements["lore-r"];
            }
            delete placements["lore-r"];

            return {
                foundOrder: foundOrder,
                placements: placements,
                solved: Boolean(parsed.solved)
            };
        } catch (error) {
            return defaultState();
        }
    }

    function saveState() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }

    function resetScrabbleProgress() {
        localStorage.removeItem(STORAGE_KEY);
    }

    window.resetScrabbleProgress = resetScrabbleProgress;

    const params = new URLSearchParams(window.location.search);
    if (params.get("reset") === "1") {
        resetScrabbleProgress();
        state = defaultState();
    }

    function tileMarkup(def) {
        return '<span class="scrabble-letter">' + def.letter + '</span>' +
            '<span class="scrabble-value">' + def.value + '</span>';
    }

    function createTile(def, extraClass) {
        const tile = document.createElement("button");
        tile.type = "button";
        tile.className = "scrabble-tile" + (extraClass ? " " + extraClass : "");
        tile.dataset.tileId = def.id;
        tile.dataset.letter = def.letter;
        tile.style.setProperty("--tile-rotation", String(def.rotate || 0) + "deg");
        tile.setAttribute("aria-label", def.letter + ", " + def.value + " points");
        tile.innerHTML = tileMarkup(def);
        return tile;
    }

    function ensureInventory() {
        inventoryButton = document.createElement("button");
        inventoryButton.type = "button";
        inventoryButton.className = "scrabble-inventory-button";
        inventoryButton.setAttribute("aria-label", "Inventory");
        inventoryButton.setAttribute("aria-expanded", "false");
        inventoryButton.setAttribute("aria-controls", "scrabble-inventory-panel");
        inventoryButton.innerHTML =
            '<img src="assets/images/lore/inventory.png" alt="" aria-hidden="true">';

        inventoryPanel = document.createElement("aside");
        inventoryPanel.id = "scrabble-inventory-panel";
        inventoryPanel.className = "scrabble-inventory-panel";
        inventoryPanel.hidden = true;
        inventoryPanel.innerHTML =
            '<div class="scrabble-inventory-heading">' +
                '<div><span>INVENTORY</span><strong>Letter tiles</strong></div>' +
                '<button type="button" class="scrabble-inventory-close" aria-label="Close inventory">×</button>' +
            '</div>' +
            '<p class="scrabble-inventory-note">Collected tiles stay here in discovery order. Drag any tile out.</p>' +
            '<div class="scrabble-inventory-list" data-scrabble-inventory-list></div>' +
            '<p class="scrabble-inventory-empty" data-scrabble-empty>Nothing found yet.</p>';

        document.body.appendChild(inventoryButton);
        document.body.appendChild(inventoryPanel);

        inventoryList = inventoryPanel.querySelector("[data-scrabble-inventory-list]");

        inventoryButton.addEventListener("click", function () {
            setInventoryOpen(inventoryPanel.hidden);
        });

        inventoryPanel.querySelector(".scrabble-inventory-close").addEventListener("click", function () {
            setInventoryOpen(false);
        });

        document.addEventListener("keydown", function (event) {
            if (event.key === "Escape" && !inventoryPanel.hidden) {
                setInventoryOpen(false);
            }
        });

        renderInventory();
    }

    function setInventoryOpen(open) {
        inventoryPanel.hidden = !open;
        inventoryButton.setAttribute("aria-expanded", open ? "true" : "false");
        if (open) {
            renderInventory();
        }
    }

    function renderInventory() {
        if (!inventoryList) {
            return;
        }

        inventoryList.innerHTML = "";

        state.foundOrder.forEach(function (id) {
            const def = TILE_DEFS[id];
            if (!def) {
                return;
            }

            const wrap = document.createElement("div");
            wrap.className = "scrabble-inventory-entry";

            const tile = createTile(def, "scrabble-inventory-tile");
            if (state.placements[id]) {
                tile.classList.add("is-placed");
            }
            tile.addEventListener("pointerdown", startTileDrag);

            wrap.appendChild(tile);
            inventoryList.appendChild(wrap);
        });

        const hasTiles = state.foundOrder.length !== 0;
        const empty = inventoryPanel.querySelector("[data-scrabble-empty]");
        const heading = inventoryPanel.querySelector(".scrabble-inventory-heading");
        const note = inventoryPanel.querySelector(".scrabble-inventory-note");

        empty.hidden = hasTiles;
        heading.hidden = !hasTiles;
        note.hidden = !hasTiles;
        inventoryList.hidden = !hasTiles;
    }

    function pageHost() {
        return document.querySelector("main") || document.body;
    }

    function createScatterTile(def) {
        const host = pageHost();
        host.classList.add("scrabble-scatter-host");

        const tile = createTile(def, "scrabble-source-tile scrabble-scatter-tile");
        tile.style.left = String(def.x) + "%";
        tile.style.top = String(def.y) + "%";
        tile.addEventListener("click", function () {
            collectTile(def, tile);
        });
        host.appendChild(tile);
    }

    function findPeekTarget(def) {
        if (def.target === "achievement") {
            const cards = Array.from(document.querySelectorAll(".achievement-card"));
            return cards.find(function (card) {
                const heading = card.querySelector("h3");
                return heading && heading.textContent.trim() === def.heading;
            }) || cards[0] || null;
        }

        if (def.target === "statistics") {
            return document.querySelector('.stat-question[data-answer="' + def.answer + '"]') ||
                document.querySelector(".stat-question");
        }

        return null;
    }

    function createPeekTile(def) {
        const target = findPeekTarget(def);
        if (!target) {
            createScatterTile(Object.assign({}, def, { x: 88, y: 50 }));
            return;
        }

        target.classList.add("scrabble-peek-anchor");
        const tile = createTile(def, "scrabble-source-tile scrabble-peek-tile");
        tile.addEventListener("click", function () {
            collectTile(def, tile);
        });
        document.body.appendChild(tile);

        function positionPeekTile() {
            if (!document.body.contains(tile) || !document.body.contains(target)) {
                return;
            }
            const rect = target.getBoundingClientRect();
            const x = window.scrollX + rect.right - tile.offsetWidth / 2;
            const y = window.scrollY + rect.top + Math.max(42, Math.min(rect.height - 42, rect.height * 0.55)) - tile.offsetHeight / 2;
            tile.style.left = String(x) + "px";
            tile.style.top = String(y) + "px";
        }

        function revealFromPointer(event) {
            if (!document.body.contains(tile)) {
                return;
            }
            const rect = tile.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const dx = event.clientX - cx;
            const dy = event.clientY - cy;
            const close = Math.sqrt(dx * dx + dy * dy) < 145;
            tile.classList.toggle("is-revealed", close);
        }

        positionPeekTile();
        window.addEventListener("resize", positionPeekTile);
        window.addEventListener("scroll", positionPeekTile, { passive: true });
        window.addEventListener("pointermove", revealFromPointer, { passive: true });
        target.addEventListener("pointerenter", function () {
            tile.classList.add("is-revealed");
        });
        target.addEventListener("pointerleave", function () {
            window.setTimeout(function () {
                if (document.body.contains(tile) && !tile.matches(":hover")) {
                    tile.classList.remove("is-revealed");
                }
            }, 180);
        });
        tile.addEventListener("pointerenter", function () {
            tile.classList.add("is-revealed");
        });
    }

    function renderSourceTiles() {
        Object.keys(TILE_DEFS).forEach(function (id) {
            const def = TILE_DEFS[id];
            if (def.page !== currentPage || state.foundOrder.includes(id)) {
                return;
            }

            if (def.mode === "peek") {
                createPeekTile(def);
            } else {
                createScatterTile(def);
            }
        });
    }

    function collectTile(def, sourceTile) {
        if (state.foundOrder.includes(def.id)) {
            sourceTile.remove();
            return;
        }

        state.foundOrder.push(def.id);
        saveState();

        const sourceRect = sourceTile.getBoundingClientRect();
        const targetRect = inventoryButton.getBoundingClientRect();
        const flyer = createTile(def, "scrabble-collect-flyer");
        flyer.style.left = String(sourceRect.left) + "px";
        flyer.style.top = String(sourceRect.top) + "px";
        flyer.style.width = String(sourceRect.width) + "px";
        flyer.style.height = String(sourceRect.height) + "px";
        document.body.appendChild(flyer);

        sourceTile.style.visibility = "hidden";
        inventoryButton.classList.add("is-receiving");

        requestAnimationFrame(function () {
            flyer.style.left = String(targetRect.left + targetRect.width / 2 - sourceRect.width / 2) + "px";
            flyer.style.top = String(targetRect.top + targetRect.height / 2 - sourceRect.height / 2) + "px";
            flyer.style.transform = "scale(0.45) rotate(18deg)";
            flyer.style.opacity = "0.25";
        });

        window.setTimeout(function () {
            flyer.remove();
            sourceTile.remove();
            inventoryButton.classList.remove("is-receiving");
            renderInventory();
        }, 520);
    }

    function setupLoreGrid() {
        grid = document.querySelector("[data-scrabble-grid]");
        if (!grid) {
            return;
        }

        renderGrid();
        renderFreeTiles();
        revealRewardIfSolved();
    }

    function occupiedTileForSlot(slotIndex, exceptId) {
        const ids = Object.keys(state.placements);
        for (let i = 0; i < ids.length; i += 1) {
            const id = ids[i];
            if (id === exceptId) {
                continue;
            }
            const placement = state.placements[id];
            if (placement && placement.kind === "grid" && Number(placement.slot) === Number(slotIndex)) {
                return id;
            }
        }
        return null;
    }

    function renderGrid() {
        if (!grid) {
            return;
        }

        const slots = Array.from(grid.querySelectorAll("[data-scrabble-slot]"));
        slots.forEach(function (slot) {
            slot.classList.remove("is-targeted");
            const existing = slot.querySelector(".scrabble-grid-tile");
            if (existing) {
                existing.remove();
            }
        });

        state.foundOrder.forEach(function (id) {
            const placement = state.placements[id];
            if (!placement || placement.kind !== "grid") {
                return;
            }

            const slot = slots[Number(placement.slot)];
            const def = TILE_DEFS[id];
            if (!slot || !def) {
                return;
            }

            const tile = createTile(def, "scrabble-grid-tile");
            tile.addEventListener("pointerdown", startTileDrag);
            slot.appendChild(tile);
        });

        checkWord();
        renderInventory();
    }

    function renderFreeTiles() {
        document.querySelectorAll(".scrabble-free-tile").forEach(function (node) {
            node.remove();
        });

        state.foundOrder.forEach(function (id) {
            const placement = state.placements[id];
            const def = TILE_DEFS[id];
            if (!placement || placement.kind !== "free" || placement.page !== currentPage || !def) {
                return;
            }

            const tile = createTile(def, "scrabble-free-tile");
            tile.style.left = String(placement.x) + "px";
            tile.style.top = String(placement.y) + "px";
            tile.addEventListener("pointerdown", startTileDrag);
            document.body.appendChild(tile);
        });
    }

    function startTileDrag(event) {
        if (event.button !== undefined && event.button !== 0) {
            return;
        }

        event.preventDefault();

        if (activeDrag) {
            return;
        }

        const source = event.currentTarget;
        const id = source.dataset.tileId;
        const def = TILE_DEFS[id];
        if (!def || !state.foundOrder.includes(id)) {
            return;
        }

        activeDrag = {
            id: id,
            def: def,
            source: source,
            ghost: null,
            candidateSlot: null,
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            started: false,
            originalPlacement: state.placements[id]
                ? Object.assign({}, state.placements[id])
                : null
        };

        window.addEventListener("pointermove", moveDrag);
        window.addEventListener("pointerup", finishDrag, { once: true });
        window.addEventListener("pointercancel", finishDrag, { once: true });
    }

    function beginDrag(event) {
        if (!activeDrag || activeDrag.started) {
            return;
        }

        activeDrag.started = true;
        delete state.placements[activeDrag.id];
        saveState();

        renderGrid();
        renderFreeTiles();
        renderInventory();

        const ghost = createTile(activeDrag.def, "scrabble-drag-ghost");
        document.body.appendChild(ghost);
        activeDrag.ghost = ghost;

        moveDrag(event);
    }

    function moveDrag(event) {
        if (!activeDrag) {
            return;
        }

        if (!activeDrag.started) {
            const dx = event.clientX - activeDrag.startX;
            const dy = event.clientY - activeDrag.startY;
            if (Math.sqrt(dx * dx + dy * dy) < 6) {
                return;
            }
            beginDrag(event);
            return;
        }

        const ghost = activeDrag.ghost;
        if (!ghost) {
            return;
        }

        let left = event.clientX - ghost.offsetWidth / 2;
        let top = event.clientY - ghost.offsetHeight / 2;
        activeDrag.candidateSlot = null;

        if (grid) {
            const rect = grid.getBoundingClientRect();
            const overGrid =
                event.clientX >= rect.left - 18 &&
                event.clientX <= rect.right + 18 &&
                event.clientY >= rect.top - 18 &&
                event.clientY <= rect.bottom + 18;

            const slots = Array.from(grid.querySelectorAll("[data-scrabble-slot]"));
            slots.forEach(function (slot) {
                slot.classList.remove("is-targeted");
            });

            if (overGrid && slots.length) {
                let best = null;
                let bestDistance = Infinity;

                slots.forEach(function (slot) {
                    const slotRect = slot.getBoundingClientRect();
                    const cx = slotRect.left + slotRect.width / 2;
                    const cy = slotRect.top + slotRect.height / 2;
                    const dx = event.clientX - cx;
                    const dy = event.clientY - cy;
                    const distance = dx * dx + dy * dy;
                    if (distance < bestDistance) {
                        bestDistance = distance;
                        best = slot;
                    }
                });

                if (best) {
                    const bestRect = best.getBoundingClientRect();
                    left = bestRect.left + bestRect.width / 2 - ghost.offsetWidth / 2;
                    top = bestRect.top + bestRect.height / 2 - ghost.offsetHeight / 2;
                    best.classList.add("is-targeted");
                    activeDrag.candidateSlot = Number(best.dataset.scrabbleSlot);
                }
            }
        }

        ghost.style.left = String(left) + "px";
        ghost.style.top = String(top) + "px";
    }

    function finishDrag(event) {
        if (!activeDrag) {
            return;
        }

        const drag = activeDrag;
        activeDrag = null;

        window.removeEventListener("pointermove", moveDrag);

        document.querySelectorAll("[data-scrabble-slot].is-targeted").forEach(function (node) {
            node.classList.remove("is-targeted");
        });

        if (!drag.started) {
            if (drag.originalPlacement) {
                delete state.placements[drag.id];
                saveState();
                renderGrid();
                renderFreeTiles();
                renderInventory();
            }
            return;
        }

        if (drag.candidateSlot !== null) {
            const displaced = occupiedTileForSlot(drag.candidateSlot, drag.id);
            if (displaced) {
                delete state.placements[displaced];
            }
            state.placements[drag.id] = {
                kind: "grid",
                slot: drag.candidateSlot
            };
        } else {
            const clientX = event && typeof event.clientX === "number"
                ? event.clientX
                : drag.startX;
            const clientY = event && typeof event.clientY === "number"
                ? event.clientY
                : drag.startY;

            state.placements[drag.id] = {
                kind: "free",
                page: currentPage,
                x: Math.max(0, clientX + window.scrollX - drag.ghost.offsetWidth / 2),
                y: Math.max(0, clientY + window.scrollY - drag.ghost.offsetHeight / 2)
            };
        }

        if (drag.ghost) {
            drag.ghost.remove();
        }

        saveState();
        renderGrid();
        renderFreeTiles();
        renderInventory();
    }

    function checkWord() {
        if (!grid) {
            return;
        }

        const letters = [];
        for (let slotIndex = 0; slotIndex < 5; slotIndex += 1) {
            const tileId = occupiedTileForSlot(slotIndex, null);
            if (!tileId || !TILE_DEFS[tileId]) {
                revealRewardIfSolved();
                return;
            }
            letters.push(TILE_DEFS[tileId].letter);
        }

        if (letters.join("") === "PUPPY") {
            state.solved = true;
            saveState();
            revealRewardIfSolved();
        }
    }

    function revealRewardIfSolved() {
        const reward = document.querySelector("[data-scrabble-reward]");
        if (!reward) {
            return;
        }

        if (state.solved) {
            reward.hidden = false;
            const code = reward.querySelector("[data-scrabble-passcode]");
            if (code) {
                code.textContent = PLAYER_TWO_PASSCODE;
            }
        }
    }

    document.addEventListener("DOMContentLoaded", function () {
        ensureInventory();
        setupLoreGrid();
        renderSourceTiles();
        renderFreeTiles();
    });
})();