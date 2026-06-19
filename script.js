/* ===================================================================
   Motivation, Reinforcement, and Learning Environments in Math Tutoring
   EDUC 240 — Educational Psychology Final Project
   script.js — vanilla JavaScript, no dependencies
   =================================================================== */
(function () {
  "use strict";

  /* Run after DOM is parsed (script is loaded at end of <body>). */
  document.addEventListener("DOMContentLoaded", init);

  function init() {
    setupMobileNav();
    setupActiveNav();
    setupBackToTop();
    setupTabs();
    setupMotivationActivity();
    setupFeedbackSorter();
    setupSessionBuilder();
    setupQuiz();
    setupReveal();
  }

  /* ---------------------------------------------------------------
     0. Scroll reveal (Brightwill-style entrance). Progressive
     enhancement: content stays visible if JS or IO is unavailable.
  --------------------------------------------------------------- */
  function setupReveal() {
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) return;

    var selector = [
      ".section-title", ".section-intro", ".hero-card", ".concept-card",
      ".research-card", ".case-card", ".timeline-item", ".activity",
      ".panel", ".callout", ".quote", ".table-wrap", ".cmap-node",
      ".cmap-goal", ".step-flow", ".progression", ".privacy-note"
    ].join(", ");

    var els = Array.prototype.slice.call(document.querySelectorAll(selector));
    if (!els.length) return;

    els.forEach(function (el) { el.classList.add("reveal"); });

    /* Light stagger for siblings that reveal together (e.g. card grids). */
    els.forEach(function (el) {
      var parent = el.parentElement;
      if (!parent) return;
      var sibs = Array.prototype.filter.call(parent.children, function (c) {
        return c.classList.contains("reveal");
      });
      var idx = sibs.indexOf(el);
      if (idx > 0) el.style.transitionDelay = Math.min(idx, 6) * 55 + "ms";
    });

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });

    els.forEach(function (el) { observer.observe(el); });
  }

  /* ---------------------------------------------------------------
     1. Mobile navigation toggle
  --------------------------------------------------------------- */
  function setupMobileNav() {
    var toggle = document.getElementById("navToggle");
    var nav = document.getElementById("primaryNav");
    if (!toggle || !nav) return;

    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
    });

    /* Close menu after a nav link is chosen (mobile). */
    nav.addEventListener("click", function (e) {
      var link = e.target.closest(".nav-link");
      if (link && nav.classList.contains("open")) {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---------------------------------------------------------------
     2. Active nav link highlighting via IntersectionObserver
  --------------------------------------------------------------- */
  function setupActiveNav() {
    var links = Array.prototype.slice.call(document.querySelectorAll(".nav-link"));
    if (!links.length) return;

    var map = {};
    links.forEach(function (link) {
      var id = (link.getAttribute("href") || "").replace("#", "");
      if (id) map[id] = link;
    });

    var sections = Object.keys(map)
      .map(function (id) { return document.getElementById(id); })
      .filter(Boolean);
    if (!sections.length) return;

    function setActive(id) {
      links.forEach(function (l) { l.classList.remove("active"); });
      if (map[id]) map[id].classList.add("active");
    }

    if (!("IntersectionObserver" in window)) {
      setActive(sections[0].id);
      return;
    }

    var visible = {};
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        visible[entry.target.id] = entry.isIntersecting
          ? entry.intersectionRatio
          : 0;
      });

      var bestId = null;
      var bestRatio = 0;
      Object.keys(visible).forEach(function (id) {
        if (visible[id] > bestRatio) {
          bestRatio = visible[id];
          bestId = id;
        }
      });
      if (bestId) setActive(bestId);
    }, {
      rootMargin: "-45% 0px -45% 0px",
      threshold: [0, 0.25, 0.5, 0.75, 1]
    });

    sections.forEach(function (s) { observer.observe(s); });
  }

  /* ---------------------------------------------------------------
     3. Back-to-top button
  --------------------------------------------------------------- */
  function setupBackToTop() {
    var btn = document.getElementById("backToTop");
    if (!btn) return;

    function onScroll() {
      if (window.pageYOffset > 500) {
        btn.hidden = false;
        btn.classList.add("visible");
      } else {
        btn.classList.remove("visible");
        btn.hidden = true;
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    btn.addEventListener("click", function () {
      var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
      var brand = document.querySelector(".brand");
      if (brand) brand.focus({ preventScroll: true });
    });
  }

  /* ---------------------------------------------------------------
     4. Tabs (ARIA tablist with arrow-key support)
  --------------------------------------------------------------- */
  function setupTabs() {
    var tabsRoot = document.querySelector('[data-component="tabs"]');
    if (!tabsRoot) return;

    var tabs = Array.prototype.slice.call(tabsRoot.querySelectorAll('[role="tab"]'));
    if (!tabs.length) return;

    function selectTab(tab, setFocus) {
      tabs.forEach(function (t) {
        var selected = t === tab;
        t.setAttribute("aria-selected", String(selected));
        t.tabIndex = selected ? 0 : -1;
        var panel = document.getElementById(t.getAttribute("aria-controls"));
        if (panel) panel.hidden = !selected;
      });
      if (setFocus) tab.focus();
    }

    tabs.forEach(function (tab, index) {
      tab.addEventListener("click", function () { selectTab(tab, false); });

      tab.addEventListener("keydown", function (e) {
        var next = null;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") {
          next = tabs[(index + 1) % tabs.length];
        } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
          next = tabs[(index - 1 + tabs.length) % tabs.length];
        } else if (e.key === "Home") {
          next = tabs[0];
        } else if (e.key === "End") {
          next = tabs[tabs.length - 1];
        }
        if (next) {
          e.preventDefault();
          selectTab(next, true);
        }
      });
    });
  }

  /* ---------------------------------------------------------------
     5. Motivation Response Activity (immediate feedback)
  --------------------------------------------------------------- */
  function setupMotivationActivity() {
    var root = document.querySelector('[data-activity="motivation"]');
    if (!root) return;

    var scenarios = root.querySelectorAll(".scenario");
    scenarios.forEach(function (scenario) {
      var correct = scenario.getAttribute("data-correct");
      var explain = scenario.getAttribute("data-explain") || "";
      var feedback = scenario.querySelector(".scenario-feedback");
      var buttons = scenario.querySelectorAll(".option-btn");

      buttons.forEach(function (btn) {
        btn.addEventListener("click", function () {
          var choice = btn.getAttribute("data-choice");
          var isRight = choice === correct;

          /* Clear previous state for this scenario. */
          buttons.forEach(function (b) {
            b.classList.remove("is-correct", "is-incorrect");
          });

          if (isRight) {
            btn.classList.add("is-correct");
            showFeedback(feedback, true,
              "Correct. " + explain);
          } else {
            btn.classList.add("is-incorrect");
            /* Reveal the strongest response without locking retries. */
            buttons.forEach(function (b) {
              if (b.getAttribute("data-choice") === correct) {
                b.classList.add("is-correct");
              }
            });
            showFeedback(feedback, false,
              "Not the strongest choice. The highlighted response is better because it supports effort, strategy, and confidence.");
          }
        });
      });
    });
  }

  function showFeedback(el, isCorrect, message) {
    if (!el) return;
    el.textContent = (isCorrect ? "✓ " : "✕ ") + message;
    el.classList.remove("is-correct", "is-incorrect");
    el.classList.add(isCorrect ? "is-correct" : "is-incorrect");
    el.hidden = false;
  }

  /* ---------------------------------------------------------------
     6. Feedback Sorter
  --------------------------------------------------------------- */
  function setupFeedbackSorter() {
    var root = document.querySelector('[data-activity="sorter"]');
    if (!root) return;

    var items = Array.prototype.slice.call(root.querySelectorAll(".sorter-item"));
    var scoreEl = document.querySelector('[data-role="sorter-score"]');
    var summaryEl = document.querySelector('[data-role="sorter-summary"]');
    var checkBtn = document.querySelector('[data-action="check-sorter"]');
    var resetBtn = document.querySelector('[data-action="reset-sorter"]');

    /* Toggle a pick for an item; only one choice is active per item. */
    items.forEach(function (item) {
      var picks = item.querySelectorAll(".pick-btn");
      picks.forEach(function (pick) {
        pick.addEventListener("click", function () {
          picks.forEach(function (p) { p.setAttribute("aria-pressed", "false"); });
          pick.setAttribute("aria-pressed", "true");
          item.setAttribute("data-picked", pick.getAttribute("data-pick"));
          /* Clear any prior grading once the answer changes. */
          item.classList.remove("graded", "correct", "incorrect");
          var result = item.querySelector(".sorter-result");
          if (result) { result.hidden = true; }
        });
      });
    });

    if (checkBtn) {
      checkBtn.addEventListener("click", function () {
        var correctCount = 0;
        var answered = 0;

        items.forEach(function (item) {
          var picked = item.getAttribute("data-picked");
          var answer = item.getAttribute("data-answer");
          var result = item.querySelector(".sorter-result");
          item.classList.remove("graded", "correct", "incorrect");

          if (!picked) {
            if (result) {
              result.textContent = "Not yet rated — choose Helpful or Less Helpful.";
              result.className = "sorter-result is-incorrect";
              result.hidden = false;
            }
            return;
          }

          answered++;
          var ok = picked === answer;
          if (ok) correctCount++;

          item.classList.add("graded", ok ? "correct" : "incorrect");
          if (result) {
            var label = answer === "helpful" ? "Helpful" : "Less Helpful";
            result.textContent = ok
              ? "✓ Correct — this is " + label + " feedback."
              : "✕ Reconsider — this is actually " + label + " feedback.";
            result.className = "sorter-result " + (ok ? "is-correct" : "is-incorrect");
            result.hidden = false;
          }
        });

        if (scoreEl) {
          scoreEl.textContent = "Score: " + correctCount + " of " + items.length +
            " correct" + (answered < items.length
              ? " (" + (items.length - answered) + " not yet rated)."
              : ".");
          scoreEl.hidden = false;
        }
        if (summaryEl) summaryEl.hidden = false;
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        items.forEach(function (item) {
          item.removeAttribute("data-picked");
          item.classList.remove("graded", "correct", "incorrect");
          item.querySelectorAll(".pick-btn").forEach(function (p) {
            p.setAttribute("aria-pressed", "false");
          });
          var result = item.querySelector(".sorter-result");
          if (result) { result.hidden = true; result.textContent = ""; }
        });
        if (scoreEl) { scoreEl.hidden = true; scoreEl.textContent = ""; }
        if (summaryEl) summaryEl.hidden = true;
      });
    }
  }

  /* ---------------------------------------------------------------
     7. Build a Tutoring Session
  --------------------------------------------------------------- */
  function setupSessionBuilder() {
    var root = document.querySelector('[data-activity="builder"]');
    if (!root) return;

    var choices = Array.prototype.slice.call(root.querySelectorAll(".choice"));
    var resultEl = document.querySelector('[data-role="builder-result"]');
    var checkBtn = document.querySelector('[data-action="check-builder"]');
    var resetBtn = document.querySelector('[data-action="reset-builder"]');

    var totalGood = choices.filter(function (c) {
      var input = c.querySelector("input");
      return input && input.getAttribute("data-good") === "true";
    }).length;

    function clearMarks() {
      choices.forEach(function (c) {
        c.classList.remove("mark-good", "mark-bad", "mark-missed");
      });
    }

    if (checkBtn) {
      checkBtn.addEventListener("click", function () {
        clearMarks();
        var strong = [];
        var weak = [];
        var missed = [];

        choices.forEach(function (c) {
          var input = c.querySelector("input");
          if (!input) return;
          var good = input.getAttribute("data-good") === "true";
          var label = (c.textContent || "").trim();

          if (input.checked && good) {
            c.classList.add("mark-good");
            strong.push(label);
          } else if (input.checked && !good) {
            c.classList.add("mark-bad");
            weak.push(label);
          } else if (!input.checked && good) {
            c.classList.add("mark-missed");
            missed.push(label);
          }
        });

        var score = Math.max(0, strong.length - weak.length);
        renderBuilderResult(resultEl, score, totalGood, strong, weak, missed);
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        clearMarks();
        choices.forEach(function (c) {
          var input = c.querySelector("input");
          if (input) input.checked = false;
        });
        if (resultEl) { resultEl.hidden = true; resultEl.innerHTML = ""; }
      });
    }
  }

  function renderBuilderResult(el, score, totalGood, strong, weak, missed) {
    if (!el) return;
    var html = "";
    html += '<div class="result-head">Session score: ' + score + " of " + totalGood +
      " strong steps</div>";
    html += '<div class="result-body">';

    html += '<h4 class="legend-strong">Strong choices you included (' + strong.length + ")</h4>";
    html += strong.length ? list(strong) : '<p class="result-note">No strong steps selected yet.</p>';

    if (weak.length) {
      html += '<h4 class="legend-weak">Choices that weakened the environment (' + weak.length + ")</h4>";
      html += list(weak);
    }

    if (missed.length) {
      html += '<h4 class="legend-missed">Strong steps you missed (' + missed.length + ")</h4>";
      html += list(missed);
    }

    html += '<p class="result-note">A strong session protects <strong>engaged time</strong>, follows a ' +
      'predictable <strong>routine</strong> (check-in, target skill, model, guided then independent practice, ' +
      'feedback, recap), and keeps <strong>flexibility</strong> to review a missing prerequisite. Lecturing, ' +
      'skipping questions, starting with the hardest problem, or praising only speed reduce engaged time and ' +
      'raise anxiety.</p>';
    html += "</div>";

    el.innerHTML = html;
    el.hidden = false;
  }

  function list(arr) {
    var out = "<ul>";
    arr.forEach(function (item) {
      out += "<li>" + escapeHtml(item) + "</li>";
    });
    out += "</ul>";
    return out;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  /* ---------------------------------------------------------------
     8. Concept Quiz
  --------------------------------------------------------------- */
  function setupQuiz() {
    var form = document.getElementById("concept-quiz");
    if (!form) return;

    var questions = Array.prototype.slice.call(form.querySelectorAll(".quiz-q"));
    var scoreEl = form.querySelector('[data-role="quiz-score"]');
    var resetBtn = form.querySelector('[data-action="reset-quiz"]');

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var correct = 0;
      var unanswered = 0;

      questions.forEach(function (q) {
        var answer = q.getAttribute("data-correct");
        var options = Array.prototype.slice.call(q.querySelectorAll(".quiz-opt"));
        var chosen = q.querySelector("input:checked");
        var explain = q.querySelector(".quiz-explain");

        q.classList.remove("answered-correct", "answered-incorrect");
        options.forEach(function (o) { o.classList.remove("is-correct", "is-incorrect"); });

        /* Always reveal the correct option. */
        options.forEach(function (opt) {
          var input = opt.querySelector("input");
          if (input && input.value === answer) opt.classList.add("is-correct");
        });

        if (!chosen) {
          unanswered++;
        } else {
          var optLabel = chosen.closest(".quiz-opt");
          if (chosen.value === answer) {
            correct++;
            q.classList.add("answered-correct");
          } else {
            q.classList.add("answered-incorrect");
            if (optLabel) optLabel.classList.add("is-incorrect");
          }
        }

        if (explain) explain.hidden = false;
      });

      if (scoreEl) {
        var band = unanswered > 0
          ? unanswered + " unanswered. Answer all 8 for a complete score."
          : scoreBand(correct, questions.length);
        scoreEl.innerHTML = "You scored " + correct + " out of " + questions.length +
          '.<span class="score-band">' + band + "</span>";
        scoreEl.hidden = false;
        scoreEl.setAttribute("tabindex", "-1");
        scoreEl.focus({ preventScroll: true });
      }

      /* Bring results into view politely. */
      if (scoreEl && scoreEl.scrollIntoView) {
        var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        scoreEl.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
      }
    });

    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        form.reset();
        questions.forEach(function (q) {
          q.classList.remove("answered-correct", "answered-incorrect");
          q.querySelectorAll(".quiz-opt").forEach(function (o) {
            o.classList.remove("is-correct", "is-incorrect");
          });
          var explain = q.querySelector(".quiz-explain");
          if (explain) explain.hidden = true;
        });
        if (scoreEl) { scoreEl.hidden = true; scoreEl.innerHTML = ""; }
        var first = form.querySelector(".quiz-q");
        if (first && first.scrollIntoView) {
          var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
          first.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
        }
      });
    }
  }

  function scoreBand(correct, total) {
    var pct = (correct / total) * 100;
    if (pct === 100) return "Excellent — full mastery of these concepts.";
    if (pct >= 75) return "Strong work — review the explanations for any misses.";
    if (pct >= 50) return "Good start — revisit the chapter sections and try again.";
    return "Keep going — reread the concept sections, then retake the quiz.";
  }
})();
