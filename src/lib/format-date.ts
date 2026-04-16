const DATE_LOCALE = "pt-BR";
const DATE_TIME_ZONE = "America/Manaus";

const shortDateFormatter = new Intl.DateTimeFormat(DATE_LOCALE, {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: DATE_TIME_ZONE
});

const dateTimeFormatter = new Intl.DateTimeFormat(DATE_LOCALE, {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: DATE_TIME_ZONE
});

function toDate(value: Date | string) {
  return value instanceof Date ? value : new Date(value);
}

export function formatShortDate(value: Date | string) {
  return shortDateFormatter.format(toDate(value));
}

export function formatDateTime(value: Date | string) {
  return dateTimeFormatter.format(toDate(value));
}
