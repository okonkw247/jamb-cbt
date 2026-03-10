import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { subject, topic } = await req.json();

  if (!subject || !topic) {
    return NextResponse.json({ error: "Subject and topic required" }, { status: 400 });
  }

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  const prompt = `You are a JAMB expert teacher in Nigeria. Generate study notes for a Nigerian SS3 student preparing for JAMB.
Subject: ${subject}
Topic: ${topic}
Respond with ONLY a JSON object, no markdown, no explanation:
{
  "title": "Topic title",
  "overview": "2-3 sentence overview",
  "keyPoints": ["point 1", "point 2", "point 3", "point 4", "point 5"],
  "definitions": [{"term": "term1", "meaning": "meaning1"}, {"term": "term2", "meaning": "meaning2"}],
  "examTips": ["tip 1", "tip 2", "tip 3"],
  "summary": "One paragraph summary"
}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 1500 },
        }),
      }
    );

    const data = await response.json();
    if (data.error) {
      return NextResponse.json({ error: data.error.message }, { status: 500 });
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const clean = text.replace(/```json|```/g, "").trim();
    const notes = JSON.parse(clean);
    return NextResponse.json({ notes });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Unknown error" }, { status: 500 });
  }
}
