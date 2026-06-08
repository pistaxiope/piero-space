const root = document.querySelector("#admin");
const SESSION_KEY = "ltw-2026-admin-password";

function cell(value) {
  const text = Array.isArray(value) ? value.join(", ") : value || "-";
  return `<td>${escapeHtml(text)}</td>`;
}

function linkedinCell(value) {
  if (!value) return "<td>-</td>";
  return `<td><a class="text-link" href="${escapeHtml(value)}" target="_blank" rel="noreferrer">Open</a></td>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderLogin(message = "") {
  root.innerHTML = `
    <section class="admin-header">
      <a class="text-link" href="./index.html">Back</a>
      <h1>LTW responses</h1>
      <p>Enter the admin password to view responses.</p>
    </section>
    <section class="admin-login">
      <form id="login-form" class="admin-login-form">
        <input id="password" type="password" placeholder="Admin password" autocomplete="current-password" />
        <button type="submit">View responses</button>
      </form>
      ${message ? `<p class="admin-error">${escapeHtml(message)}</p>` : ""}
    </section>
  `;
  const form = document.querySelector("#login-form");
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const password = document.querySelector("#password").value.trim();
    if (!password) return;
    loadResponses(password);
  });
}

function renderTable(responses) {
  root.innerHTML = `
    <section class="admin-header">
      <a class="text-link" href="./index.html">Back</a>
      <h1>LTW responses</h1>
      <p>${responses.length} response${responses.length === 1 ? "" : "s"} · <button id="logout" class="text-link admin-logout">Log out</button></p>
    </section>
    <section class="response-table-wrap">
      <table class="response-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>LinkedIn</th>
            <th>Trying to make happen</th>
            <th>Worlds</th>
            <th>Company/project</th>
            <th>Description</th>
            <th>AI circle</th>
            <th>Card</th>
          </tr>
        </thead>
        <tbody>
          ${
            responses.length
              ? responses
                  .map(
                    (response) => `
                      <tr>
                        ${cell(response.name)}
                        ${linkedinCell(response.linkedin_url)}
                        ${cell(response.desired_outcomes)}
                        ${cell(response.worlds)}
                        ${cell(response.company_project)}
                        ${cell(response.description)}
                        ${cell(response.post_ltw_ai_circle ? "yes" : "no")}
                        ${cell(response.ai_intro_card)}
                      </tr>
                    `,
                  )
                  .join("")
              : `<tr><td colspan="8">No responses yet.</td></tr>`
          }
        </tbody>
      </table>
    </section>
  `;
  document.querySelector("#logout").addEventListener("click", () => {
    sessionStorage.removeItem(SESSION_KEY);
    renderLogin();
  });
}

async function loadResponses(password) {
  root.innerHTML = `<section class="admin-header"><h1>LTW responses</h1><p>Loading…</p></section>`;
  try {
    const res = await fetch("/api/intro", {
      headers: { authorization: `Bearer ${password}` },
    });
    if (res.status === 401) {
      sessionStorage.removeItem(SESSION_KEY);
      renderLogin("Wrong password.");
      return;
    }
    if (!res.ok) {
      renderLogin("Something went wrong. Try again.");
      return;
    }
    const data = await res.json();
    sessionStorage.setItem(SESSION_KEY, password);
    renderTable(data.responses || []);
  } catch (error) {
    console.log("[v0] loadResponses error:", error.message);
    renderLogin("Could not reach the server.");
  }
}

const saved = sessionStorage.getItem(SESSION_KEY);
if (saved) {
  loadResponses(saved);
} else {
  renderLogin();
}
