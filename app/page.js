"use client";

import { useState, useEffect, useRef, useCallback } from "react";

/* ─── Config ─── */
const TIERS = [
  { name: "WHALE", emoji: "🐳", min: 750, color: "#8B5CF6" },
  { name: "EAGLE", emoji: "🦅", min: 550, color: "#3B82F6" },
  { name: "HAWK", emoji: "🦊", min: 380, color: "#10B981" },
  { name: "BIRD", emoji: "🐦", min: 180, color: "#F59E0B" },
  { name: "EGG", emoji: "🥚", min: 0, color: "#6B7280" },
];

const CATS = [
  { key: "fid", label: "FID Rarity", icon: "🆔", max: 150, desc: "Earlier FID = higher score" },
  { key: "age", label: "Account Age", icon: "📅", max: 120, desc: "Based on FID registration era" },
  { key: "social", label: "Social Graph", icon: "🌐", max: 200, desc: "Followers & ratio" },
  { key: "engagement", label: "Engagement", icon: "💜", max: 180, desc: "Avg reactions on recent casts" },
  { key: "activity", label: "Cast Activity", icon: "📢", max: 150, desc: "Posting frequency" },
  { key: "power", label: "Power Badge", icon: "⚡", max: 100, desc: "Verified power user" },
  { key: "wallet", label: "Wallet & Verify", icon: "🔗", max: 100, desc: "Connected wallets" },
];

const MAX_SCORE = CATS.reduce((a, c) => a + c.max, 0); // 1000
const EST_ELIGIBLE = 200000;
const EST_AVG = 260;

function getTier(s) {
  return TIERS.find((t) => s >= t.min) || TIERS[4];
}

function fmt(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  if (n >= 1) return n.toFixed(2);
  return n.toFixed(6);
}

/* ─── Animated Number ─── */
function AnimNum({ value, dec = 0, dur = 1300, pre = "", suf = "" }) {
  const [d, sD] = useState(0);
  const rf = useRef(null);
  useEffect(() => {
    const t0 = performance.now();
    function tick(now) {
      const p = Math.min((now - t0) / dur, 1);
      sD((1 - Math.pow(1 - p, 3)) * value);
      if (p < 1) rf.current = requestAnimationFrame(tick);
    }
    rf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rf.current);
  }, [value, dur]);
  return (
    <span>
      {pre}
      {d.toFixed(dec)}
      {suf}
    </span>
  );
}

/* ─── Score Bar ─── */
function ScoreBar({ cat, score, delay, color }) {
  const [on, set] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => set(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-slate-400 font-mono">
          {cat.icon} {cat.label}
        </span>
        <span className="text-sm font-extrabold text-slate-200 font-mono">
          {on ? score : 0}
          <span className="text-slate-600 font-normal">/{cat.max}</span>
        </span>
      </div>
      <div className="h-[7px] rounded-full bg-white/[0.04] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{
            width: on ? `${(score / cat.max) * 100}%` : "0%",
            background: `linear-gradient(90deg, ${color}55, ${color})`,
            boxShadow: `0 0 12px ${color}30`,
            transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        />
      </div>
      <div className="text-[9.5px] text-slate-700 mt-0.5 font-mono">
        {cat.desc}
      </div>
    </div>
  );
}

