const fs = require('fs');
const path = require('path');
const fetch = global.fetch || require('node-fetch');

const USERNAME = 'dj20101004';

function extractRankFromHtml(html) {
  if (!html) return null;
  const m1 = html.match(/"ranking"\s*:\s*(\d+)/i);
  if (m1) return m1[1];
  const m2 = html.match(/"user_ranking"\s*:\s*(\d+)/i);
  if (m2) return m2[1];
  const m3 = html.match(/Rank\s*[:#]?\s*([\d,]+)/i);
  if (m3) return m3[1].replace(/,/g, '');
  return null;
}


async function fetchProfileHtml(username) {
  const url = `https://leetcode.com/u/${username}/`;
  const res = await fetch(url, { method: 'GET' });
  if (!res.ok) throw new Error('Profile fetch failed: ' + res.status);
  return await res.text();
}

async function fetchGraphQL(username) {
  const url = 'https://leetcode.com/graphql';
  const query = {
    query: `query getUserProfile($username: String!) { matchedUser(username: $username) { username submitStats { acSubmissionNum { difficulty count } } } }`,
    variables: { username }
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(query)
  });
  if (!res.ok) throw new Error('GraphQL fetch failed: ' + res.status);
  return await res.json();
}

async function main() {
  let rank = null;
  try {
    const html = await fetchProfileHtml(USERNAME);
    rank = extractRankFromHtml(html);
  } catch (e) {
    console.warn('HTML fetch failed:', e.message);
  }

  if (!rank) {
    try {
      const data = await fetchGraphQL(USERNAME);
      if (data && data.data && data.data.matchedUser && data.data.matchedUser.submitStats) {
        const arr = data.data.matchedUser.submitStats.acSubmissionNum || [];
        const all = arr.find(a => a.difficulty && a.difficulty.toLowerCase() === 'all');
        if (all) rank = `Solved: ${all.count}`;
      }
    } catch (e) {
      console.warn('GraphQL fetch failed:', e.message);
    }
  }

  const out = {
    rank: rank ? String(rank) : null,
    formatted: (rank && /^\d+$/.test(String(rank))) ? Number(rank).toLocaleString() : (rank || null),
    updated: new Date().toISOString()
  };

  const outPath = path.join(__dirname, '..', 'assets', 'data', 'leetcode.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  try {
    if (fs.existsSync(outPath)) fs.unlinkSync(outPath);
  } catch (e) {
    console.warn('Could not remove previous leetcode.json:', e.message);
  }
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf8');
  console.log('Wrote', outPath, out);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});