import { NextResponse } from "next/server";

const NEYNAR = "https://api.neynar.com/v2/farcaster";

function headers() {
  return {
    accept: "application/json",
    "x-api-key": process.env.NEYNAR_API_KEY || "NEYNAR_API_DOCS",
  };
}

/* ─── Score Engine ─── */
function calcScores(user, casts) {
  const s = {};
  const fid = user.fid;

  // FID Rarity (max 150)
  if (fid <= 200) s.fid = 150;
  else if (fid <= 1000) s.fid = 135;
  else if (fid <= 5000) s.fid = 115;
  else if (fid <= 20000) s.fid = 90;
  else if (fid <= 50000) s.fid = 65;
  else if (fid <= 100000) s.fid = 45;
  else if (fid <= 300000) s.fid = 25;
  else if (fid <= 600000) s.fid = 15;
  else s.fid = 5;

  // Account Age from FID era (max 120)
  if (fid <= 1000) s.age = 120;
  else if (fid <= 5000) s.age = 110;
  else if (fid <= 20000) s.age = 95;
  else if (fid <= 50000) s.age = 80;
  else if (fid <= 100000) s.age = 65;
  else if (fid <= 200000) s.age = 50;
  else if (fid <= 400000) s.age = 30;
  else s.age = 15;

  // Social Graph (max 200)
  const fl = user.follower_count || 0;
  const fw = Math.max(user.following_count || 1, 1);
  const ratio = Math.min(fl / fw, 20);
  const flScore = Math.min(120, Math.floor(Math.log10(Math.max(fl, 1)) * 24));
  const ratioB = Math.min(40, Math.floor(ratio * 4));
  const fwPen = fw < 10 ? -20 : 0;
  const flBonus = fl > 50000 ? 40 : fl > 10000 ? 25 : fl > 1000 ? 10 : 0;
  s.social = Math.max(0, Math.min(200, flScore + ratioB + fwPen + flBonus));

  // Engagement from casts (max 180)
  if (casts.length > 0) {
    const total = casts.reduce((sum, c) => {
      const lk = c.reactions?.likes_count ?? c.reactions?.likes?.length ?? 0;
      const rc = c.reactions?.recasts_count ?? c.reactions?.recasts?.length ?? 0;
      const rp = c.replies?.count ?? 0;
      return sum + lk + rc * 2 + rp * 1.5;
    }, 0);
    const avg = total / casts.length;
    s.engagement = Math.min(
      180,
      Math.floor(
        Math.log10(Math.max(avg, 1)) * 50 +
          (avg > 100 ? 40 : avg > 20 ? 20 : 0)
      )
    );
  } else {
    s.engagement = 5;
  }

  // Cast Activity / frequency (max 150)
  if (casts.length >= 2) {
    const ts = casts
      .map((c) => new Date(c.timestamp).getTime())
      .sort((a, b) => b - a);
    const days = Math.max((ts[0] - ts[ts.length - 1]) / 864e5, 1);
    const cpd = casts.length / days;
    s.activity = Math.min(
      150,
      Math.floor(
        cpd * 40 + (casts.length >= 20 ? 30 : casts.length >= 10 ? 15 : 0)
      )
    );
  } else if (casts.length === 1) {
    s.activity = 15;
  } else {
    s.activity = 0;
  }

  // Power Badge (max 100)
  s.power = user.power_badge ? 100 : 0;

  // Wallet & Verification (max 100)
  const eth = user.verified_addresses?.eth_addresses?.length || 0;
  const sol = user.verified_addresses?.sol_addresses?.length || 0;
  s.wallet = Math.min(
    100,
    (eth + sol) * 30 +
      (user.custody_address ? 10 : 0) +
      (eth > 0 ? 20 : 0) +
      (sol > 0 ? 20 : 0)
  );

  return s;
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get("username");

  if (!username) {
    return NextResponse.json({ error: "username required" }, { status: 400 });
  }

  try {
    // 1. Fetch user profile
    const userRes = await fetch(
      `${NEYNAR}/user/by_username?username=${encodeURIComponent(username)}`,
      { headers: headers(), next: { revalidate: 60 } }
    );

    if (!userRes.ok) {
      const e = await userRes.json().catch(() => ({}));
      return NextResponse.json(
        { error: e.message || `User "${username}" not found` },
        { status: userRes.status }
      );
    }

    const userData = await userRes.json();
    const user = userData.user;

    // 2. Fetch recent casts
    let casts = [];
    try {
      const castsRes = await fetch(
        `${NEYNAR}/feed/user/casts?fid=${user.fid}&limit=25&include_replies=false`,
        { headers: headers(), next: { revalidate: 60 } }
      );
      if (castsRes.ok) {
        const castsData = await castsRes.json();
        casts = castsData.casts || [];
      }
    } catch {
      // casts fetch failed, continue with empty
    }

    // 3. Calculate scores
    const scores = calcScores(user, casts);
    const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);

    // 4. Return everything
    return NextResponse.json({
      user: {
        fid: user.fid,
        username: user.username,
        display_name: user.display_name,
        pfp_url: user.pfp_url,
        follower_count: user.follower_count || 0,
        following_count: user.following_count || 0,
        power_badge: user.power_badge || false,
        active_status: user.active_status,
        custody_address: user.custody_address,
        verified_addresses: user.verified_addresses || {
          eth_addresses: [],
          sol_addresses: [],
        },
        bio: user.profile?.bio?.text || "",
      },
      scores,
      totalScore,
      castsAnalyzed: casts.length,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Internal error" },
      { status: 500 }
    );
  }
}
