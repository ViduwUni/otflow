type DayType = "WEEKDAY" | "SATURDAY" | "SUNDAY";

function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function minutesDiff(start: number, end: number) {
  // cross midnight
  if (end < start) return end + 24 * 60 - start;
  return end - start;
}

function dayTypeFromDate(dateYYYYMMDD: string): DayType {
  // JS Date: 0=Sun ... 6=Sat. Use UTC to avoid timezone surprises.
  const d = new Date(dateYYYYMMDD + "T00:00:00Z");
  const day = d.getUTCDay();
  if (day === 0) return "SUNDAY";
  if (day === 6) return "SATURDAY";
  return "WEEKDAY";
}

export function calcOtMinutes(params: {
  workDate: string; // YYYY-MM-DD
  shift: string;
  inTime: string;
  outTime: string;
  isTripleDay: boolean;
}) {
  const inMin = toMinutes(params.inTime);
  const outMin = toMinutes(params.outTime);

  const total = minutesDiff(inMin, outMin);

  const nightCutoff = 21 * 60; // 21:00
  const isNight = (outMin < inMin ? outMin + 24 * 60 : outMin) >= nightCutoff;

  // If triple day: everything is triple (simple + matches your previous idea)
  if (params.isTripleDay) {
    return {
      normalMinutes: 0,
      doubleMinutes: 0,
      tripleMinutes: total,
      isNight,
    };
  }

  const type = dayTypeFromDate(params.workDate);

  // shift OT start times
  const otStart = params.shift.toLowerCase().includes("1")
    ? toMinutes("06:30")
    : toMinutes("08:30");

  // We assume OT counted from max(inTime, otStart) to outTime
  const startOt = Math.max(inMin, otStart);
  const endOt = outMin < inMin ? outMin + 24 * 60 : outMin;

  const otTotal = Math.max(0, endOt - startOt);

  // WEEKEND: treat as DOUBLE (common), SUNDAY could be DOUBLE unless triple configured
  if (type === "SATURDAY" || type === "SUNDAY") {
    return {
      normalMinutes: 0,
      doubleMinutes: otTotal,
      tripleMinutes: 0,
      isNight,
    };
  }

  // WEEKDAY:
  // - normal until 21:00
  // - double after 21:00
  const normalEnd = Math.min(endOt, nightCutoff);
  const normalMinutes = Math.max(0, normalEnd - startOt);

  const doubleMinutes = Math.max(0, endOt - Math.max(startOt, nightCutoff));

  return { normalMinutes, doubleMinutes, tripleMinutes: 0, isNight };
}
