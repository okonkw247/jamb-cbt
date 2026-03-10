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

export async function GET(req: NextRequest) {
  const subject = req.nextUrl.searchParams.get("subject") || "Use of English";
  const topic = req.nextUrl.searchParams.get("topic") || "";
  const subjectKey = subjectMap[subject] || "english";

  const url = topic
    ? `https://questions.aloc.com.ng/api/v2/q/40?subject=${subjectKey}&topic=${encodeURIComponent(topic)}&type=utme`
    : `https://questions.aloc.com.ng/api/v2/q/40?subject=${subjectKey}&type=utme`;

  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      AccessToken: "QB-de92a6179a6e85d1d140",
    },
  });

  const data = await res.json();
  return NextResponse.json(data);
}
