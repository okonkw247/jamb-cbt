import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { subject, topic } = await req.json();

  if (!subject || !topic) {
    return NextResponse.json({ error: "Subject and topic required" }, { status: 400 });
  }

  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  const prompt = `You are a JAMB expert teacher in Nigeria. Generate study notes for "${topic}" in ${subject} for an SS3 student.

IMPORTANT: Return ONLY valid JSON. No markdown. No backticks. No extra text. Keep each field SHORT.

{
  "title": "short title",
  "overview": "3 sentences max",
  "keyPoints": ["point 1", "point 2", "point 3", "point 4", "point 5"],
  "definitions": [{"term": "term1", "meaning": "short meaning"}, {"term": "term2", "meaning": "short meaning"}, {"term": "term3", "meaning": "short meaning"}],
  "diagrams": [{"title": "diagram title", "description": "2 sentences describing the diagram"}],
  "workedExamples": [{"question": "JAMB question", "answer": "correct answer", "explanation": "2 sentence explanation"}, {"question": "JAMB question 2", "answer": "correct answer", "explanation": "2 sentence explanation"}],
  "examTips": ["tip 1", "tip 2", "tip 3"],
  "commonMistakes": ["mistake 1", "mistake 2"],
  "videoSearch": "YouTube search term",
  "summary": "3 sentences max summary"
}`;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        max_tokens: 2000,
        temperature: 0.3,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();
    if (data.error) {
      return NextResponse.json({ error: data.error.message }, { status: 500 });
    }

    const text = data.choices?.[0]?.message?.content || "";
    const clean = text.replace(/```json|```/g, "").trim();
    
    // Find JSON boundaries safely
    const start = clean.indexOf("{");
    const end = clean.lastIndexOf("}");
    if (start === -1 || end === -1) {
      return NextResponse.json({ error: "Invalid response from AI" }, { status: 500 });
    }
    
    const jsonStr = clean.slice(start, end + 1);
    const notes = JSON.parse(jsonStr);
    return NextResponse.json({ notes });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to parse AI response. Try again!" }, { status: 500 });
  }
}
