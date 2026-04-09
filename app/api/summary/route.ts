import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(request: NextRequest) {
  try {
    const { reflection, weekData } = await request.json()

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey || apiKey === 'placeholder') {
      return NextResponse.json({
        analysis: `📊 Weekly Summary\n\nBased on your week:\n• Workouts completed: ${weekData.workouts.length}\n• Food entries logged: ${weekData.food.length}\n• Sleep entries logged: ${weekData.sleep.length}\n\n${reflection ? `Your reflection: "${reflection}"\n\n` : ''}Keep up the great work! To get personalized AI analysis, please configure your ANTHROPIC_API_KEY environment variable.\n\n💡 Tip: Consistency is key — try to log your activities every day this week!`,
      })
    }

    const client = new Anthropic({ apiKey })

    const workoutSummary = weekData.workouts.length > 0
      ? `${weekData.workouts.length} workouts: ${weekData.workouts.map((w: { type: string; duration: number; caloriesBurned: number }) => `${w.type} (${w.duration}min, ${w.caloriesBurned}cal)`).join(', ')}`
      : 'No workouts logged'

    const totalCalories = weekData.food.reduce((sum: number, f: { calories: number }) => sum + f.calories, 0)
    const avgSleepQuality = weekData.sleep.length > 0
      ? (weekData.sleep.reduce((sum: number, s: { quality: number }) => sum + s.quality, 0) / weekData.sleep.length).toFixed(1)
      : 'N/A'

    const prompt = `You are a supportive fitness coach. Analyze this person's week and provide a personalized analysis with one specific improvement tip.

Week Data:
- Workouts: ${workoutSummary}
- Nutrition: ${weekData.food.length} food entries, ${totalCalories} total calories logged
- Sleep: ${weekData.sleep.length} entries, average quality: ${avgSleepQuality}/10
- Weight entries: ${weekData.weight.length}
- Personal reflection: "${reflection || 'Not provided'}"

Provide a warm, encouraging 3-4 paragraph analysis covering: what they did well, areas for improvement, and one very specific actionable tip for next week. Keep it concise and motivating.`

    const message = await client.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const analysis = message.content[0].type === 'text' ? message.content[0].text : ''

    return NextResponse.json({ analysis })
  } catch (error) {
    console.error('Summary API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate summary. Please try again.' },
      { status: 500 }
    )
  }
}
