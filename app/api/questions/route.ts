import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";

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

// Server-side memory cache
const cache: Record<string, { data: any; timestamp: number }> = {};
const CACHE_TTL = 10 * 60 * 1000;

// Initialize Firebase Admin
function getAdminDb() {
  if (!getApps().find(a => a.name === "admin")) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
      databaseURL: "https://jamb-cbt-8fa5d-default-rtdb.firebaseio.com",
    }, "admin");
  }
  return getDatabase(getApps().find(a => a.name === "admin")!);
}

export async function GET(req: NextRequest) {
  const subject = req.nextUrl.searchParams.get("subject") || "Use of English";
  const topic = req.nextUrl.searchParams.get("topic") || "";
  const subjectKey = subject.replace(/ /g, "_");
  const cacheKey = `${subjectKey}:${topic}`;

  // Return cached if fresh
  if (cache[cacheKey] && Date.now() - cache[cacheKey].timestamp < CACHE_TTL) {
    return NextResponse.json(cache[cacheKey].data, {
      headers: { "X-Cache": "HIT" }
    });
  }

  // Try Firebase questions first (our own database)
  try {
    const adminDb = getAdminDb();
    const snap = await adminDb.ref(`questions/${subjectKey}`).get();
    const firebaseData = snap.val();

    if (firebaseData && Object.keys(firebaseData).length >= 10) {
      const questions = Object.entries(firebaseData)
        .map(([id, q]: any) => ({ id, ...q }))
        .sort(() => Math.random() - 0.5)
        .slice(0, 40);

      const response = { data: questions, source: "firebase" };
      cache[cacheKey] = { data: response, timestamp: Date.now() };
      return NextResponse.json(response, {
        headers: { "X-Cache": "FIREBASE", "Cache-Control": "public, max-age=300" }
      });
    }
  } catch (err) {
    console.error("Firebase admin error:", err);
  }

  // Fallback to ALOC API
  const alocKey = subjectMap[subject] || "english";
  const url = topic
    ? `https://questions.aloc.com.ng/api/v2/q/40?subject=${alocKey}&topic=${encodeURIComponent(topic)}&type=utme`
    : `https://questions.aloc.com.ng/api/v2/q/40?subject=${alocKey}&type=utme`;

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
    return NextResponse.json(data, {
      headers: { "X-Cache": "ALOC", "Cache-Control": "public, max-age=600" }
    });
  } catch (err) {
    if (cache[cacheKey]) {
      return NextResponse.json(cache[cacheKey].data, { headers: { "X-Cache": "STALE" } });
    }
    return NextResponse.json({ error: "Failed", data: [] }, { status: 500 });
  }
}
