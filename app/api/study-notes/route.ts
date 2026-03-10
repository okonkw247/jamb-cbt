import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { subject, topic } = await req.json();

  if (!subject || !topic) {
    return NextResponse.json({ error: "Subject and topic required" }, { status: 400 });
  }

  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  const prompt = `You are Nigeria's best JAMB teacher with 20 years of experience. A Nigerian SS3 student needs to fully understand "${topic}" in ${subject} to pass their JAMB exam. Write the most comprehensive, clear, and student-friendly study notes possible.

Return ONLY a valid JSON object with NO markdown, NO backticks, NO extra text:

{
  "title": "Full topic title",
  "overview": "Write 4-5 sentences introducing the topic in simple English that a Nigerian SS3 student can understand. Explain why this topic is important for JAMB.",
  "keyPoints": [
    "Write at least 8 detailed key points. Each point must be a full explanation, not just a heading. Use simple language.",
    "Point 2 with full explanation...",
    "Point 3 with full explanation...",
    "Point 4 with full explanation...",
    "Point 5 with full explanation...",
    "Point 6 with full explanation...",
    "Point 7 with full explanation...",
    "Point 8 with full explanation..."
  ],
  "definitions": [
    {"term": "Important term 1", "meaning": "Clear simple definition a student can memorize"},
    {"term": "Important term 2", "meaning": "Clear simple definition"},
    {"term": "Important term 3", "meaning": "Clear simple definition"},
    {"term": "Important term 4", "meaning": "Clear simple definition"},
    {"term": "Important term 5", "meaning": "Clear simple definition"}
  ],
  "diagrams": [
    {"title": "Diagram 1 title", "description": "Describe exactly what the diagram looks like and what each part represents. Be very detailed so the student can visualize it clearly."},
    {"title": "Diagram 2 title", "description": "Detailed description of second diagram."}
  ],
  "workedExamples": [
    {"question": "A typical JAMB question on this topic", "answer": "The correct answer", "explanation": "Step by step explanation of how to arrive at the answer"},
    {"question": "Another typical JAMB question", "answer": "The correct answer", "explanation": "Step by step explanation"}
  ],
  "examTips": [
    "Specific JAMB exam tip 1 - what examiners love to ask about this topic",
    "Specific JAMB exam tip 2 - common mistakes students make",
    "Specific JAMB exam tip 3 - keywords to look out for",
    "Specific JAMB exam tip 4 - how to eliminate wrong options",
    "Specific JAMB exam tip 5 - what to memorize"
  ],
  "commonMistakes": [
    "Common mistake 1 students make on this topic in JAMB",
    "Common mistake 2",
    "Common mistake 3"
  ],
  "videoSearch": "YouTube search term to find the best video explanation of this topic e.g 'Photosynthesis light and dark reactions explained'",
  "summary": "Write a detailed 5-6 sentence summary that covers everything the student needs to remember. This should be good enough to read the night before JAMB."
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
        max_tokens: 4000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();

    if (data.error) {
      return NextResponse.json({ error: data.error.message }, { status: 500 });
    }

    const text = data.choices?.[0]?.message?.content || "";
    const clean = text.replace(/```json|```/g, "").trim();
    const notes = JSON.parse(clean);
    return NextResponse.json({ notes });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Unknown error" }, { status: 500 });
  }
}
