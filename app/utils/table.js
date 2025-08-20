/**
 * This will map a table cell to a TableCell object.
 * This is useful for when we want to get the full table cell object from a partial table cell.
 * It is guaranteed to return a new TableCell object.
 */
export function mapTableCell(content) {
  return isTableCell(content)
    ? { ...content }
    : isPartialTableCell(content)
      ? {
          type: "tableCell",
          content: [].concat(content.content),
          props: {
            backgroundColor: content.props?.backgroundColor ?? "default",
            textColor: content.props?.textColor ?? "default",
            textAlignment: content.props?.textAlignment ?? "left",
            colspan: content.props?.colspan ?? 1,
            rowspan: content.props?.rowspan ?? 1,
          },
        }
      : {
          type: "tableCell",
          content: [].concat(content),
          props: {
            backgroundColor: "default",
            textColor: "default",
            textAlignment: "left",
            colspan: 1,
            rowspan: 1,
          },
        };
}

export function isPartialTableCell(content) {
  return (
    content !== undefined &&
    content !== null &&
    typeof content !== "string" &&
    !Array.isArray(content) &&
    content.type === "tableCell"
  );
}

export function isTableCell(content) {
  return (
    isPartialTableCell(content) &&
    content.props !== undefined &&
    content.content !== undefined
  );
}

export function getColspan(cell) {
  if (isTableCell(cell)) {
    return cell.props.colspan ?? 1;
  }
  return 1;
}

export function getRowspan(cell) {
  if (isTableCell(cell)) {
    return cell.props.rowspan ?? 1;
  }
  return 1;
}
