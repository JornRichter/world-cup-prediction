"use client";

import React, {  home: string;import React, { useEffect, useMemo, useRef, useState } from "react";
  away: string;
  venue: string;
  homeScore: number | null;
  awayScore: number | null;
};

type Prediction = { home: number | null; away: number | null };
type League = { id: string; code: string; name: string };
type Theme = "classic" | "glass" | "midnight";
type Scoring = { exactPoints: number; outcomePoints: number; drawBonus: number };

type LeaguePlayerRow = {
  id: string;
  league_id: string;
  user_id: string | null;
  name: string;
};

type PredictionRow = {
  league_id: string;
  user_id: string | null;
  player_name: string;
  match_id: number;
  home_score: number | null;
  away_score: number | null;
};

type ResultRow = {
  league_id: string;
  match_id: number;
  home_score: number | null;
  away_score: number | null;
};

const DEFAULT_SCORING: Scoring = {
  exactPoints: 5,
  outcomePoints: 2,
  drawBonus: 1,
};

const TEAM_FLAGS: Record<string, string> = {
  Mexico: "🇲🇽",
  "South Africa": "🇿🇦",
  "Korea Republic": "🇰🇷",
  Czechia: "🇨🇿",
  Canada: "🇨🇦",
  "Bosnia and Herzegovina": "🇧🇦",
  USA: "🇺🇸",
  Paraguay: "🇵🇾",
  Haiti: "🇭🇹",
  Scotland: "🏴",
  Australia: "🇦🇺",
  Türkiye: "🇹🇷",
  Brazil: "🇧🇷",
  Morocco: "🇲🇦",
  Qatar: "🇶🇦",
  Switzerland: "🇨🇭",
  "Côte d'Ivoire": "🇨🇮",
  Ecuador: "🇪🇨",
  Germany: "🇩🇪",
  Curaçao: "🇨🇼",
  Netherlands: "🇳🇱",
  Japan: "🇯🇵",
  Sweden: "🇸🇪",
  Tunisia: "🇹🇳",
  "Saudi Arabia": "🇸🇦",
  Uruguay: "🇺🇾",
  Spain: "🇪🇸",
  "Cabo Verde": "🇨🇻",
  "IR Iran": "🇮🇷",
  "New Zealand": "🇳🇿",
  Belgium: "🇧🇪",
  Egypt: "🇪🇬",
  France: "🇫🇷",
  Senegal: "🇸🇳",
  Iraq: "🇮🇶",
  Norway: "🇳🇴",
  Argentina: "🇦🇷",
  Algeria: "🇩🇿",
  Austria: "🇦🇹",
  Jordan: "🇯🇴",
  Ghana: "🇬🇭",
  Panama: "🇵🇦",
  England: "🏴",
  Croatia: "🇭🇷",
  Portugal: "🇵🇹",
  "Congo DR": "🇨🇩",
  Uzbekistan: "🇺🇿",
  Colombia: "🇨🇴",
};

