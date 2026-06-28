import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const body = await req.json()

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      max_tokens: body.max_tokens,
      messages: [
        { role: "system", content: body.system },
        ...body.messages,
      ],
    }),
  })

  const data = await response.json()

  if (data.error) {
    return NextResponse.json({
      content: [{ text: "Too many requests, please wait a few seconds and try again." }]
    })
  }

  // Convert OpenAI format to Anthropic format so AIAssistant.tsx works unchanged
  return NextResponse.json({
    content: [{ text: data.choices?.[0]?.message?.content || "Something went wrong." }]
  })
}