/* ═══════════════════ MAIN PAGE ═══════════════════ */
export default function Home() {
  const [username, setUsername] = useState("");
  const [airdropPct, setAirdropPct] = useState(35);
  const [supply, setSupply] = useState(1e9);
  const [phase, setPhase] = useState("input"); // input | loading | result
  const [error, setError] = useState("");
  const [loadMsg, setLoadMsg] = useState("");
  const [result, setResult] = useState(null);

  const check = useCallback(async () => {
    const u = username.trim().replace(/^@/, "");
    if (!u) return;

    setPhase("loading");
    setError("");
    setLoadMsg("Fetching profile from Neynar...");

    try {
      const res = await fetch(`/api/check?username=${encodeURIComponent(u)}`);
      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "User not found");
      }

      setLoadMsg("Calculating airdrop share...");
      await new Promise((r) => setTimeout(r, 400));

      const { user, scores, totalScore, castsAnalyzed } = data;
      const tier = getTier(totalScore);
      const pool = EST_ELIGIBLE * EST_AVG;
      const share = totalScore / pool;
      const dropTokens = supply * (airdropPct / 100);

      setResult({
        user,
        scores,
        total: totalScore,
        tier,
        sharePct: share * 100,
        tokens: dropTokens * share,
        dropTokens,
        analyzed: castsAnalyzed,
      });
      setPhase("result");
    } catch (e) {
      setError(e.message || "Failed to fetch");
      setPhase("input");
    }
  }, [username, airdropPct, supply]);

  const reset = () => {
    setResult(null);
    setPhase("input");
    setUsername("");
    setError("");
  };

  return (
    <div className="relative overflow-hidden min-h-screen">
      {/* Background */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
      <div className="dot-grid" />

      <div className="relative z-10 max-w-[520px] mx-auto px-4 py-5">
        {/* Header */}
        <div className="text-center mb-7 animate-fadeUp">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand-600/[0.07] border border-brand-600/[0.16] mb-3">
            <span className="text-xs">🦅</span>
            <span className="text-[9.5px] font-bold tracking-[2.5px] uppercase text-brand-400 font-mono">
              TALONS PROTOCOL
            </span>
          </div>
          <h1 className="text-[29px] font-black leading-[1.05] mb-1">
            <span className="bg-gradient-to-r from-slate-100 via-brand-400 to-brand-600 bg-clip-text text-transparent">
              Farcaster Airdrop
            </span>
            <br />
            <span className="bg-gradient-to-r from-brand-400 to-brand-600 bg-clip-text text-transparent">
              Checker
            </span>
          </h1>
          <p className="text-slate-600 text-[12.5px] max-w-[320px] mx-auto">
            Live scoring from real Farcaster data via Neynar API
          </p>
        </div>

        {/* ═══ INPUT ═══ */}
        {phase === "input" && (
          <div className="animate-fadeUp">
            {error && (
              <div className="px-4 py-3 rounded-xl mb-3 bg-red-500/[0.07] border border-red-500/[0.18] text-[12.5px] text-red-400 font-mono">
                ❌ {error}
              </div>
            )}

            {/* Username */}
            <div className="glass p-5 mb-3">
              <label className="block text-[9.5px] font-bold tracking-[2px] uppercase text-slate-600 mb-2.5 font-mono">
                Farcaster Username
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-600 text-base font-extrabold">
                  @
                </span>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && check()}
                  placeholder="username"
                  className="w-full py-3 pl-9 pr-4 bg-black/50 border border-white/[0.06] rounded-xl text-slate-200 text-[15.5px] font-semibold font-mono transition-all"
                />
              </div>
            </div>

            {/* Airdrop Params */}
            <div className="glass p-5 mb-3">
              <label className="block text-[9.5px] font-bold tracking-[2px] uppercase text-slate-600 mb-3.5 font-mono">
                Airdrop Simulation
              </label>

              {/* Allocation slider */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[12.5px] text-slate-400">
                    Community Allocation
                  </span>
                  <span className="text-[19px] font-black text-brand-400 font-mono">
                    {airdropPct}%
                  </span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={60}
                  value={airdropPct}
                  onChange={(e) => setAirdropPct(+e.target.value)}
                  className="w-full h-[5px] appearance-none bg-white/[0.05] rounded-full cursor-pointer accent-brand-600"
                />
                <div className="flex justify-between text-[8.5px] text-slate-800 mt-0.5 font-mono">
                  <span>5%</span>
                  <span>60%</span>
                </div>
              </div>

              {/* Supply buttons */}
              <div>
                <span className="block text-[12.5px] text-slate-400 mb-2">
                  Total Token Supply
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    [1e8, "100M"],
                    [5e8, "500M"],
                    [1e9, "1B"],
                    [1e10, "10B"],
                  ].map(([v, l]) => (
                    <button
                      key={v}
                      onClick={() => setSupply(v)}
                      className="py-2 rounded-[10px] text-[12.5px] font-bold font-mono transition-all"
                      style={{
                        background:
                          supply === v
                            ? "rgba(124,58,237,0.13)"
                            : "rgba(255,255,255,0.025)",
                        border: `1px solid ${supply === v ? "rgba(124,58,237,0.3)" : "rgba(255,255,255,0.04)"}`,
                        color: supply === v ? "#A78BFA" : "#404859",
                      }}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* CTA */}
            <button
              className="btn-brand w-full py-3.5 text-[14.5px]"
              onClick={check}
              disabled={!username.trim()}
              style={{ opacity: username.trim() ? 1 : 0.3 }}
            >
              🔍 Check My Airdrop Share
            </button>

            <div className="mt-3 p-3 rounded-[10px] bg-amber-500/[0.04] border border-amber-500/[0.1] text-[9.5px] text-amber-700 leading-relaxed font-mono">
              ⚠️ Pulls live data from Neynar. Share estimate is model-based, not
              official. NFA/DYOR.
            </div>
          </div>
        )}

        {/* ═══ LOADING ═══ */}
        {phase === "loading" && (
          <div className="text-center py-12 animate-fadeUp">
            <div className="w-[52px] h-[52px] mx-auto mb-5 border-[3px] border-brand-600/[0.12] border-t-brand-600 rounded-full animate-spin-slow" />
            <div className="text-sm font-bold text-brand-400 font-mono">
              @{username.replace("@", "")}
            </div>
            <div className="text-[11.5px] text-slate-600 font-mono mt-1">
              {loadMsg}
            </div>
          </div>
        )}

        {/* ═══ RESULT ═══ */}
        {phase === "result" && result && (
          <ResultView
            result={result}
            airdropPct={airdropPct}
            supply={supply}
            onReset={reset}
          />
        )}
      </div>
    </div>
  );
}

