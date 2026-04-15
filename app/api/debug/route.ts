import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch(
      "https://questions.aloc.com.ng/api/v2/q/40?subject=mathematics&type=utme",
      {
        headers: {
          Accept: "application/json",
          AccessToken: "QB-de92a6179a6e85d1d140"
        }
      }
    );
    const data = await res.json();
    return NextResponse.json({
      status: res.status,
      questionCount: data.data?.length || 0,
      sample: data.data?.[0]?.question || "none"
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message });
  }
}
