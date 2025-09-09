class QuestionsService {
  async generateQuestions(title: string, description: string) {
    const response = await fetch(
      `http://localhost:8000/api/v1/questions/generate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
        }),
      },
    )

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }

    return response
  }
}

export const questionsService = new QuestionsService()
