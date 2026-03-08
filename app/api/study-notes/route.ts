import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { subject, topic } = await req.json();

  if (!subject || !topic) {
    return NextResponse.json({ error: "Subject and topic required" }, { status: 400 });
  }

  const prompt = `You are a JAMB expert teacher in Nigeria. Generate comprehensive study notes for a Nigerian SS3 student preparing for JAMB.

Subject: ${subject}
Topic: ${topic}

Format your response as JSON with this exact structure:
{
  "title": "Topic title",
  "overview": "2-3 sentence overview of the topic",
  "keyPoints": ["point 1", "point 2", "point 3", "point 4", "point 5"],
  "definitions": [{"term": "term1", "meaning": "meaning1"}, {"term": "term2", "meaning": "meaning2"}],
  "examTips": ["tip 1", "tip 2", "tip 3"],
  "summary": "One paragraph summary to remember"
}

Make it specific to JAMB syllabus and Nigerian curriculum. Return ONLY the JSON, no markdown.`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1500,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();
    const text = data.content?.[0]?.text || "";
    const clean = text.replace(/```json|```/g, "").trim();
    const notes = JSON.parse(clean);
    return NextResponse.json({ notes });
  } catch (err) {
    console.error("Study notes error:", err);
    return NextResponse.json({ error: "Failed to generate notes" }, { status: 500 });
  }
}
