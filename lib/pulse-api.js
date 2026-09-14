// Pure request logic for GET /api/pulse, kept separate from the HTTP layer
// so it can be exercised directly with in-memory pulse data.

export function computePulseResponse(data, { project, week }) {
  if (!project) {
    return { status: 400, body: { error: "project is required" } };
  }

  const knownProject = (data.projects || []).some((p) => p.id === project);
  if (!knownProject) {
    return { status: 404, body: { error: `unknown project: ${project}` } };
  }

  const membersById = new Map((data.members || []).map((m) => [m.id, m]));
  const projectCheckins = (data.checkins || []).filter(
    (c) => c.project === project,
  );

  const toMember = (checkin) => ({
    id: checkin.member,
    name: membersById.get(checkin.member)?.name ?? checkin.member,
    mood: checkin.mood,
    note: checkin.note,
  });

  if (week) {
    const members = projectCheckins
      .filter((c) => c.week === week)
      .map(toMember);
    return { status: 200, body: { project, week, members } };
  }

  const weeks = [...new Set(projectCheckins.map((c) => c.week))].sort();
  const latestWeek = weeks[weeks.length - 1] ?? null;

  const members = latestWeek
    ? projectCheckins.filter((c) => c.week === latestWeek).map(toMember)
    : [];

  const trend = weeks.map((w) => {
    const weekCheckins = projectCheckins.filter((c) => c.week === w);
    const avgMood =
      weekCheckins.reduce((sum, c) => sum + c.mood, 0) / weekCheckins.length;
    return { week: w, avgMood: Math.round(avgMood * 10) / 10 };
  });

  return { status: 200, body: { project, latestWeek, members, trend } };
}
