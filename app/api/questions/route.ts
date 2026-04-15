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

const cache: Record<string, { data: any; timestamp: number }> = {};
const CACHE_TTL = 10 * 60 * 1000;

export async function GET(req: NextRequest) {
  const subject = req.nextUrl.searchParams.get("subject") || "Use of English";
  const topic = req.nextUrl.searchParams.get("topic") || "";
  const cacheKey = subject + ":" + topic;

  if (cache[cacheKey] && Date.now() - cache[cacheKey].timestamp < CACHE_TTL) {
    return NextResponse.json(cache[cacheKey].data, { headers: { "X-Cache": "HIT" } });
  }

  const alocKey = subjectMap[subject] || "english";
  const url = topic
    ? "https://questions.aloc.com.ng/api/v2/q/40?subject=" + alocKey + "&topic=" + encodeURIComponent(topic) + "&type=utme"
    : "https://questions.aloc.com.ng/api/v2/q/40?subject=" + alocKey + "&type=utme";

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, {
      headers: { Accept: "application/json", AccessToken: "QB-de92a6179a6e85d1d140" },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const data = await res.json();

    if (data.data?.length > 0) {
      cache[cacheKey] = { data, timestamp: Date.now() };
    }
    return NextResponse.json(data, { headers: { "X-Cache": "ALOC" } });
  } catch (err) {
    if (cache[cacheKey]) {
      return NextResponse.json(cache[cacheKey].data, { headers: { "X-Cache": "STALE" } });
    }
    return NextResponse.json({ error: "Failed", data: [] }, { status: 500 });
  }
}
