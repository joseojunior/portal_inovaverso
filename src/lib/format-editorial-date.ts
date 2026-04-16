const formatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric"
});

export function formatEditorialDate(value: string | Date | null | undefined) {
  if (!value) {
    return "Sem data editorial";
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Sem data editorial";
  }

  return formatter.format(date);
}
