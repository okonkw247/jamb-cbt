import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { subject, topic, message, history } = await req.json();

  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  const systemPrompt = `You are a friendly and expert JAMB tutor helping a Nigerian SS3 student understand "${topic}" in ${subject}. 

Rules:
- Always relate your answers to JAMB exams
- Use simple English that a Nigerian student understands
- Give short, clear answers (max 4-5 sentences)
- Use examples from Nigerian context when possible
- If student seems confused, break it down step by step
- Encourage the student
- Never go off-topic from ${subject} and ${topic}`;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 500,
        messages: [
          { role: "system", content: systemPrompt },
          ...history,
          { role: "user", content: message },
        ],
      }),
    });

    const data = await response.json();
    if (data.error) return NextResponse.json({ error: data.error.message }, { status: 500 });

    const reply = data.choices?.[0]?.message?.content || "I could not answer that. Try asking differently!";
    return NextResponse.json({ reply });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
