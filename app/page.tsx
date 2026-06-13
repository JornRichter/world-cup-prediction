"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { getDisplayName } from "@/lib/player";

type Match = {
  id: number;
  date: string;
  stage: string;
  group: string | null;
  home: string;
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

const DEFAULT_SCORING: Scoring = { exactPoints: 5, outcomePoints: 2, drawBonus: 1 };

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

// ✅ PASTE YOUR EXISTING FULL FIXTURES_TEXT BLOCK HERE EXACTLY AS-IS
const FIXTURES_TEXT = `
PASTE YOUR CURRENT FULL FIXTURES_TEXT HERE
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
    return found ? { ...m, homeScore: found.home_score, awayScore: found.away_score } : { ...m };
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

  if (pred.home === match.homeScore && pred.away === match.awayScore) {
    return scoring.exactPoints;
  }

  if (outcome(pred.home, pred.away) === outcome(match.homeScore, match.awayScore)) {
    return scoring.outcomePoints + (
      isDraw(pred.home, pred.away) && isDraw(match.homeScore, match.awayScore)
        ? scoring.drawBonus
        : 0
    );
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
      {sub ? (
        <div className={`text-xs mt-1 ${dark ? "text-white/70" : "text-slate-500"}`}>{sub}</div>
      ) : null}
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
              <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                {match.stage}
              </span>
              {match.group ? (
                <span className="rounded-full border px-3 py-1 text-xs font-semibold">
                  Group {match.group}
                </span>
              ) : null}
              <span className="rounded-full border px-3 py-1 text-xs">Match {match.id}</span>
              {locked ? (
                <span className="rounded-full bg-amber-100 text-amber-800 px-3 py-1 text-xs font-semibold">
                  Locked
                </span>
              ) : null}
            </div>
            <div className={`text-sm ${t.sub}`}>
              {formatDate(match.date)} • {match.venue}
            </div>
          </div>

          <div className="text-right">
            <div className={`text-xs ${t.sub}`}>{selectedPlayer}'s prediction</div>
            <div className="text-base font-semibold">
              {prediction?.home ?? "–"} : {prediction?.away ?? "–"}
            </div>
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
            <div className="text-2xl font-bold">
              {match.homeScore ?? "–"} : {match.awayScore ?? "–"}
            </div>
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

  const knockoutStages = ["Round of 32", "Round of 16", "Quarter-final", "Semi-final", "Bronze Final", "Final"];
  const stageOrder = ["Group Stage", ...knockoutStages];
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
    if (!authUser) {
      setStatus("You must be logged in to create a league.");
      return;
    }

    const leagueNameClean = leagueName.trim() || "Friends World Cup League";
    const ownerDisplayName = displayName || authUser.email?.split("@")[0] || "Player";

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
      user_id: authUser.id,
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
    if (!authUser || !league) {
      setStatus("You must be logged in and inside a league.");
      return;
    }

    const match = matches.find((m) => m.id === matchId);
    if (!match) return;

    if (isLocked(match, adminMode) && !adminMode) return;

    const current = predictions[selectedPlayer]?.[matchId] || { home: null, away: null };
    const nextValue = rawValue === "" ? null : Math.max(0, Number(rawValue));
    const nextPred = {
      ...current,
      [side]: nextValue,
    };

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
        user_id: authUser.id,
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
            <a
              href="/login"
              className="rounded-2xl bg-blue-600 px-4 py-3 text-center font-semibold text-white"
            >
              Log in
            </a>
            <a
              href="/sign-up"
              className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-center font-semibold text-white"
            >
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
                <span className="rounded-full bg-white/15 px-3 py-1 text-sm">Logged in as {displayName}</span>
              </div>

              <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
                {league?.name || "World Cup Prediction Challenge"}
              </h1>

              <p className="max-w-3xl text-white/85 text-base md:text-lg">
                Create a shared league, invite your friends, and follow predictions through the final.
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
                    className="w-full rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-slate-900"
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
                    className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white"
                  >
                    {loading ? "Working..." : "Join league"}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-[28px] border border-white/15 bg-white/10 p-5 backdrop-blur">
                    <div className="mb-2 text-lg font-semibold">League controls</div>
                    <div className="text-sm text-white/80">Pick your active view, share the code, or toggle admin mode.</div>

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
                      <div className="rounded-2xl bg-black/10 p-3">
                        Exact
                        <div className="mt-1 text-xl font-bold">{scoring.exactPoints}</div>
                      </div>
                      <div className="rounded-2xl bg-black/10 p-3">
                        Outcome
                        <div className="mt-1 text-xl font-bold">{scoring.outcomePoints}</div>
                      </div>
                      <div className="rounded-2xl bg-black/10 p-3">
                        Draw bonus
                        <div className="mt-1 text-xl font-bold">+{scoring.drawBonus}</div>
                      </div>
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
                    <div className="text-xl font-bold">Tournament summary</div>
                  </div>

                  <div className="p-5 space-y-4">
                    <StatCard label="League code" value={league.code} />
                    <StatCard label="Logged in" value={displayName || authUser.email || "—"} />
                    <StatCard label="Players" value={players.length} />
                    <div className={`rounded-2xl p-4 text-sm ${t.soft}`}>
                      <p><strong>Tip:</strong> Admin mode lets you enter official results.</p>
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
                  <div className={`text-sm ${t.sub}`}>Your authenticated account is the player identity.</div>
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