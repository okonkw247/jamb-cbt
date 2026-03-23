import { NextRequest, NextResponse } from "next/server";

const subjectMap: { [key: string]: string } = {
  "Use of English": "english",
  "Mathematics": "mathematics",
  "Physics": "physics",
  "Chemistry": "chemistry",
  "Biology": "biology",
  "Economics": "economics",
  "Government": "government",
  "Literature": "literature-in-english",
  "Geography": "geography",
  "Commerce": "commerce",
  "Accounting": "accounting",
  "Agriculture": "agriculture",
};

// In-memory cache: key = subject, value = { data, timestamp }
const cache: Record<string, { data: any; timestamp: number }> = {};
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export async function GET(req: NextRequest) {
  const subject = req.nextUrl.searchParams.get("subject") || "Use of English";
  const topic = req.nextUrl.searchParams.get("topic") || "";
  const subjectKey = subjectMap[subject] || "english";
  const cacheKey = `${subjectKey}:${topic}`;

  // Return cached if fresh
  if (cache[cacheKey] && Date.now() - cache[cacheKey].timestamp < CACHE_TTL) {
    return NextResponse.json(cache[cacheKey].data, {
      headers: {
        "Cache-Control": "public, max-age=600",
        "X-Cache": "HIT",
      }
    });
  }

  const url = topic
    ? `https://questions.aloc.com.ng/api/v2/q/40?subject=${subjectKey}&topic=${encodeURIComponent(topic)}&type=utme`
    : `https://questions.aloc.com.ng/api/v2/q/40?subject=${subjectKey}&type=utme`;

  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        AccessToken: "QB-de92a6179a6e85d1d140",
      },
      next: { revalidate: 600 }, // Next.js cache 10 mins
    });

    const data = await res.json();

    // Store in memory cache
    if (data.data && data.data.length > 0) {
      cache[cacheKey] = { data, timestamp: Date.now() };
    }

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, max-age=600",
        "X-Cache": "MISS",
      }
    });
  } catch (err) {
    // Return stale cache if available
    if (cache[cacheKey]) {
      return NextResponse.json(cache[cacheKey].data, {
        headers: { "X-Cache": "STALE" }
      });
    }
    return NextResponse.json({ error: "Failed to fetch questions", data: [] }, { status: 500 });
  }
}