const FIXTURES_TEXT = `
1|2026-06-11|Group Stage|A|Mexico|South Africa|Mexico City Stadium|2|0
2|2026-06-11|Group Stage|A|Korea Republic|Czechia|Guadalajara Stadium|2|1
3|2026-06-12|Group Stage|B|Canada|Bosnia and Herzegovina|Toronto Stadium||
4|2026-06-12|Group Stage|D|USA|Paraguay|Los Angeles Stadium||
5|2026-06-13|Group Stage|C|Haiti|Scotland|Boston Stadium||
6|2026-06-13|Group Stage|D|Australia|Türkiye|BC Place Vancouver||
7|2026-06-13|Group Stage|C|Brazil|Morocco|New York New Jersey Stadium||
8|2026-06-13|Group Stage|B|Qatar|Switzerland|San Francisco Bay Area Stadium||
9|2026-06-14|Group Stage|E|Côte d'Ivoire|Ecuador|Philadelphia Stadium||
10|2026-06-14|Group Stage|E|Germany|Curaçao|Houston Stadium||
11|2026-06-14|Group Stage|F|Netherlands|Japan|Dallas Stadium||
12|2026-06-14|Group Stage|F|Sweden|Tunisia|Estadio Monterrey||
13|2026-06-15|Group Stage|H|Saudi Arabia|Uruguay|Miami Stadium||
14|2026-06-15|Group Stage|H|Spain|Cabo Verde|Atlanta Stadium||
15|2026-06-15|Group Stage|G|IR Iran|New Zealand|Los Angeles Stadium||
16|2026-06-15|Group Stage|G|Belgium|Egypt|Seattle Stadium||
17|2026-06-16|Group Stage|I|France|Senegal|New York New Jersey Stadium||
18|2026-06-16|Group Stage|I|Iraq|Norway|Boston Stadium||
19|2026-06-16|Group Stage|J|Argentina|Algeria|Kansas City Stadium||
20|2026-06-16|Group Stage|J|Austria|Jordan|San Francisco Bay Area Stadium||
21|2026-06-17|Group Stage|L|Ghana|Panama|Toronto Stadium||
22|2026-06-17|Group Stage|L|England|Croatia|Dallas Stadium||
23|2026-06-17|Group Stage|K|Portugal|Congo DR|Houston Stadium||
24|2026-06-17|Group Stage|K|Uzbekistan|Colombia|Mexico City Stadium||
25|2026-06-18|Group Stage|A|Czechia|South Africa|Atlanta Stadium||
26|2026-06-18|Group Stage|B|Switzerland|Bosnia and Herzegovina|Los Angeles Stadium||
27|2026-06-18|Group Stage|B|Canada|Qatar|BC Place Vancouver||
28|2026-06-18|Group Stage|A|Mexico|Korea Republic|Guadalajara Stadium||
29|2026-06-19|Group Stage|C|Brazil|Haiti|Philadelphia Stadium||
30|2026-06-19|Group Stage|C|Scotland|Morocco|Boston Stadium||
31|2026-06-19|Group Stage|D|Türkiye|Paraguay|San Francisco Bay Area Stadium||
32|2026-06-19|Group Stage|D|USA|Australia|Seattle Stadium||
33|2026-06-20|Group Stage|E|Germany|Côte d'Ivoire|Toronto Stadium||
34|2026-06-20|Group Stage|E|Ecuador|Curaçao|Kansas City Stadium||
35|2026-06-20|Group Stage|F|Netherlands|Sweden|Houston Stadium||
36|2026-06-20|Group Stage|F|Tunisia|Japan|Estadio Monterrey||
37|2026-06-21|Group Stage|H|Uruguay|Cabo Verde|Miami Stadium||
38|2026-06-21|Group Stage|H|Spain|Saudi Arabia|Atlanta Stadium||
39|2026-06-21|Group Stage|G|Belgium|IR Iran|Los Angeles Stadium||
40|2026-06-21|Group Stage|G|New Zealand|Egypt|BC Place Vancouver||
41|2026-06-22|Group Stage|I|Norway|Senegal|New York New Jersey Stadium||
42|2026-06-22|Group Stage|I|France|Iraq|Philadelphia Stadium||
43|2026-06-22|Group Stage|J|Argentina|Austria|Dallas Stadium||
44|2026-06-22|Group Stage|J|Jordan|Algeria|San Francisco Bay Area Stadium||
45|2026-06-23|Group Stage|L|England|Ghana|Boston Stadium||
46|2026-06-23|Group Stage|L|Panama|Croatia|Toronto Stadium||
47|2026-06-23|Group Stage|K|Portugal|Uzbekistan|Houston Stadium||
48|2026-06-23|Group Stage|K|Colombia|Congo DR|Guadalajara Stadium||
49|2026-06-24|Group Stage|C|Scotland|Brazil|Miami Stadium||
50|2026-06-24|Group Stage|C|Morocco|Haiti|Atlanta Stadium||
51|2026-06-24|Group Stage|B|Switzerland|Canada|BC Place Vancouver||
52|2026-06-24|Group Stage|B|Bosnia and Herzegovina|Qatar|Seattle Stadium||
53|2026-06-24|Group Stage|A|Czechia|Mexico|Mexico City Stadium||
54|2026-06-24|Group Stage|A|South Africa|Korea Republic|Estadio Monterrey||
55|2026-06-25|Group Stage|E|Curaçao|Côte d'Ivoire|Philadelphia Stadium||
56|2026-06-25|Group Stage|E|Ecuador|Germany|New York New Jersey Stadium||
57|2026-06-25|Group Stage|F|Japan|Sweden|Dallas Stadium||
58|2026-06-25|Group Stage|F|Tunisia|Netherlands|Kansas City Stadium||
59|2026-06-25|Group Stage|D|Türkiye|USA|Los Angeles Stadium||
60|2026-06-25|Group Stage|D|Paraguay|Australia|San Francisco Bay Area Stadium||
61|2026-06-26|Group Stage|I|Norway|France|Boston Stadium||
62|2026-06-26|Group Stage|I|Senegal|Iraq|Toronto Stadium||
63|2026-06-26|Group Stage|G|Egypt|IR Iran|Seattle Stadium||
64|2026-06-26|Group Stage|G|New Zealand|Belgium|BC Place Vancouver||
65|2026-06-26|Group Stage|H|Cabo Verde|Saudi Arabia|Houston Stadium||
66|2026-06-26|Group Stage|H|Uruguay|Spain|Guadalajara Stadium||
67|2026-06-27|Group Stage|L|Panama|England|New York New Jersey Stadium||
68|2026-06-27|Group Stage|L|Croatia|Ghana|Philadelphia Stadium||
69|2026-06-27|Group Stage|J|Algeria|Austria|Kansas City Stadium||
70|2026-06-27|Group Stage|J|Jordan|Argentina|Dallas Stadium||
71|2026-06-27|Group Stage|K|Colombia|Portugal|Miami Stadium||
72|2026-06-27|Group Stage|K|Congo DR|Uzbekistan|Atlanta Stadium||
73|2026-06-28|Round of 32||Group A runners-up|Group B runners-up|Los Angeles Stadium||
74|2026-06-29|Round of 32||Group E winners|Group A/B/C/D/F third place|Boston Stadium||
75|2026-06-29|Round of 32||Group F winners|Group C runners-up|Estadio Monterrey||
76|2026-06-29|Round of 32||Group C winners|Group F runners-up|Houston Stadium||
77|2026-06-30|Round of 32||Group I winners|Group C/D/F/G/H third place|New York New Jersey Stadium||
78|2026-06-30|Round of 32||Group E runners up|Group I runners-up|Dallas Stadium||
79|2026-06-30|Round of 32||Group A winners|Group C/E/F/H/I third place|Mexico City Stadium||
80|2026-07-01|Round of 32||Group L winners|Group E/H/I/J/K third place|Atlanta Stadium||
81|2026-07-01|Round of 32||Group D winners|Group B/E/F/I/J third place|San Francisco Bay Area Stadium||
82|2026-07-01|Round of 32||Group G winners|Group A/E/H/I/J third place|Seattle Stadium||
83|2026-07-02|Round of 32||Group K runners-up|Group L runners-up|Toronto Stadium||
84|2026-07-02|Round of 32||Group H winners|Group J runners-up|Los Angeles Stadium||
85|2026-07-02|Round of 32||Group B winners|Group E/F/G/I/J third place|BC Place Vancouver||
86|2026-07-03|Round of 32||Group J winners|Group H runners-up|Miami Stadium||
87|2026-07-03|Round of 32||Group K winners|Group D/E/I/J/L third place|Kansas City Stadium||
88|2026-07-03|Round of 32||Group D runners-up|Group G runners-up|Dallas Stadium||
89|2026-07-04|Round of 16||Winner match 74|Winner match 77|Philadelphia Stadium||
90|2026-07-04|Round of 16||Winner match 73|Winner match 75|Houston Stadium||
91|2026-07-05|Round of 16||Winner match 76|Winner match 78|New York New Jersey Stadium||
92|2026-07-05|Round of 16||Winner match 79|Winner match 80|Mexico City Stadium||
93|2026-07-06|Round of 16||Winner match 83|Winner match 84|Dallas Stadium||
94|2026-07-06|Round of 16||Winner match 81|Winner match 82|Seattle Stadium||
95|2026-07-07|Round of 16||Winner match 86|Winner match 88|Atlanta Stadium||
96|2026-07-07|Round of 16||Winner match 85|Winner match 87|BC Place Vancouver||
97|2026-07-09|Quarter-final||Winner match 89|Winner match 90|Boston Stadium||
98|2026-07-10|Quarter-final||Winner match 93|Winner match 94|Los Angeles Stadium||
99|2026-07-11|Quarter-final||Winner match 91|Winner match 92|Miami Stadium||
100|2026-07-11|Quarter-final||Winner match 95|Winner match 96|Kansas City Stadium||
101|2026-07-14|Semi-final||Winner match 97|Winner match 98|Dallas Stadium||
102|2026-07-15|Semi-final||Winner match 99|Winner match 100|Atlanta Stadium||
103|2026-07-18|Bronze Final||Runner-up match 101|Runner-up match 102|Miami Stadium||
104|2026-07-19|Final||Winner match 101|Winner match 102|New York New Jersey Stadium||
`.trim();

