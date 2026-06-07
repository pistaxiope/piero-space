import { saveIntroResponse } from "../../lib/saveIntroResponse.js";

const PIERO_LINKEDIN = "https://www.linkedin.com/in/pieroborrell/";

const steps = [
  {
    key: "desired_outcomes",
    title: "What are you trying to make happen?",
    hint: "Pick up to 2.",
    max: 2,
    options: ["Find customers", "Raise money", "Hire people", "Find a job", "Meet builders", "Learn from experts", "Find partners", "Make friends"],
  },
  {
    key: "worlds",
    title: "What space are you in?",
    hint: "Pick up to 2.",
    max: 2,
    options: ["AI", "DevTools", "SaaS", "Fintech", "Health", "Robotics", "Consumer", "Other"],
  },
];

const emptyDraft = {
  wants_intro: true,
  desired_outcomes: [],
  worlds: [],
  name: "",
  linkedin_url: "",
  company_project: "",
  description: "",
  post_ltw_ai_circle: false,
  ai_intro_card: "",
};

export function mountIntroMap(root) {
  let screen = "entry";
  let stepIndex = 0;
  let draft = { ...emptyDraft };
  let error = "";
  let entryClosing = false;
  let autoAdvanceTimer;

  function setScreen(nextScreen) {
    window.clearTimeout(autoAdvanceTimer);
    screen = nextScreen;
    error = "";
    render();
  }

  function toggleValue(key, value, max) {
    window.clearTimeout(autoAdvanceTimer);
    const current = Array.isArray(draft[key]) ? draft[key] : [];
    const exists = current.includes(value);
    const next = exists ? current.filter((item) => item !== value) : [...current, value].slice(-max);
    draft = { ...draft, [key]: next };
    render();

    if (!exists && next.length === max) {
      const startingStep = stepIndex;
      autoAdvanceTimer = window.setTimeout(() => advanceFromStep(startingStep), 260);
    }
  }

  async function submitIdentity(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") || "").trim();
    const linkedin = normalizeLinkedIn(String(data.get("linkedin_url") || "").trim());
    const companyProject = String(data.get("company_project") || "").trim();
    const description = String(data.get("description") || "").trim();
    const postLtwAiCircle = data.get("post_ltw_ai_circle") === "on";

    const nextDraft = {
      ...draft,
      name,
      linkedin_url: linkedin,
      company_project: companyProject,
      description,
      post_ltw_ai_circle: postLtwAiCircle,
    };
    draft = nextDraft;

    if (!name) {
      error = "Name is required.";
      render();
      return;
    }

    if (postLtwAiCircle && !linkedin) {
      error = "LinkedIn is required for the post-LTW AI circle.";
      render();
      return;
    }

    draft = {
      ...nextDraft,
      ai_intro_card: makeIntroCard(nextDraft),
    };
    finishFlow();
  }

  async function finishFlow() {
    const saved = await saveIntroResponse({
      ...draft,
      ai_intro_card: draft.ai_intro_card || makeIntroCard(draft),
    });
    draft = saved;
    setScreen("success");
  }

  function advanceFromStep(startingStep = stepIndex) {
    if (screen !== "question" || startingStep !== stepIndex) return;
    if (stepIndex === steps.length - 1) {
      setScreen("identity");
      return;
    }
    stepIndex += 1;
    render();
  }

  function startEntryTransition() {
    if (entryClosing) return;
    entryClosing = true;
    render();
    window.setTimeout(() => {
      entryClosing = false;
      stepIndex = 0;
      setScreen("question");
    }, 380);
  }

  function renderEntry() {
    root.innerHTML = `
      <section class="screen entry ${entryClosing ? "entry-closing" : ""}">
        <div class="intro-stack">
          ${faceMarkup()}
          <h1>Hey its Piero!</h1>
          <p class="lede">I’m a Product Designer currently working in enhancing manufacturing workflows with tech.</p>
          <a class="button primary" href="${PIERO_LINKEDIN}" target="_blank" rel="noreferrer">
            Connect on LinkedIn
            <span aria-hidden="true">↗</span>
          </a>
        </div>
        <button class="entry-sheet" type="button" data-action="start" ${entryClosing ? "disabled" : ""}>
          <h2>Should I introduce you to someone?</h2>
          <span class="down-arrow" aria-hidden="true">↓</span>
        </button>
      </section>
    `;
    root.querySelector("[data-action='start']").addEventListener("click", startEntryTransition);
  }

  function renderQuestion() {
    const step = steps[stepIndex];
    const current = draft[step.key];
    const selected = Array.isArray(current) ? current : [current];

    root.innerHTML = `
      <section class="screen">
        <p class="brand">Friends of LTW</p>
        <div class="prompt">
          <h1>${step.title}</h1>
          <p class="hint">${step.hint}</p>
        </div>
        <div class="options ${step.options.length > 4 ? "option-grid" : ""}">
          ${step.options
            .map(
              (option) => `
                <button
                  class="option-button ${selected.includes(option) ? "selected" : ""}"
                  type="button"
                  data-option="${option}"
                >${formatOption(option)}</button>
              `,
            )
            .join("")}
        </div>
        <div class="footer-actions">
          <button class="button primary" type="button" data-action="next" ${selected.length ? "" : "disabled"}>Next</button>
          <button class="button ghost" type="button" data-action="back">Back</button>
        </div>
      </section>
    `;

    root.querySelectorAll("[data-option]").forEach((button) => {
      button.addEventListener("click", () => {
        const value = button.dataset.option;
        toggleValue(step.key, value, step.max);
      });
    });

    root.querySelector("[data-action='next']").addEventListener("click", () => {
      if (!selected.length) return;
      advanceFromStep();
    });

    root.querySelector("[data-action='back']").addEventListener("click", () => {
      if (stepIndex === 0) {
        setScreen("entry");
        return;
      }
      stepIndex -= 1;
      render();
    });
  }

  function renderIdentity() {
    root.innerHTML = `
      <section class="screen">
        <p class="brand">Friends of LTW</p>
        <div class="prompt">
          <h1>How should I remember you?</h1>
          <p class="hint">Just enough for me to remember the right intro.</p>
        </div>
        <form class="form">
          <label class="field">
            <span>Name</span>
            <input name="name" autocomplete="name" placeholder="Ada Lovelace" value="${escapeAttr(draft.name)}" required />
          </label>
          <label class="field">
            <span>LinkedIn</span>
            <input name="linkedin_url" inputmode="url" autocomplete="url" placeholder="Optional unless joining the circle" value="${escapeAttr(draft.linkedin_url)}" />
          </label>
          <label class="field">
            <span>Company / project</span>
            <input name="company_project" autocomplete="organization" placeholder="Company or project" value="${escapeAttr(draft.company_project)}" />
          </label>
          <label class="field">
            <span>Description</span>
            <textarea name="description" placeholder="A sentence I can remember you by">${escapeHtml(draft.description)}</textarea>
          </label>
          <label class="checkbox-card">
            <input name="post_ltw_ai_circle" type="checkbox" ${draft.post_ltw_ai_circle ? "checked" : ""} />
            <span>
              <strong>Want in on the post-LTW AI circle?</strong>
              <small>Small group. Good pints, good conversations. No random networking. LinkedIn required.</small>
            </span>
          </label>
          <p class="error">${error}</p>
          <div class="footer-actions">
            <button class="button primary" type="submit">Finish</button>
            <button class="button ghost" type="button" data-action="back">Back</button>
          </div>
        </form>
      </section>
    `;
    root.querySelector("form").addEventListener("submit", submitIdentity);
    root.querySelector("[data-action='back']").addEventListener("click", () => {
      stepIndex = steps.length - 1;
      setScreen("question");
    });
  }

  function renderSuccess() {
    root.innerHTML = `
      <section class="screen">
        <p class="brand">Friends of LTW</p>
        <div class="prompt">
          <h1>Lovely. I’ve got it.</h1>
          <p class="hint">I’ll use this to make sharper intros after LTW.</p>
        </div>
        <article class="success-card">
          <h2>Intro card</h2>
          <p>${escapeHtml(draft.ai_intro_card)}</p>
        </article>
        <div class="footer-actions">
          <a class="button primary" href="${PIERO_LINKEDIN}" target="_blank" rel="noreferrer">Piero on LinkedIn <span aria-hidden="true">↗</span></a>
          <button class="button ghost" type="button" data-action="restart">Start another</button>
        </div>
      </section>
    `;
    root.querySelector("[data-action='restart']").addEventListener("click", () => {
      draft = { ...emptyDraft };
      stepIndex = 0;
      setScreen("entry");
    });
  }

  function render() {
    if (screen === "entry") renderEntry();
    if (screen === "question") renderQuestion();
    if (screen === "identity") renderIdentity();
    if (screen === "success") renderSuccess();
  }

  render();
}

function normalizeLinkedIn(value) {
  if (!value) return "";
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  return `https://${value}`;
}

function makeIntroCard(response) {
  const name = response.name || "Someone";
  const world = response.worlds?.[0] ? ` in ${response.worlds[0]}` : "";
  const target = response.desired_outcomes?.[0] ? response.desired_outcomes[0].toLowerCase() : "useful intros";
  const project = response.company_project ? ` (${response.company_project})` : "";
  const description = response.description ? ` Notes: ${response.description}.` : "";
  return `${name}${project}${world} wants to ${target}.${description}`;
}

function formatOption(option) {
  if (["yes", "maybe", "no"].includes(option)) return option[0].toUpperCase() + option.slice(1);
  return option;
}

function escapeAttr(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
}

function escapeHtml(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function faceMarkup() {
  return `
    <img class="face" src="./resources/Face%20Drawing.svg" alt="" aria-hidden="true" />
  `;
}
