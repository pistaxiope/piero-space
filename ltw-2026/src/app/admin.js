import { getIntroResponses } from "../lib/saveIntroResponse.js";

const root = document.querySelector("#admin");
const responses = getIntroResponses();

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

root.innerHTML = `
  <section class="admin-header">
    <a class="text-link" href="./index.html">Back</a>
    <h1>LTW responses</h1>
    <p>${responses.length} saved locally</p>
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