function seedMatches(): Match[] {
  return FIXTURES_TEXT.split("\n").map((line) => {
    const [id, date, stage, group, home, away, venue, homeScore, awayScore] = line.split("|");

    return {
      id: Number(id),
      date,
      stage,
      group: group || null,
      home,
      away,
      venue,
      homeScore: homeScore === "" ? null : Number(homeScore),
      awayScore: awayScore === "" ? null : Number(awayScore),
    };
  });
}

function mergeResults(baseMatches: Match[], resultRows: ResultRow[]): Match[] {
  const map = new Map(resultRows.map((r) => [r.match_id, r]));
  return baseMatches.map((m) => {
    const found = map.get(m.id);
    return found ? { ...m, homeScore: found.home_score, awayScore: found.away_score } : m;
  });
}

function outcome(home: number | null, away: number | null) {
  if (home == null || away == null) return null;
  if (home > away) return "H";
  if (home < away) return "A";
  return "D";
}

function isDraw(home: number | null, away: number | null) {
  return home != null && away != null && home === away;
}

function formatDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    weekday: "short",
  });
}

function getFlag(team: string) {
  return TEAM_FLAGS[team] || "🏟️";
}

function getLeagueCode(name: string) {
  const clean = (name || "LEAGUE").replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 6);
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${clean || "WC"}-${random}`;
}

function getPoints(pred: Prediction | undefined, match: Match, scoring: Scoring) {
  if (!pred || pred.home == null || pred.away == null) return 0;
  if (match.homeScore == null || match.awayScore == null) return 0;
  if (pred.home === match.homeScore && pred.away === match.awayScore) return scoring.exactPoints;
  if (outcome(pred.home, pred.away) === outcome(match.homeScore, match.awayScore)) {
    return scoring.outcomePoints + (isDraw(pred.home, pred.away) && isDraw(match.homeScore, match.awayScore) ? scoring.drawBonus : 0);
  }
  return 0;
}

function getLockDate(match: Match) {
  return new Date(`${match.date}T12:00:00`);
}

function isLocked(match: Match, adminMode: boolean) {
  if (adminMode) return false;
  return new Date() >= getLockDate(match);
}

function themeClasses(theme: Theme) {
  if (theme === "midnight") {
    return {
      page: "min-h-screen bg-slate-950 text-white",
      card: "bg-slate-900 border-slate-800 text-white",
      soft: "bg-slate-800",
      sub: "text-slate-400",
      input: "bg-slate-950 border-slate-700 text-white",
      inactiveTab: "hover:bg-slate-800",
    };
  }

  if (theme === "glass") {
    return {
      page: "min-h-screen bg-gradient-to-br from-sky-50 via-white to-indigo-50 text-slate-900",
      card: "bg-white/80 backdrop-blur border-white/60 text-slate-900",
      soft: "bg-white/70",
      sub: "text-slate-500",
      input: "bg-white/90 border-slate-200 text-slate-900",
      inactiveTab: "hover:bg-slate-100",
    };
  }

  return {
    page: "min-h-screen bg-slate-50 text-slate-900",
    card: "bg-white border-slate-200 text-slate-900",
    soft: "bg-slate-50",
    sub: "text-slate-500",
    input: "bg-white border-slate-200 text-slate-900",
    inactiveTab: "hover:bg-slate-100",
  };
}

function StatCard({
  label,
  value,
  sub,
  dark = false,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  dark?: boolean;
}) {
  return (
    <div className={`rounded-2xl border px-4 py-3 ${dark ? "border-white/15 bg-white/10 text-white" : "border-slate-200 bg-white"}`}>
      <div className={`text-xs ${dark ? "text-white/70" : "text-slate-500"}`}>{label}</div>
      <div className="text-xl font-bold">{value}</div>
      {sub ? <div className={`text-xs mt-1 ${dark ? "text-white/70" : "text-slate-500"}`}>{sub}</div> : null}
    </div>
  );
}

function MatchCard({
  match,
  prediction,
  selectedPlayer,
  onPredict,
  onResultUpdate,
  scoring,
  adminMode,
  theme,
}: {
  match: Match;
  prediction?: Prediction;
  selectedPlayer: string;
  onPredict: (matchId: number, side: "home" | "away", value: string) => void;
  onResultUpdate: (matchId: number, field: "homeScore" | "awayScore", value: string) => void;
  scoring: Scoring;
  adminMode: boolean;
  theme: Theme;
}) {
  const t = themeClasses(theme);
  const locked = isLocked(match, adminMode);
  const pts = getPoints(prediction, match, scoring);
  const completed = match.homeScore != null && match.awayScore != null;

  return (
    <div className={`rounded-3xl border shadow-sm ${t.card}`}>
      <div className="p-4 md:p-5 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap gap-2 mb-2 items-center">
              <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">{match.stage}</span>
              {match.group ? <span className="rounded-full border px-3 py-1 text-xs font-semibold">Group {match.group}</span> : null}
              <span className="rounded-full border px-3 py-1 text-xs">Match {match.id}</span>
              {locked ? <span className="rounded-full bg-amber-100 text-amber-800 px-3 py-1 text-xs font-semibold">Locked</span> : null}
            </div>
            <div className={`text-sm ${t.sub}`}>{formatDate(match.date)} • {match.venue}</div>
          </div>

          <div className="text-right">
            <div className={`text-xs ${t.sub}`}>{selectedPlayer}'s prediction</div>
            <div className="text-base font-semibold">{prediction?.home ?? "–"} : {prediction?.away ?? "–"}</div>
            {completed ? <div className="mt-1 text-xs font-medium text-emerald-600">+{pts} pts</div> : null}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-3 items-center">
          <div className={`rounded-2xl p-4 ${t.soft}`}>
            <div className={`text-xs ${t.sub}`}>Home</div>
            <div className="mt-1 flex items-center gap-2 text-lg font-semibold">
              <span>{getFlag(match.home)}</span>
              <span>{match.home}</span>
            </div>
          </div>

          <div className="text-center">
            <div className={`text-xs uppercase tracking-wide ${t.sub}`}>Official result</div>
            <div className="text-2xl font-bold">{match.homeScore ?? "–"} : {match.awayScore ?? "–"}</div>
          </div>

          <div className={`rounded-2xl p-4 text-right ${t.soft}`}>
            <div className={`text-xs ${t.sub}`}>Away</div>
            <div className="mt-1 flex items-center justify-end gap-2 text-lg font-semibold">
              <span>{match.away}</span>
              <span>{getFlag(match.away)}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
          <div className="rounded-2xl border p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-semibold">Enter prediction</div>
              <div className={`text-xs ${t.sub}`}>{locked ? "Locked at local noon" : "Open"}</div>
            </div>

            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              <input
                className={`h-10 rounded-xl border px-3 ${t.input}`}
                type="number"
                min="0"
                disabled={locked && !adminMode}
                value={prediction?.home ?? ""}
                onChange={(e) => onPredict(match.id, "home", e.target.value)}
                placeholder="0"
              />
              <span className={t.sub}>:</span>
              <input
                className={`h-10 rounded-xl border px-3 ${t.input}`}
                type="number"
                min="0"
                disabled={locked && !adminMode}
                value={prediction?.away ?? ""}
                onChange={(e) => onPredict(match.id, "away", e.target.value)}
                placeholder="0"
              />
            </div>

            <div className={`text-xs ${t.sub}`}>
              Scoring: exact {scoring.exactPoints}, outcome {scoring.outcomePoints}, draw bonus +{scoring.drawBonus}
            </div>
          </div>

          <div className={`rounded-2xl border p-4 space-y-3 ${t.soft}`}>
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-semibold">Update official result</div>
              <div className={`text-xs ${t.sub}`}>{adminMode ? "Admin enabled" : "Admin only"}</div>
            </div>

            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              <input
                className={`h-10 rounded-xl border px-3 ${t.input}`}
                type="number"
                min="0"
                disabled={!adminMode}
                value={match.homeScore ?? ""}
                onChange={(e) => onResultUpdate(match.id, "homeScore", e.target.value)}
                placeholder="0"
              />
              <span className={t.sub}>:</span>
              <input
                className={`h-10 rounded-xl border px-3 ${t.input}`}
                type="number"
                min="0"
                disabled={!adminMode}
                value={match.awayScore ?? ""}
                onChange={(e) => onResultUpdate(match.id, "awayScore", e.target.value)}
                placeholder="0"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BracketCard({ match, theme }: { match: Match; theme: Theme }) {
  const t = themeClasses(theme);

  return (
    <div className={`rounded-2xl border shadow-sm p-3 ${t.card}`}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="rounded-full border px-2 py-1 text-xs">M{match.id}</span>
        <span className={`text-xs ${t.sub}`}>{formatDate(match.date)}</span>
      </div>

      <div className="space-y-2">
        <div className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2 ${t.soft}`}>
          <div className="flex min-w-0 items-center gap-2">
            <span>{getFlag(match.home)}</span>
            <span className="truncate text-sm font-medium">{match.home}</span>
          </div>
          <span className="text-sm font-semibold">{match.homeScore ?? "–"}</span>
        </div>

        <div className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2 ${t.soft}`}>
          <div className="flex min-w-0 items-center gap-2">
            <span>{getFlag(match.away)}</span>
            <span className="truncate text-sm font-medium">{match.away}</span>
          </div>
          <span className="text-sm font-semibold">{match.awayScore ?? "–"}</span>
        </div>
      </div>

      <div className={`mt-2 text-xs ${t.sub}`}>{match.venue}</div>
    </div>
  );
}

export default function WorldCupPredictionChallenge() {
  const baseMatches = useMemo(() => seedMatches(), []);
  const [authUser, setAuthUser] = useState<any>(null);
  const [displayName, setDisplayName] = useState("");

  const [league, setLeague] = useState<League | null>(null);
  const [leagueName, setLeagueName] = useState("Friends World Cup League");
  const [leagueCodeInput, setLeagueCodeInput] = useState("");
  const [players, setPlayers] = useState<string[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const [predictions, setPredictions] = useState<Record<string, Record<number, Prediction>>>({});
  const [matches, setMatches] = useState<Match[]>(baseMatches);
  const [adminMode, setAdminMode] = useState(false);
  const [scoring, setScoring] = useState<Scoring>(DEFAULT_SCORING);
  const [theme, setTheme] = useState<Theme>("classic");
  const [activeTab, setActiveTab] = useState("matches");
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("All stages");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [jsonText, setJsonText] = useState("");
  const [connectedRealtime, setConnectedRealtime] = useState(false);

  const knockoutStages = ["Round of 32", "Round of 16", "Quarter-final", "Semi-final", "Bronze Final", "Final"];
  const stageOrder = ["Group Stage", ...knockoutStages];
  const channelRef = useRef<any>(null);
  const t = themeClasses(theme);

  useEffect(() => {
    async function loadUserAndMaybeLeague() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setAuthUser(null);
        setDisplayName("");
        return;
      }

      setAuthUser(user);

      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .maybeSingle();

      const resolvedDisplayName = getDisplayName(profile, user);
      setDisplayName(resolvedDisplayName);
      setSelectedPlayer(resolvedDisplayName);

      if (typeof window !== "undefined") {
        const savedCode = window.localStorage.getItem("wc-last-league-code");
        if (savedCode) {
          setLeagueCodeInput(savedCode);
          await joinLeague(savedCode, user, resolvedDisplayName);
        }
      }
    }

    void loadUserAndMaybeLeague();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!league?.id) return;

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channel = supabase
      .channel(`league-${league.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "league_players", filter: `league_id=eq.${league.id}` }, () => {
        void refreshLeagueData(league.id);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "league_predictions", filter: `league_id=eq.${league.id}` }, () => {
        void refreshLeagueData(league.id);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "league_results", filter: `league_id=eq.${league.id}` }, () => {
        void refreshLeagueData(league.id);
      })
      .subscribe((state) => {
        setConnectedRealtime(state === "SUBSCRIBED");
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      setConnectedRealtime(false);
    };
  }, [league?.id]);

  async function refreshLeagueData(leagueId: string) {
    const [playersRes, predsRes, resultsRes] = await Promise.all([
      supabase
        .from("league_players")
        .select("id, league_id, user_id, name")
        .eq("league_id", leagueId)
        .order("name"),
      supabase
        .from("league_predictions")
        .select("league_id, user_id, player_name, match_id, home_score, away_score")
        .eq("league_id", leagueId),
      supabase
        .from("league_results")
        .select("league_id, match_id, home_score, away_score")
        .eq("league_id", leagueId),
    ]);

    if (playersRes.error) setStatus(playersRes.error.message);
    if (predsRes.error) setStatus(predsRes.error.message);
    if (resultsRes.error) setStatus(resultsRes.error.message);

    const playerRows = (playersRes.data || []) as LeaguePlayerRow[];
    const predRows = (predsRes.data || []) as PredictionRow[];
    const resultRows = (resultsRes.data || []) as ResultRow[];

    const nextPlayers = playerRows.map((p) => p.name);
    setPlayers(nextPlayers);

    if (!nextPlayers.includes(selectedPlayer)) {
      setSelectedPlayer(nextPlayers[0] || "");
    }

    const nextPredictions: Record<string, Record<number, Prediction>> = {};
    for (const row of predRows) {
      if (!nextPredictions[row.player_name]) nextPredictions[row.player_name] = {};
      nextPredictions[row.player_name][row.match_id] = {
        home: row.home_score,
        away: row.away_score,
      };
    }

    setPredictions(nextPredictions);
    setMatches(mergeResults(baseMatches, resultRows));
  }

  async function createLeague() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setStatus("You must be logged in to create a league.");
      return;
    }

    const ownerDisplayName = displayName || user.email?.split("@")[0] || "Player";
    const leagueNameClean = leagueName.trim() || "Friends World Cup League";

    setLoading(true);
    setStatus("Creating league...");

    const code = getLeagueCode(leagueNameClean);

    const leagueInsert = await supabase
      .from("leagues")
      .insert({ name: leagueNameClean, code })
      .select("id, code, name")
      .single();

    if (leagueInsert.error || !leagueInsert.data) {
      setLoading(false);
      setStatus(leagueInsert.error?.message || "Could not create league.");
      return;
    }

    const createdLeague = leagueInsert.data as League;

    const playerInsert = await supabase.from("league_players").insert({
      league_id: createdLeague.id,
      user_id: user.id,
      name: ownerDisplayName,
    });

    if (playerInsert.error) {
      setLoading(false);
      setStatus(playerInsert.error.message);
      return;
    }

    setLeague(createdLeague);
    setSelectedPlayer(ownerDisplayName);
    setLeagueCodeInput(createdLeague.code);

    if (typeof window !== "undefined") {
      window.localStorage.setItem("wc-last-league-code", createdLeague.code);
    }

    await refreshLeagueData(createdLeague.id);
    setLoading(false);
    setStatus(`League ${createdLeague.code} created.`);
  }

  async function joinLeague(codeRaw?: string, forcedUser?: any, forcedDisplayName?: string) {
    const user = forcedUser ?? authUser;
    const name = forcedDisplayName ?? displayName;

    if (!user) {
      setStatus("You must be logged in to join a league.");
      return;
    }

    const code = (codeRaw ?? leagueCodeInput).trim().toUpperCase();
    if (!code) {
      setStatus("Enter a league code.");
      return;
    }

    setLoading(true);
    setStatus("Joining league...");

    const foundLeague = await supabase
      .from("leagues")
      .select("id, code, name")
      .eq("code", code)
      .single();

    if (foundLeague.error || !foundLeague.data) {
      setLoading(false);
      setStatus("League not found.");
      return;
    }

    const lg = foundLeague.data as League;
    const playerDisplayName = name || user.email?.split("@")[0] || "Player";

    const existingPlayer = await supabase
      .from("league_players")
      .select("id")
      .eq("league_id", lg.id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!existingPlayer.data) {
      const insert = await supabase.from("league_players").insert({
        league_id: lg.id,
        user_id: user.id,
        name: playerDisplayName,
      });

      if (insert.error) {
        setLoading(false);
        setStatus(insert.error.message);
        return;
      }
    }

    setLeague(lg);
    setSelectedPlayer(playerDisplayName);
    setLeagueCodeInput(lg.code);

    if (typeof window !== "undefined") {
      window.localStorage.setItem("wc-last-league-code", lg.code);
    }

    await refreshLeagueData(lg.id);
    setLoading(false);
    setStatus(`Joined league ${lg.code}.`);
  }

  async function upsertPrediction(matchId: number, side: "home" | "away", rawValue: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !league) {
      setStatus("You must be logged in and inside a league.");
      return;
    }

    const match = matches.find((m) => m.id === matchId);
    if (!match) return;
    if (isLocked(match, adminMode) && !adminMode) return;

    const current = predictions[selectedPlayer]?.[matchId] || { home: null, away: null };
    const nextValue = rawValue === "" ? null : Math.max(0, Number(rawValue));
    const nextPred = { ...current, [side]: nextValue };

    setPredictions((prev) => ({
      ...prev,
      [selectedPlayer]: {
        ...(prev[selectedPlayer] || {}),
        [matchId]: nextPred,
      },
    }));

    const { error } = await supabase.from("league_predictions").upsert(
      {
        league_id: league.id,
        user_id: user.id,
        player_name: selectedPlayer,
        match_id: matchId,
        home_score: nextPred.home,
        away_score: nextPred.away,
      },
      { onConflict: "league_id,user_id,match_id" }
    );

    if (error) setStatus(error.message);
  }

  async function upsertResult(matchId: number, field: "homeScore" | "awayScore", rawValue: string) {
    if (!league || !adminMode) return;

    const match = matches.find((m) => m.id === matchId);
    if (!match) return;

    const nextValue = rawValue === "" ? null : Math.max(0, Number(rawValue));
    const home = field === "homeScore" ? nextValue : match.homeScore;
    const away = field === "awayScore" ? nextValue : match.awayScore;

    setMatches((prev) =>
      prev.map((m) => (m.id === matchId ? { ...m, homeScore: home, awayScore: away } : m))
    );

    const { error } = await supabase.from("league_results").upsert(
      {
        league_id: league.id,
        match_id: matchId,
        home_score: home,
        away_score: away,
      },
      { onConflict: "league_id,match_id" }
    );

    if (error) setStatus(error.message);
  }

  const leaderboard = useMemo(() => {
    return players
      .map((player) => {
        let total = 0;
        let exact = 0;
        let outcomeOnly = 0;

        matches.forEach((match) => {
          const pred = predictions[player]?.[match.id];
          const pts = getPoints(pred, match, scoring);
          total += pts;

          if (pred && match.homeScore != null && match.awayScore != null) {
            if (pred.home === match.homeScore && pred.away === match.awayScore) exact += 1;
            else if (outcome(pred.home, pred.away) === outcome(match.homeScore, match.awayScore)) outcomeOnly += 1;
          }
        });

        return { player, total, exact, outcomeOnly };
      })
      .sort((a, b) => b.total - a.total || b.exact - a.exact || b.outcomeOnly - a.outcomeOnly || a.player.localeCompare(b.player));
  }, [players, predictions, matches, scoring]);

  const filteredMatches = useMemo(() => {
    const q = search.trim().toLowerCase();
    return matches.filter((m) => {
      const stageOk = stageFilter === "All stages" ? true : m.stage === stageFilter;
      const hay = `${m.home} ${m.away} ${m.stage} ${m.venue} ${m.id} ${m.group ?? ""}`.toLowerCase();
      return stageOk && (!q || hay.includes(q));
    });
  }, [matches, search, stageFilter]);

  const bracketColumns = useMemo(
    () => knockoutStages.map((stage) => ({ stage, matches: matches.filter((m) => m.stage === stage) })),
    [matches]
  );

  const completedMatches = matches.filter((m) => m.homeScore != null && m.awayScore != null).length;

  function exportLeagueSnapshot() {
    const snapshot = JSON.stringify({ league, players, predictions, matches, scoring }, null, 2);
    setJsonText(snapshot);
    void navigator.clipboard?.writeText(snapshot).catch(() => undefined);
  }

  if (!authUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-6">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="rounded-[32px] bg-gradient-to-br from-emerald-600 via-blue-600 to-indigo-700 p-6 md:p-8 shadow-xl">
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight">World Cup Prediction Challenge</h1>
            <p className="mt-3 max-w-3xl text-white/85 text-base md:text-lg">
              Sign in to create or join a shared league and follow predictions live.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <a href="/login" className="rounded-2xl border border-slate-800 bg-slate-900 p-4 text-center hover:bg-slate-800">
              Log in
            </a>
            <a href="/sign-up" className="rounded-2xl border border-slate-800 bg-slate-900 p-4 text-center hover:bg-slate-800">
              Sign up
            </a>
          </div>

          {status ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 text-sm text-slate-200">
              {status}
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className={t.page}>
      <div className="mx-auto max-w-7xl p-4 md:p-8 space-y-6">
        <div className="rounded-[32px] bg-gradient-to-br from-emerald-600 via-blue-600 to-indigo-700 text-white shadow-xl overflow-hidden">
          <div className="p-6 md:p-8 grid xl:grid-cols-[1.4fr_0.9fr] gap-6 items-start">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {league ? <span className="rounded-full bg-white/15 px-3 py-1 text-sm">League {league.code}</span> : null}
                <span className="rounded-full bg-white/15 px-3 py-1 text-sm">{players.length || 1} players</span>
                <span className={`rounded-full px-3 py-1 text-sm ${connectedRealtime ? "bg-emerald-500/25" : "bg-amber-500/25"}`}>
                  {connectedRealtime ? "Realtime connected" : "Realtime reconnecting"}
                </span>
              </div>

              <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
                {league?.name || "World Cup Prediction Challenge"}
              </h1>

              <p className="max-w-3xl text-white/85 text-base md:text-lg">
                Logged in as <span className="font-semibold">{displayName}</span>. Create or join a league and compete from the group stage through the final.
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard label="Fixtures" value={matches.length} sub="Official 2026 schedule" dark />
                <StatCard label="Completed" value={completedMatches} sub="Results entered" dark />
                <StatCard label="Players" value={players.length} sub="League members" dark />
                <StatCard label="Leader" value={leaderboard[0]?.player || "—"} sub="Top of the table" dark />
              </div>
            </div>

            <div className="space-y-3">
              {!league ? (
                <div className="rounded-[28px] border border-white/15 bg-white/10 p-5 backdrop-blur space-y-3">
                  <div className="text-lg font-semibold">Create or join a league</div>

                  <input
                    className="h-11 w-full rounded-2xl border border-white/20 bg-white/10 px-4 text-white"
                    placeholder="League name"
                    value={leagueName}
                    onChange={(e) => setLeagueName(e.target.value)}
                  />

                  <button
                    disabled={loading}
                    onClick={() => void createLeague()}
                    className="w-full rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 disabled:opacity-50"
                  >
                    {loading ? "Working..." : "Create league"}
                  </button>

                  <input
                    className="h-11 w-full rounded-2xl border border-white/20 bg-white/10 px-4 text-white uppercase"
                    placeholder="League code"
                    value={leagueCodeInput}
                    onChange={(e) => setLeagueCodeInput(e.target.value.toUpperCase())}
                  />

                  <button
                    disabled={loading}
                    onClick={() => void joinLeague()}
                    className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {loading ? "Working..." : "Join league"}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-[28px] border border-white/15 bg-white/10 p-5 backdrop-blur">
                    <div className="mb-2 text-lg font-semibold">League controls</div>
                    <div className="text-sm text-white/80">Choose an active player view, share the code, or toggle admin mode for result entry.</div>

                    <div className="mt-4 space-y-3">
                      <select
                        className="h-11 w-full rounded-2xl border border-white/20 bg-white/10 px-4 text-white"
                        value={selectedPlayer}
                        onChange={(e) => setSelectedPlayer(e.target.value)}
                      >
                        {players.map((p) => (
                          <option key={p} value={p} className="text-slate-900">
                            {p}
                          </option>
                        ))}
                      </select>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => void navigator.clipboard.writeText(league.code)}
                          className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-slate-900"
                        >
                          Copy code
                        </button>

                        <button
                          onClick={() => setAdminMode((v) => !v)}
                          className={`rounded-2xl px-4 py-2 text-sm font-semibold ${adminMode ? "bg-emerald-500 text-white" : "border border-white/20 bg-white/10 text-white"}`}
                        >
                          {adminMode ? "Admin enabled" : "Enable admin"}
                        </button>
                      </div>

                      <button
                        onClick={async () => {
                          await supabase.auth.signOut();
                          window.location.href = "/login";
                        }}
                        className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white"
                      >
                        Log out
                      </button>
                    </div>
                  </div>

                  <div className="rounded-[28px] border border-white/15 bg-white/10 p-5 backdrop-blur">
                    <div className="mb-2 text-lg font-semibold">Scoring</div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="rounded-2xl bg-black/10 p-3">Exact<div className="mt-1 text-xl font-bold">{scoring.exactPoints}</div></div>
                      <div className="rounded-2xl bg-black/10 p-3">Outcome<div className="mt-1 text-xl font-bold">{scoring.outcomePoints}</div></div>
                      <div className="rounded-2xl bg-black/10 p-3">Draw bonus<div className="mt-1 text-xl font-bold">+{scoring.drawBonus}</div></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {status ? <div className={`rounded-2xl border p-4 text-sm ${t.card}`}>{status}</div> : null}

        {league ? (
          <>
            <div className={`rounded-2xl border p-1 shadow-sm ${t.card}`}>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1">
                {["matches", "leaderboard", "bracket", "league", "data"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`rounded-2xl px-3 py-2 text-sm font-semibold capitalize ${activeTab === tab ? "bg-slate-900 text-white" : t.inactiveTab}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {activeTab === "matches" ? (
              <div className="space-y-5">
                <div className={`rounded-3xl border shadow-sm ${t.card}`}>
                  <div className="p-4 md:p-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_220px_220px_220px]">
                    <input
                      className={`h-11 rounded-2xl border px-4 ${t.input} sm:col-span-2 xl:col-span-1`}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search by team, venue, stage, or match number"
                    />

                    <select
                      className={`h-11 rounded-2xl border px-4 ${t.input}`}
                      value={stageFilter}
                      onChange={(e) => setStageFilter(e.target.value)}
                    >
                      <option>All stages</option>
                      {stageOrder.map((stage) => (
                        <option key={stage}>{stage}</option>
                      ))}
                    </select>

                    <select
                      className={`h-11 rounded-2xl border px-4 ${t.input}`}
                      value={selectedPlayer}
                      onChange={(e) => setSelectedPlayer(e.target.value)}
                    >
                      {players.map((p) => (
                        <option key={p}>{p}</option>
                      ))}
                    </select>

                    <select
                      className={`h-11 rounded-2xl border px-4 ${t.input}`}
                      value={theme}
                      onChange={(e) => setTheme(e.target.value as Theme)}
                    >
                      <option value="classic">Classic theme</option>
                      <option value="glass">Glass theme</option>
                      <option value="midnight">Midnight theme</option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-4">
                  {filteredMatches.map((match) => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      prediction={predictions[selectedPlayer]?.[match.id]}
                      selectedPlayer={selectedPlayer}
                      onPredict={(matchId, side, value) => void upsertPrediction(matchId, side, value)}
                      onResultUpdate={(matchId, field, value) => void upsertResult(matchId, field, value)}
                      scoring={scoring}
                      adminMode={adminMode}
                      theme={theme}
                    />
                  ))}
                </div>
              </div>
            ) : null}

            {activeTab === "leaderboard" ? (
              <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-5">
                <div className={`rounded-3xl border shadow-sm ${t.card}`}>
                  <div className="p-5 border-b">
                    <div className="text-xl font-bold">Live leaderboard</div>
                    <div className={`text-sm ${t.sub}`}>Sorted by points, exact scores, then outcomes.</div>
                  </div>

                  <div className="p-5 space-y-3">
                    {leaderboard.map((row, idx) => (
                      <div
                        key={row.player}
                        className={`grid grid-cols-[56px_1fr_90px] gap-3 items-center rounded-2xl border p-4 ${
                          idx === 0 ? "bg-amber-50 border-amber-200 text-slate-900" : t.card
                        }`}
                      >
                        <div className="text-center">
                          <div className={`text-xs ${idx === 0 ? "text-slate-600" : t.sub}`}>Rank</div>
                          <div className="text-2xl font-bold">#{idx + 1}</div>
                        </div>

                        <div>
                          <div className="text-lg font-semibold">{row.player}</div>
                          <div className={`text-sm ${idx === 0 ? "text-slate-600" : t.sub}`}>
                            {row.exact} exact • {row.outcomeOnly} correct outcome
                          </div>
                        </div>

                        <div className="text-right">
                          <div className={`text-xs ${idx === 0 ? "text-slate-600" : t.sub}`}>Points</div>
                          <div className="text-2xl font-bold text-blue-600">{row.total}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={`rounded-3xl border shadow-sm ${t.card}`}>
                  <div className="p-5 border-b">
                    <div className="text-xl font-bold">League summary</div>
                  </div>

                  <div className="p-5 space-y-4">
                    <StatCard label="League code" value={league.code} />
                    <StatCard label="Logged in" value={displayName || authUser.email || "—"} />
                    <StatCard label="Players" value={players.length} />
                    <div className={`rounded-2xl p-4 text-sm ${t.soft}`}>
                      <p><strong>Tip:</strong> Admin mode lets you enter official results from this browser.</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {activeTab === "bracket" ? (
              <div className={`rounded-3xl border shadow-sm ${t.card}`}>
                <div className="p-5 border-b">
                  <div className="text-xl font-bold">Knockout bracket</div>
                  <div className={`text-sm ${t.sub}`}>Scroll sideways on mobile.</div>
                </div>

                <div className="p-5 overflow-x-auto">
                  <div className="flex gap-4 min-w-max items-start">
                    {bracketColumns.map((column) => (
                      <div key={column.stage} className="w-[260px] space-y-3">
                        <div className="rounded-2xl bg-slate-900 px-4 py-3 text-white shadow-sm">
                          <div className="font-semibold">{column.stage}</div>
                          <div className="text-xs text-slate-300">
                            {column.matches.length} match{column.matches.length !== 1 ? "es" : ""}
                          </div>
                        </div>

                        {column.matches.map((match) => (
                          <BracketCard key={match.id} match={match} theme={theme} />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            {activeTab === "league" ? (
              <div className={`rounded-3xl border shadow-sm ${t.card}`}>
                <div className="p-5 border-b">
                  <div className="text-xl font-bold">League details</div>
                  <div className={`text-sm ${t.sub}`}>Your authenticated account is your player identity.</div>
                </div>

                <div className="p-5 space-y-4">
                  <div className={`rounded-2xl border p-4 ${t.soft}`}>
                    <div className="font-semibold">{displayName}</div>
                    <div className={`text-sm ${t.sub}`}>{authUser.email}</div>
                  </div>

                  <div className={`rounded-2xl border p-4 ${t.soft}`}>
                    <div className="text-sm font-semibold mb-2">League code</div>
                    <div className="text-2xl font-bold tracking-wide">{league.code}</div>
                  </div>

                  <div className="grid gap-2">
                    {players.map((player) => (
                      <div key={player} className={`flex items-center justify-between rounded-2xl border p-3 ${t.soft}`}>
                        <div>
                          <div className="font-medium">{player}</div>
                          <div className={`text-xs ${t.sub}`}>
                            {Object.values(predictions[player] || {}).filter((p) => p?.home != null && p?.away != null).length} predictions saved
                          </div>
                        </div>
                        <button
                          className={`rounded-xl px-3 py-2 text-sm font-semibold ${selectedPlayer === player ? "bg-slate-900 text-white" : "border"}`}
                          onClick={() => setSelectedPlayer(player)}
                        >
                          Select
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            {activeTab === "data" ? (
              <div className={`rounded-3xl border shadow-sm ${t.card}`}>
                <div className="p-5 border-b">
                  <div className="text-xl font-bold">Backup snapshot</div>
                  <div className={`text-sm ${t.sub}`}>Export current state for inspection.</div>
                </div>

                <div className="p-5 space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <button
                      className="rounded-2xl bg-blue-600 px-4 py-2 font-semibold text-white"
                      onClick={exportLeagueSnapshot}
                    >
                      Export & copy
                    </button>
                  </div>

                  <textarea
                    className={`min-h-[320px] w-full rounded-3xl border p-4 text-sm font-mono ${t.input}`}
                    placeholder="Exported snapshot will appear here"
                    value={jsonText}
                    onChange={(e) => setJsonText(e.target.value)}
                  />
                </div>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
import { supabase } from "../lib/supabase/client";
import { getDisplayName } from "../lib/player";

type Match = {
  id: number;
  date: string;
  stage: string;
  group: string | null;
