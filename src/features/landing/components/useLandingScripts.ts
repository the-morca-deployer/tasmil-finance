// @ts-nocheck
"use client";
import { useEffect } from "react";

export function useLandingScripts() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    document.querySelector(".landing-page")?.classList.add("anim");

    // Make every listener/timer below tear down on unmount so the scroll
    // animations re-bind to fresh DOM on client-side navigation back to /.
    // Shadowing the globals threads the abort signal/ids without editing each call.
    const ac = new AbortController();
    const signal = ac.signal;
    const timeouts: number[] = [];
    const intervals: number[] = [];
    const rafs: number[] = [];
    const addEventListener = (type: string, fn: any, opts?: any) =>
      window.addEventListener(
        type,
        fn,
        typeof opts === "object"
          ? { ...opts, signal }
          : opts === true
            ? { capture: true, signal }
            : { signal }
      );
    const setTimeout = (fn: any, ms?: number) => {
      const id = window.setTimeout(fn, ms);
      timeouts.push(id);
      return id;
    };
    const setInterval = (fn: any, ms?: number) => {
      const id = window.setInterval(fn, ms);
      intervals.push(id);
      return id;
    };
    const requestAnimationFrame = (fn: any) => {
      const id = window.requestAnimationFrame(fn);
      rafs.push(id);
      return id;
    };
    // Silence "unused" for the shadowed helpers that some branches may not hit.
    void setInterval;
    void requestAnimationFrame;

    /* ===== nav + progress ===== */
    const nav = document.getElementById("nav"),
      prog = document.getElementById("prog");
    function onScroll() {
      nav.dataset.scrolled = scrollY > 16 ? "true" : "false";
      const max = document.documentElement.scrollHeight - innerHeight;
      prog.style.width = (max > 0 ? (scrollY / max) * 100 : 0) + "%";
      runWatchers();
    }
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", runWatchers, { passive: true });

    /* ===== rect-based visibility ===== */
    const watchers = [];
    function onVisible(el, cb, m) {
      if (!el) return;
      watchers.push({ el, cb, m: m == null ? 0.14 : m, done: false });
    }
    function runWatchers() {
      const vh = innerHeight || document.documentElement.clientHeight;
      for (const w of watchers) {
        if (w.done) continue;
        const r = w.el.getBoundingClientRect();
        if (r.top < vh * (1 - w.m) && r.bottom > vh * w.m) {
          w.done = true;
          w.cb();
        }
      }
    }
    document
      .querySelectorAll(".reveal")
      .forEach((el) =>
        onVisible(
          el,
          () => {
            el.classList.add("in");
            el.dataset.inview = "true";
          },
          0.06
        )
      );
    /* hero skyline bars rise on load */
    requestAnimationFrame(() =>
      setTimeout(() => {
        const h = document.getElementById("top");
        if (h) h.dataset.lit = "true";
      }, 200)
    );
    /* hero object parallax tilt */
    (() => {
      const stage = document.getElementById("heroStage"),
        obj = document.getElementById("obj3d");
      if (!stage || !obj || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      let raf = null;
      stage.addEventListener("pointermove", (e) => {
        const r = stage.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5,
          py = (e.clientY - r.top) / r.height - 0.5;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          obj.style.transform =
            "rotateX(" + (-py * 9).toFixed(2) + "deg) rotateY(" + (px * 11).toFixed(2) + "deg)";
        });
      });
      stage.addEventListener("pointerleave", () => {
        obj.style.transform = "";
      });
    })();

    /* footer skyline bars rise when you reach the bottom of the footer, fall when you scroll back up */
    const faCols = document.querySelector(".fa-cols"),
      faMark = document.querySelector(".fa-mark");
    if (faCols && faMark) {
      new IntersectionObserver(
        (es) => {
          faCols.classList.toggle("in", es[0].isIntersecting);
        },
        { threshold: 0.04 }
      ).observe(faMark);
    }

    /* retire hero entrance so frozen captures rest on visible base */
    const hero = document.getElementById("top");
    setTimeout(() => { if (hero) hero.dataset.done = "true"; }, 2600);

    /* scroll-scrub marquee: pinned section, rows track scroll progress + gentle idle drift */
    (() => {
      const reduce = matchMedia("(prefers-reduced-motion:reduce)").matches;
      if (reduce) return;
      const sec = document.getElementById("partners");
      const tRow1 = document.getElementById("ticker"),
        tRow2 = document.getElementById("ticker2");
      let id1 = 0,
        id2 = 0;
      const idle1 = -0.16,
        idle2 = 0.13; // px/frame idle drift
      const scrub = 1.15; // how far scroll pushes the rows
      function wrap(v, h) {
        if (!h) return 0;
        v %= h;
        if (v > 0) v -= h;
        return v;
      }
      function frame() {
        const h1 = tRow1.scrollWidth / 2,
          h2 = tRow2.scrollWidth / 2;
        const vh = (window.visualViewport ? window.visualViewport.height : innerHeight) || 1;
        const r = sec.getBoundingClientRect(),
          total = sec.offsetHeight - vh;
        let p = total > 0 ? -r.top / total : 0;
        p = p < 0 ? 0 : p > 1 ? 1 : p;
        id1 -= idle1 < 0 ? -idle1 : idle1; // accumulate magnitude (left)
        id2 += idle2;
        const x1 = wrap(id1 - p * h1 * scrub, h1);
        const x2 = wrap(id2 + p * h2 * scrub, h2);
        tRow1.style.transform = `translateX(${x1}px)`;
        tRow2.style.transform = `translateX(${x2}px)`;
        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    })();

    /* ===== farm donut + orbit yield ===== */
    (() => {
      const root = document.querySelector(".farm-ui");
      if (!root) return;
      const opts = [...root.querySelectorAll(".fp-opt")];
      const thumb = document.getElementById("fpThumb");
      const apyEl = document.getElementById("farmApy"),
        valEl = document.getElementById("farmVal");
      const bars = [0, 1, 2, 3].map((i) => document.getElementById("fb" + i));
      const pcts = [0, 1, 2, 3].map((i) => document.getElementById("fp" + i));
      const presets = [
        { apy: 6.1, alloc: [55, 25, 12, 8] },
        { apy: 8.4, alloc: [40, 28, 20, 12] },
        { apy: 12.6, alloc: [25, 30, 25, 20] },
      ];
      let cur = 1,
        cents = 108420,
        apyShown = 8.4,
        running = false;
      function applyPreset(idx, animate) {
        cur = idx;
        if (thumb) thumb.style.transform = "translateX(" + idx * 100 + "%)";
        opts.forEach((o, i) => (o.dataset.active = i === idx ? "true" : "false"));
        const p = presets[idx];
        p.alloc.forEach((a, i) => {
          bars[i].style.width = a + "%";
          pcts[i].textContent = a + "%";
        });
        const from = apyShown,
          to = p.apy,
          t0 = performance.now(),
          dur = animate ? 700 : 0;
        (function s(t) {
          const k = dur ? Math.min(1, (t - t0) / dur) : 1,
            e = 1 - (1 - k) ** 3,
            v = from + (to - from) * e;
          apyEl.textContent = v.toFixed(1) + "%";
          if (k < 1) requestAnimationFrame(s);
          else apyShown = to;
        })(performance.now());
      }
      function tickValue() {
        cents += 3 + Math.floor(Math.random() * 6);
        valEl.textContent =
          "$" +
          (cents / 100).toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });
      }
      opts.forEach((o, i) => o.addEventListener("click", () => applyPreset(i, true)));
      function start() {
        if (running) return;
        running = true;
        applyPreset(1, false);
        setInterval(tickValue, 1300);
        setInterval(() => applyPreset((cur + 1) % presets.length, true), 3600);
      }
      onVisible(root, start, 0.2);
    })();

    /* ===== portfolio ===== */
    (() => {
      const port = document.getElementById("port");
      if (!port) return;
      const line = document.getElementById("pfLine");
      if (line) {
        const L = line.getTotalLength();
        line.style.strokeDasharray = L;
        line.style.strokeDashoffset = L;
        line.style.transition = "stroke-dashoffset 1.4s var(--ease)";
      }
      const pfVal = document.getElementById("pfVal");
      function countUp() {
        const c = 87000,
          target = 92520,
          t0 = performance.now();
        (function s(t) {
          const k = Math.min(1, (t - t0) / 1300),
            e = 1 - (1 - k) ** 3,
            v = Math.round(c + (target - c) * e);
          pfVal.textContent =
            "$" +
            (v / 100).toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            });
          if (k < 1) requestAnimationFrame(s);
        })(performance.now());
      }
      onVisible(
        port,
        () => {
          port.dataset.in = "true";
          if (line)
            requestAnimationFrame(() => {
              line.style.strokeDashoffset = "0";
            });
          countUp();
        },
        0.25
      );
    })();

    /* ===== portfolio positions carousel ===== */
    (() => {
      const deck = document.getElementById("posDeck");
      if (!deck) return;
      const track = document.getElementById("posTrack");
      const cards = [...track.children];
      const dots = [...document.getElementById("posPager").children];
      let idx = 0,
        started = false;
      function go(n) {
        idx = (n + cards.length) % cards.length;
        track.style.transform = "translateX(" + -idx * deck.clientWidth + "px)";
        deck.style.height = cards[idx].offsetHeight + "px";
        dots.forEach((d, i) => (d.dataset.on = i === idx ? "true" : "false"));
      }
      dots.forEach((d, i) => d.addEventListener("click", () => go(i)));
      function start() {
        if (started) return;
        started = true;
        go(0);
        setInterval(() => go(idx + 1), 3800);
      }
      onVisible(deck, start, 0.2);
      addEventListener("resize", () => go(idx));
    })();

    /* ===== statement: scroll-scrubbed word reveal (pinned) ===== */
    (() => {
      const sec = document.getElementById("statement");
      const h = sec && sec.querySelector("h2.rv");
      if (!sec || !h) return;
      const words = [...h.querySelectorAll(".rv-w")];
      function upd() {
        const r = sec.getBoundingClientRect();
        const vh = innerHeight || document.documentElement.clientHeight;
        const total = Math.max(1, sec.offsetHeight - vh);
        let p = -r.top / total;
        p = Math.max(0, Math.min(1, p));
        const rp = Math.min(1, p / 0.72);
        const lit = Math.ceil(rp * words.length);
        words.forEach((w, i) => { w.dataset.lit = i < lit ? "true" : "false"; });
      }
      addEventListener("scroll", upd, { passive: true });
      addEventListener("resize", upd);
      upd();
    })();

    /* ===== chat thread ===== */
    (() => {
      const chat = document.getElementById("chat");
      if (!chat) return;
      const msgs = [...chat.querySelectorAll("[data-c]")];
      const thread = document.getElementById("chatThread");
      const sign = document.getElementById("scSign");
      const byc = (n) => msgs.find((x) => x.dataset.c == n);
      let timers = [];
      function clearT() {
        timers.forEach(clearTimeout);
        timers = [];
      }
      function scrollDown() {
        const over = thread.scrollHeight - chat.clientHeight;
        thread.style.transform = "translateY(" + (over > 0 ? -over : 0) + "px)";
      }
      function reveal(n) {
        const m = byc(n);
        if (!m) return;
        m.dataset.show = "true";
        requestAnimationFrame(() => {
          m.dataset.in = "true";
          scrollDown();
        });
      }
      function hide(n) {
        const m = byc(n);
        if (!m) return;
        m.dataset.in = "false";
        timers.push(
          setTimeout(() => {
            m.dataset.show = "false";
            scrollDown();
          }, 520)
        );
      }
      function resetSign() {
        if (sign) {
          sign.dataset.signing = "false";
          sign.textContent = "Sign transaction";
        }
      }
      function play() {
        clearT();
        msgs.forEach((m) => { m.dataset.in = "false"; m.dataset.show = "false"; });
        resetSign();
        thread.style.transform = "translateY(0)";
        timers.push(setTimeout(() => reveal(1), 300)); // user intent
        timers.push(setTimeout(() => reveal(2), 1200)); // agent typing
        timers.push(
          setTimeout(() => {
            hide(2);
            reveal(3);
          }, 2700)
        ); // planned route (Approve)
        timers.push(setTimeout(() => reveal(4), 4400)); // user approves
        timers.push(setTimeout(() => reveal(5), 5300)); // detailed quote
        timers.push(
          setTimeout(() => {
            if (sign) {
              sign.dataset.signing = "true";
              sign.textContent = "Signing…";
            }
            scrollDown();
          }, 7200)
        ); // sign
        timers.push(setTimeout(() => reveal(6), 8000)); // confirmed
        timers.push(setTimeout(play, 11200)); // loop
      }
      onVisible(chat, play, 0.25);
    })();

    /* ===== aggregator ===== */
    /* ===== aggregator — swap card animation ===== */
    (() => {
      const pad = document.getElementById("swapPad");
      if (!pad) return;
      const payAmt = document.getElementById("payAmt"),
        recvAmt = document.getElementById("recvAmt");
      const payUsd = document.getElementById("payUsd"),
        recvUsd = document.getElementById("recvUsd");
      const route = document.getElementById("recvRoute"),
        cta = document.getElementById("swapCta");
      const flip = document.getElementById("swapFlip");
      const reduce = matchMedia("(prefers-reduced-motion:reduce)");
      const PAY = 500,
        RATE = 0.1148; // 500 XLM ≈ $57.40
      const quotes = [
        ["Soroswap", 57.21],
        ["SDEX", 57.42],
        ["Aquarius", 57.06],
      ];
      const best = 1; // SDEX wins
      const fmt = (n) =>
        n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      let timers = [];
      const wait = (fn, ms) => {
        const t = setTimeout(fn, ms);
        timers.push(t);
        return t;
      };
      function clear() {
        timers.forEach(clearTimeout);
        timers = [];
      }
      function reset() {
        clear();
        payAmt.textContent = "0";
        payAmt.dataset.zero = "true";
        recvAmt.textContent = "0";
        recvAmt.dataset.zero = "true";
        payUsd.textContent = "$0";
        recvUsd.textContent = "$0";
        route.style.opacity = "0";
        route.textContent = "";
        cta.dataset.state = "idle";
        cta.textContent = "Enter amount";
      }
      function count(el, to, dur, suffix, done) {
        const t0 = performance.now();
        (function s(t) {
          const k = Math.min(1, (t - t0) / dur),
            e = 1 - (1 - k) ** 3,
            v = to * e;
          el.textContent = suffix === "int" ? Math.round(v).toLocaleString("en-US") : fmt(v);
          if (k < 1) requestAnimationFrame(s);
          else if (done) done();
        })(performance.now());
      }
      function showFinal() {
        payAmt.dataset.zero = "false";
        payAmt.textContent = PAY.toLocaleString("en-US");
        payUsd.textContent = "$" + fmt(PAY * RATE);
        recvAmt.dataset.zero = "false";
        recvAmt.textContent = fmt(quotes[best][1]);
        recvUsd.textContent = "$" + fmt(quotes[best][1]);
        route.textContent = "via " + quotes[best][0];
        route.style.opacity = "1";
        cta.dataset.state = "ready";
        cta.textContent = "Swap " + PAY + " XLM → USDC";
      }
      function run() {
        reset();
        if (reduce.matches) {
          showFinal();
          return;
        }
        // 1 — type the pay amount
        wait(() => {
          payAmt.dataset.zero = "false";
          count(payAmt, PAY, 560, "int");
          const u0 = performance.now();
          (function su(t) {
            const k = Math.min(1, (t - u0) / 560),
              e = 1 - (1 - k) ** 3;
            payUsd.textContent = "$" + fmt(PAY * RATE * e);
            if (k < 1) requestAnimationFrame(su);
          })(performance.now());
        }, 650);
        // 2 — quote venues (cycle through), settle on best
        wait(() => {
          cta.dataset.state = "quoting";
        }, 1300);
        quotes.forEach((q, i) => {
          wait(
            () => {
              cta.textContent = "Quoting " + q[0] + " " + fmt(q[1]) + " USDC";
            },
            1300 + i * 430
          );
        });
        // 3 — fill receive + best route
        wait(
          () => {
            recvAmt.dataset.zero = "false";
            count(recvAmt, quotes[best][1], 620, null);
            const r0 = performance.now();
            (function sr(t) {
              const k = Math.min(1, (t - r0) / 620),
                e = 1 - (1 - k) ** 3;
              recvUsd.textContent = "$" + fmt(quotes[best][1] * e);
              if (k < 1) requestAnimationFrame(sr);
            })(performance.now());
            route.textContent = "via " + quotes[best][0];
            route.style.opacity = "1";
            cta.dataset.state = "ready";
            cta.textContent = "Swap " + PAY + " XLM → USDC";
          },
          1300 + quotes.length * 430 + 220
        );
        // 4 — loop
        wait(run, 1300 + quotes.length * 430 + 220 + 2600);
      }
      if (flip)
        flip.addEventListener("click", () => {
          flip.dataset.spin = flip.dataset.spin === "true" ? "false" : "true";
        });
      onVisible(pad.closest(".frow"), run, 0.25);
    })();

    /* ===== convergence ===== */
    /* ===== convergence — protocols flow into the vault, emerge as coins ===== */
    (() => {
      const stage = document.getElementById("convStage");
      if (!stage) return;
      const vault = stage.querySelector(".conv-vault");
      const protocols = [
        ["blend", 0],
        ["soroswap", 0],
        ["aquarius", 0],
        ["phoenix", 0],
        ["allbridge", 0],
        ["defindex", 0],
        ["templar", 0],
        ["sdex", 1],
      ];
      let pi = 0,
        running = false;
      function spawn() {
        const W = stage.clientWidth;
        if (!W) return;
        const startX = 28,
          endX = W - 28,
          vaultX = W / 2,
          dur = 3400;
        const p = protocols[pi];
        pi = (pi + 1) % protocols.length;
        const pkt = document.createElement("div");
        // conv-pkt + cp-logo + cp-coin are @utility classes defined in globals.css (Phase 7)
        pkt.className = "conv-pkt";
        pkt.innerHTML =
          '<div class="cp-logo"><img src="partners/' +
          p[0] +
          '.svg"' +
          (p[1] ? ' class="invert"' : "") +
          ' alt=""></div><div class="cp-coin"></div>';
        pkt.style.transform = "translateX(" + startX + "px)";
        pkt.style.opacity = "0";
        pkt.style.transition = "transform " + dur + "ms linear,opacity .5s ease";
        stage.appendChild(pkt);
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            pkt.style.opacity = "1";
            pkt.style.transform = "translateX(" + endX + "px)";
          })
        );
        const tMid = (dur * (vaultX - startX)) / (endX - startX);
        setTimeout(() => {
          // data-* replaces classList toggles; CSS handled by @utility conv-pkt nesting
          pkt.dataset.iscoin = "true";
          vault.dataset.pulse = "false";
          void vault.offsetWidth;
          vault.dataset.pulse = "true";
        }, tMid);
        setTimeout(() => {
          pkt.style.opacity = "0";
        }, dur - 500);
        setTimeout(() => pkt.remove(), dur + 150);
      }
      function start() {
        if (running) return;
        running = true;
        spawn();
        setInterval(spawn, 1050);
      }
      onVisible(stage, start, 0.2);
    })();

    /* ===== steps ===== */
    const steps = document.getElementById("steps");
    onVisible(
      steps,
      () =>
        steps
          .querySelectorAll(".step")
          .forEach((st, i) => setTimeout(() => st.classList.add("done"), i * 450)),
      0.2
    );

    /* ===== footer ghost wordmark cursor glow + contract copy ===== */
    const ghost = document.querySelector(".foot-ghost");
    if (ghost)
      ghost.addEventListener("pointermove", (e) => {
        const r = ghost.getBoundingClientRect();
        ghost.style.setProperty("--gx", e.clientX - r.left + "px");
        ghost.style.setProperty("--gy", e.clientY - r.top + "px");
      });
    const contract = document.querySelector(".foot-contract");
    if (contract)
      contract.addEventListener("click", () => {
        const full = contract.dataset.full || "";
        navigator.clipboard && navigator.clipboard.writeText(full);
        const v = contract.querySelector(".cval"),
          old = v.textContent;
        v.textContent = "Copied";
        setTimeout(() => (v.textContent = old), 1200);
      });

    /* ===== FAQ accordion + search ===== */
    const faqList = document.getElementById("faqList");
    if (faqList) {
      const items = [...faqList.querySelectorAll(".faq-item")];
      function setOpen(item, open) {
        item.dataset.open = open ? "true" : "false";
      }
      items.forEach((item) => {
        item.querySelector(".faq-q").addEventListener("click", () => {
          const willOpen = item.dataset.open !== "true";
          items.forEach((o) => {
            if (o !== item) setOpen(o, false);
          });
          setOpen(item, willOpen);
        });
      });
      const search = document.getElementById("faqSearch"),
        empty = document.getElementById("faqEmpty");
      search.addEventListener("input", () => {
        const q = search.value.trim().toLowerCase();
        let shown = 0;
        items.forEach((item) => {
          const txt = item.textContent.toLowerCase();
          const match = !q || txt.includes(q);
          item.style.display = match ? "" : "none";
          if (match) shown++;
          if (q) setOpen(item, match);
        });
        if (!q) {
          items.forEach((it, i) => setOpen(it, i === 0));
        }
        empty.dataset.show = shown === 0 ? "true" : "false";
      });
    }

    /* ===== CTA pull-into-frame (scroll-driven) ===== */
    (() => {
      var banner = document.querySelector(".cta"),
        frame = banner && banner.querySelector(".cta-frame");
      if (!frame) return;
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      function getVH() {
        return (window.visualViewport ? window.visualViewport.height : innerHeight) || 1;
      }
      var ticking = false;
      function apply() {
        ticking = false;
        var r = banner.getBoundingClientRect(),
          vh = getVH();
        var total = banner.offsetHeight - vh;
        var p = total > 0 ? -r.top / total : 0;
        p = p < 0 ? 0 : p > 1 ? 1 : p;
        var fp = p / 0.45;
        fp = fp > 1 ? 1 : fp;
        var e = fp * fp * (3 - 2 * fp);
        var vw = innerWidth || 1,
          mob = vw <= 600;
        var cropT = mob ? 0.24 : 0.18,
          cropB = mob ? 0.22 : 0.18,
          cropH = mob ? 0.05 : 0.11;
        frame.style.setProperty("--crop-t", (vh * cropT * e).toFixed(1) + "px");
        frame.style.setProperty("--crop-b", (vh * cropB * e).toFixed(1) + "px");
        frame.style.setProperty("--crop-l", (vw * cropH * e).toFixed(1) + "px");
        frame.style.setProperty("--crop-r", (vw * cropH * e).toFixed(1) + "px");
        frame.style.setProperty("--crop-radius", (mob ? 20 : 28) * e + "px");
        frame.style.setProperty("--frame-p", e.toFixed(3));
      }
      function onScrollCta() {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(apply);
        }
      }
      addEventListener("scroll", onScrollCta, { passive: true });
      addEventListener("resize", onScrollCta);
      if (window.visualViewport) {
        visualViewport.addEventListener("resize", onScrollCta);
        visualViewport.addEventListener("scroll", onScrollCta);
      }
      apply();
    })();

    /* fees word rotator — hugs each word, fee. glides */
    (() => {
      const fr = document.getElementById("feesFr");
      if (!fr) return;
      const track = fr.querySelector(".fr-track");
      const items = [...fr.querySelectorAll(".fr-i")];
      if (items.length < 2) return;
      const reduce = matchMedia("(prefers-reduced-motion:reduce)");
      let i = 0;
      const widthOf = (n) => Math.ceil(items[n].getBoundingClientRect().width) + "px";
      function show(n, instant) {
        i = n;
        if (instant) {
          fr.style.transition = "none";
          track.style.transition = "none";
        }
        track.style.transform = "translateY(-" + (i * 1.7 + 0.32) + "em)";
        fr.style.width = widthOf(i);
        if (instant) {
          requestAnimationFrame(() => {
            fr.style.transition = "";
            track.style.transition = "";
          });
        }
      }
      function start() {
        show(0, true);
        if (reduce.matches) return;
        setInterval(() => show((i + 1) % items.length, false), 2600);
      }
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(start);
      } else {
        addEventListener("load", start);
      }
      addEventListener("resize", () => show(i, true));
    })();

    /* mobile sidebar drawer */
    (() => {
      const burger = document.getElementById("navBurger"),
        sb = document.getElementById("sidebar"),
        scrim = document.getElementById("navScrim"),
        closeBtn = document.getElementById("sbClose");
      if (!burger || !sb) return;
      function open() {
        sb.dataset.state = "open";
        scrim.dataset.state = "open";
        burger.dataset.state = "open";
        burger.setAttribute("aria-expanded", "true");
        sb.setAttribute("aria-hidden", "false");
        document.body.dataset.sidebarOpen = "true";
        document.body.style.overflow = "hidden";
      }
      function shut() {
        sb.dataset.state = "closed";
        scrim.dataset.state = "closed";
        burger.dataset.state = "closed";
        burger.setAttribute("aria-expanded", "false");
        sb.setAttribute("aria-hidden", "true");
        document.body.dataset.sidebarOpen = "false";
        document.body.style.overflow = "";
      }
      burger.addEventListener("click", () => (sb.dataset.state === "open" ? shut() : open()));
      closeBtn.addEventListener("click", shut);
      scrim.addEventListener("click", shut);
      sb.querySelectorAll("a").forEach((a) => a.addEventListener("click", shut));
      addEventListener("keydown", (e) => {
        if (e.key === "Escape") shut();
      });
    })();

    /* preloader */
    (() => {
      const pl = document.getElementById("preload");
      if (!pl) return;
      let gone = false;
      function hide() {
        if (gone) return;
        gone = true;
        pl.dataset.done = "true";
        setTimeout(() => pl.remove(), 800);
      }
      if (document.readyState === "complete") {
        setTimeout(hide, 450);
      } else {
        addEventListener("load", () => setTimeout(hide, 450));
      }
      setTimeout(hide, 4500);
    })();

    /* init + safety nets */
    onScroll();
    addEventListener("load", runWatchers);
    setTimeout(runWatchers, 200);
    setTimeout(runWatchers, 600);
    let __painted = false;
    requestAnimationFrame(() => {
      __painted = true;
    });
    setTimeout(() => {
      if (!__painted) {
        document.querySelector(".landing-page")?.classList.remove("anim");
        if (hero) hero.dataset.done = "true";
      }
    }, 1400);

    return () => {
      ac.abort();
      timeouts.forEach((id) => window.clearTimeout(id));
      intervals.forEach((id) => window.clearInterval(id));
      rafs.forEach((id) => window.cancelAnimationFrame(id));
    };
  }, []);
}
