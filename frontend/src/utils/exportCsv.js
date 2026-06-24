const escapeCsvValue = (value) => {
  const text = value === null || value === undefined ? "" : String(value);
  const escaped = text.replace(/"/g, '""');
  return `"${escaped}"`;
};

export const exportCsv = ({ fileName, columns, rows }) => {
  const header = columns.map((column) => escapeCsvValue(column.header)).join(",");

  const body = rows
    .map((row) =>
      columns
        .map((column) => {
          const value =
            typeof column.accessor === "function"
              ? column.accessor(row)
              : row[column.accessor];

          return escapeCsvValue(value);
        })
        .join(",")
    )
    .join("\n");

  const csv = `${header}\n${body}`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName.endsWith(".csv") ? fileName : `${fileName}.csv`;

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.URL.revokeObjectURL(url);
};