/* ─── Result View ─── */
function ResultView({ result, airdropPct, supply, onReset }) {
  const { user, scores, total, tier, sharePct, tokens, dropTokens, analyzed } =
    result;

  return (
    <div className="animate-fadeUp">
      {/* Profile Card */}
      <div className="glass p-5 mb-3 relative overflow-hidden">
        <div
          className="absolute top-0 left-0 right-0 h-[2.5px]"
          style={{
            background: `linear-gradient(90deg, transparent, ${tier.color}, transparent)`,
          }}
        />

        <div className="flex items-center gap-3.5 mb-4">
          {user.pfp_url ? (
            <img
              src={user.pfp_url}
              alt=""
              className="w-[50px] h-[50px] rounded-[15px] object-cover"
              style={{ border: `2px solid ${tier.color}40` }}
            />
          ) : (
            <div
              className="w-[50px] h-[50px] rounded-[15px] flex items-center justify-center text-2xl"
              style={{
                background: `${tier.color}22`,
                border: `2px solid ${tier.color}40`,
              }}
            >
              {tier.emoji}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-[16.5px] font-extrabold truncate">
              {user.display_name || user.username}
            </div>
            <div className="text-[11.5px] text-slate-600 font-mono">
              @{user.username} · FID #{user.fid.toLocaleString()}
            </div>
          </div>
          <div
            className="px-3 py-1 rounded-full text-[10.5px] font-extrabold font-mono whitespace-nowrap"
            style={{
              background: `${tier.color}12`,
              border: `1px solid ${tier.color}30`,
              color: tier.color,
            }}
          >
            {tier.emoji} {tier.name}
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { l: "Followers", v: (user.follower_count || 0).toLocaleString() },
            { l: "Following", v: (user.following_count || 0).toLocaleString() },
            { l: "Power Badge", v: user.power_badge ? "✅ Yes" : "❌ No" },
          ].map((x) => (
            <div
              key={x.l}
              className="text-center py-2.5 rounded-xl bg-black/[0.35]"
            >
              <div className="text-[13.5px] font-extrabold font-mono">
                {x.v}
              </div>
              <div className="text-[8.5px] text-slate-600 uppercase tracking-wider mt-0.5">
                {x.l}
              </div>
            </div>
          ))}
        </div>

        {/* Wallets */}
        {(user.verified_addresses?.eth_addresses?.length > 0 ||
          user.verified_addresses?.sol_addresses?.length > 0) && (
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {(user.verified_addresses.eth_addresses || []).map((a, i) => (
              <span
                key={i}
                className="px-2.5 py-0.5 rounded-lg text-[9.5px] font-mono bg-blue-500/[0.07] border border-blue-500/[0.13] text-blue-400"
              >
                ETH {a.slice(0, 6)}..{a.slice(-4)}
              </span>
            ))}
            {(user.verified_addresses.sol_addresses || []).map((a, i) => (
              <span
                key={i}
                className="px-2.5 py-0.5 rounded-lg text-[9.5px] font-mono bg-emerald-500/[0.07] border border-emerald-500/[0.13] text-emerald-400"
              >
                SOL {a.slice(0, 4)}..{a.slice(-4)}
              </span>
            ))}
          </div>
        )}

        <div className="mt-2.5 text-[9.5px] text-slate-800 font-mono">
          📊 {analyzed} recent casts analyzed
        </div>
      </div>

      {/* ── SHARE CARD ── */}
      <div
        className="rounded-[20px] p-6 mb-3 text-center relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${tier.color}10, rgba(124,58,237,0.05), rgba(0,0,0,0.35))`,
          border: `1px solid ${tier.color}1A`,
        }}
      >
        <div
          className="absolute -top-[45px] -right-[45px] w-[130px] h-[130px] rounded-full blur-[28px]"
          style={{ background: `${tier.color}05` }}
        />

        <div className="text-[9.5px] font-bold tracking-[2.5px] uppercase text-slate-600 mb-2 font-mono">
          Your Estimated Share
        </div>

        <div
          className="text-[42px] font-black leading-none mb-1 animate-countPop font-mono"
          style={{
            background: `linear-gradient(135deg, #fff, ${tier.color})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          <AnimNum value={sharePct} dec={6} suf="%" />
        </div>

        <div className="text-[11.5px] text-slate-500 mb-4 font-mono">
          of the {airdropPct}% community allocation
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="py-3.5 px-2.5 rounded-[13px] bg-black/[0.45] border border-white/[0.04]">
            <div className="text-[8.5px] text-slate-600 uppercase tracking-wider mb-1 font-mono">
              Est. Token Amount
            </div>
            <div className="text-[17px] font-black text-brand-400 font-mono">
              <AnimNum value={tokens} dec={0} />
            </div>
            <div className="text-[9.5px] text-slate-800 mt-0.5 font-mono">
              $FAR tokens
            </div>
          </div>
          <div className="py-3.5 px-2.5 rounded-[13px] bg-black/[0.45] border border-white/[0.04]">
            <div className="text-[8.5px] text-slate-600 uppercase tracking-wider mb-1 font-mono">
              Total Pool
            </div>
            <div className="text-[17px] font-black text-slate-200 font-mono">
              {fmt(dropTokens)}
            </div>
            <div className="text-[9.5px] text-slate-800 mt-0.5 font-mono">
              of {fmt(supply)} supply
            </div>
          </div>
        </div>

        {/* Rank */}
        <div className="mt-3 py-2.5 px-3.5 rounded-xl bg-black/[0.28] border border-white/[0.035] flex justify-between items-center">
          <span className="text-[10.5px] text-slate-500 font-mono">
            Est. Rank
          </span>
          <span
            className="text-[13.5px] font-extrabold font-mono"
            style={{ color: tier.color }}
          >
            Top{" "}
            {total >= 750
              ? "1%"
              : total >= 550
                ? "5%"
                : total >= 380
                  ? "15%"
                  : total >= 180
                    ? "40%"
                    : "70%"}
          </span>
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="glass p-5 mb-3">
        <div className="flex justify-between items-center mb-4">
          <span className="text-[9.5px] font-bold tracking-[2px] uppercase text-slate-600 font-mono">
            Score Breakdown
          </span>
          <span
            className="text-[21px] font-black font-mono"
            style={{
              background: `linear-gradient(135deg, ${tier.color}, #A78BFA)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {total}
            <span className="text-xs opacity-40">/{MAX_SCORE}</span>
          </span>
        </div>
        {CATS.map((c, i) => (
          <ScoreBar
            key={c.key}
            cat={c}
            score={scores[c.key]}
            delay={i * 90}
            color={tier.color}
          />
        ))}
      </div>

      {/* Tips */}
      <div className="glass p-5 mb-3">
        <div className="text-[9.5px] font-bold tracking-[2px] uppercase text-slate-600 mb-3 font-mono">
          💡 Boost Tips
        </div>
        {[
          scores.power === 0 && {
            t: "Earn a Power Badge — instant +100 pts",
            c: "#F59E0B",
          },
          scores.activity < 80 && {
            t: "Cast more frequently, daily activity matters",
            c: "#3B82F6",
          },
          scores.engagement < 80 && {
            t: "Create quality content that earns reactions",
            c: "#EC4899",
          },
          scores.social < 100 && {
            t: "Grow followers organically through engagement",
            c: "#10B981",
          },
          scores.wallet < 60 && {
            t: "Connect more wallets (ETH+SOL) for extra points",
            c: "#8B5CF6",
          },
        ]
          .filter(Boolean)
          .slice(0, 4)
          .map((x, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-3 py-2 rounded-[10px] mb-1.5 text-[11.5px] font-medium"
              style={{
                background: `${x.c}05`,
                border: `1px solid ${x.c}12`,
                color: x.c,
              }}
            >
              <span className="text-[6px]">●</span> {x.t}
            </div>
          ))}
      </div>

      {/* Reset */}
      <button
        onClick={onReset}
        className="w-full py-3 rounded-[13px] bg-white/[0.025] border border-white/[0.06] text-slate-400 text-[13.5px] font-semibold cursor-pointer transition-all hover:bg-white/[0.06]"
      >
        ← Check Another User
      </button>

      <div className="text-center mt-4 text-[8.5px] text-slate-900 font-mono leading-relaxed">
        Built by Talons Protocol · Live data via Neynar API · NFA/DYOR
      </div>
    </div>
  );
}
