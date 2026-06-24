const escapeHtml = (value) => {
  const text = value === null || value === undefined ? "" : String(value);

  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

const buildSummaryHtml = (summaryItems = []) => {
  if (!summaryItems.length) return "";

  return `
    <div class="summary-grid">
      ${summaryItems
        .map(
          (item) => `
            <div class="summary-card">
              <div class="summary-label">${escapeHtml(item.label)}</div>
              <div class="summary-value">${escapeHtml(item.value)}</div>
            </div>
          `
        )
        .join("")}
    </div>
  `;
};

const buildTableHtml = (columns = [], rows = []) => {
  return `
    <table>
      <thead>
        <tr>
          ${columns.map((column) => `<th>${escapeHtml(column.header)}</th>`).join("")}
        </tr>
      </thead>
      <tbody>
        ${rows
          .map(
            (row) => `
              <tr>
                ${columns
                  .map((column) => {
                    const value =
                      typeof column.accessor === "function"
                        ? column.accessor(row)
                        : row[column.accessor];

                    return `<td>${escapeHtml(value)}</td>`;
                  })
                  .join("")}
              </tr>
            `
          )
          .join("")}
        ${rows.length === 0 ? `<tr><td colspan="${columns.length}">No records found</td></tr>` : ""}
      </tbody>
    </table>
  `;
};

export const printReport = ({
  title,
  subtitle = "",
  summaryItems = [],
  columns = [],
  rows = [],
  footer = "THAKUR VIRENDRA SINGH MEMORIAL SCHOOL",
}) => {
  const printWindow = window.open("", "_blank", "width=1200,height=800");

  if (!printWindow) {
    alert("Popup blocked. Please allow popups to print/export PDF.");
    return;
  }

  const html = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(title)}</title>

        <style>
          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            padding: 24px;
            font-family: Arial, sans-serif;
            color: #0f172a;
            background: #ffffff;
          }

          .header {
            border-bottom: 2px solid #1d4ed8;
            padding-bottom: 14px;
            margin-bottom: 18px;
          }

          .school {
            font-size: 18px;
            font-weight: 900;
            color: #1d4ed8;
            text-transform: uppercase;
          }

          .board {
            margin-top: 4px;
            font-size: 12px;
            font-weight: 700;
            color: #475569;
          }

          h1 {
            margin: 18px 0 6px;
            font-size: 22px;
          }

          .subtitle {
            font-size: 13px;
            color: #475569;
            font-weight: 600;
          }

          .summary-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            margin: 18px 0;
          }

          .summary-card {
            border: 1px solid #cbd5e1;
            border-radius: 10px;
            padding: 10px;
            background: #f8fafc;
          }

          .summary-label {
            font-size: 11px;
            text-transform: uppercase;
            color: #64748b;
            font-weight: 800;
          }

          .summary-value {
            margin-top: 4px;
            font-size: 20px;
            font-weight: 900;
            color: #0f172a;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 14px;
            font-size: 11px;
          }

          th,
          td {
            border: 1px solid #cbd5e1;
            padding: 7px;
            text-align: left;
            vertical-align: top;
          }

          th {
            background: #e2e8f0;
            font-weight: 900;
            text-transform: uppercase;
            font-size: 10px;
          }

          .footer {
            margin-top: 18px;
            padding-top: 10px;
            border-top: 1px solid #cbd5e1;
            font-size: 11px;
            color: #64748b;
            display: flex;
            justify-content: space-between;
          }

          @media print {
            body {
              padding: 12px;
            }

            .summary-grid {
              grid-template-columns: repeat(4, 1fr);
            }

            table {
              page-break-inside: auto;
            }

            tr {
              page-break-inside: avoid;
              page-break-after: auto;
            }

            thead {
              display: table-header-group;
            }
          }
        </style>
      </head>

      <body>
        <div class="header">
          <div class="school">THAKUR VIRENDRA SINGH MEMORIAL SCHOOL</div>
          <div class="board">MPBSE Board • School ERP</div>
        </div>

        <h1>${escapeHtml(title)}</h1>
        ${subtitle ? `<div class="subtitle">${escapeHtml(subtitle)}</div>` : ""}

        ${buildSummaryHtml(summaryItems)}
        ${buildTableHtml(columns, rows)}

        <div class="footer">
          <span>${escapeHtml(footer)}</span>
          <span>Generated: ${escapeHtml(new Date().toLocaleString())}</span>
        </div>

        <script>
          window.onload = function() {
            window.focus();
            window.print();
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
};