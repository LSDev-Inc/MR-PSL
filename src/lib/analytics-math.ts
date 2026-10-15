export function responsePercentages(yes: number, no: number) {
  const safeYes = Number.isFinite(yes) && yes > 0 ? yes : 0;
  const safeNo = Number.isFinite(no) && no > 0 ? no : 0;
  const total = safeYes + safeNo;
  return {
    total,
    yes: safeYes,
    no: safeNo,
    yesPercentage: total ? Math.round((safeYes / total) * 1000) / 10 : 0,
    noPercentage: total ? Math.round((safeNo / total) * 1000) / 10 : 0,
  };
}
