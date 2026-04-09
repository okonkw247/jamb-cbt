import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { subject, topic } = await req.json();

  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  const prompt = `Generate 20 flashcards for JAMB students studying "${topic}" in ${subject}.

Return ONLY valid JSON, no markdown, no backticks:
{
  "cards": [
    {"front": "Question or term", "back": "Detailed answer with explanation"},
    {"front": "Question or term", "back": "Detailed answer with explanation"}
  ]
}

Rules:
- Mix question types: definitions, fill-in-blanks, JAMB past questions, calculations
- Answers must be detailed enough to actually teach the student
- Include key facts JAMB examiners love to test
- Use Nigerian context where possible
- 20 cards total`;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 3000,
        temperature: 0.3,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();
    if (data.error) return NextResponse.json({ error: data.error.message }, { status: 500 });

    const text = data.choices?.[0]?.message?.content || "";
    const clean = text.replace(/```json|```/g, "").trim();
    const start = clean.indexOf("{");
    const end = clean.lastIndexOf("}");
    const parsed = JSON.parse(clean.slice(start, end + 1));
    return NextResponse.json({ cards: parsed.cards });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to generate flashcards. Try again!" }, { status: 500 });
  }
}
