import { responsePercentages } from "@/lib/analytics-math";
import { connectDb } from "@/lib/db";
import { INSTITUTION_ID } from "@/lib/tenant";
import { AuditEvent, Campaign, SurveyResponse } from "@/models";

export async function getAnalytics() {
  await connectDb();
  const now = new Date();
  const since = new Date(now.getTime() - 29 * 86400000);
  const [counts, daily, campaign, recentEvents] = await Promise.all([
    SurveyResponse.aggregate([
      { $match: { institutionId: INSTITUTION_ID } },
      { $group: { _id: "$choice", count: { $sum: 1 } } },
    ]),
    SurveyResponse.aggregate([
      { $match: { institutionId: INSTITUTION_ID, createdAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { date: "$createdAt", format: "%Y-%m-%d", timezone: "Europe/Rome" } },
          total: { $sum: 1 },
          yes: { $sum: { $cond: [{ $eq: ["$choice", "yes"] }, 1, 0] } },
          no: { $sum: { $cond: [{ $eq: ["$choice", "no"] }, 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Campaign.findOne({ institutionId: INSTITUTION_ID }).select("status opensAt closesAt").lean(),
    AuditEvent.find({ institutionId: INSTITUTION_ID })
      .sort({ createdAt: -1 })
      .limit(6)
      .select("action actorRole result createdAt resource")
      .lean(),
  ]);
  const summary = responsePercentages(
    counts.find(item => item._id === "yes")?.count ?? 0,
    counts.find(item => item._id === "no")?.count ?? 0,
  );
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Rome",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const today = `${parts.find(part => part.type === "year")?.value}-${parts.find(part => part.type === "month")?.value}-${parts.find(part => part.type === "day")?.value}`;
  const [year, month, day] = today.split("-").map(Number);
  const chartData = Array.from({ length: 30 }, (_, index) => {
    const date = new Date(Date.UTC(year, month - 1, day - (29 - index))).toISOString().slice(0, 10);
    const point = daily.find(item => item._id === date);
    return { date, label: date.slice(5), total: point?.total ?? 0, yes: point?.yes ?? 0, no: point?.no ?? 0 };
  });
  const status = campaign?.status ?? "closed";
  const open =
    (status === "open" || (status === "scheduled" && campaign?.opensAt && campaign.opensAt <= now)) &&
    (!campaign?.closesAt || campaign.closesAt > now);
  return {
    ...summary,
    chartData,
    today: chartData.find(item => item.date === today)?.total ?? 0,
    status: open ? ("open" as const) : ("closed" as const),
    refreshedAt: now.toISOString(),
    recentEvents: recentEvents.map(event => ({
      id: String(event._id),
      action: event.action,
      actorRole: event.actorRole,
      result: event.result,
      createdAt: event.createdAt?.toISOString(),
      resource: event.resource,
    })),
  };
}
