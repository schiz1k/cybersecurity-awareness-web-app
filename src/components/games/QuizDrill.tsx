import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { AttemptPayload, QuizQuestion } from '../../types'

export function QuizDrill({
  questions,
  bestScore,
  onComplete,
}: {
  questions: QuizQuestion[]
  bestScore?: number
  onComplete: (payload: AttemptPayload) => void
}) {
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [selected, setSelected] = useState<number | null>(null)
  const [hintVisible, setHintVisible] = useState(false)
  const [done, setDone] = useState(false)

  const current = questions[index]
  const correct = answers.filter((answer, answerIndex) => questions[answerIndex]?.answer === answer).length

  const restart = () => {
    setIndex(0)
    setAnswers([])
    setSelected(null)
    setHintVisible(false)
    setDone(false)
  }

  const pick = (answer: number) => {
    if (selected !== null) {
      return
    }

    setSelected(answer)
  }

  const next = () => {
    if (selected === null) {
      return
    }

    const nextAnswers = [...answers, selected]
    setAnswers(nextAnswers)
    setSelected(null)
    setHintVisible(false)

    if (index === questions.length - 1) {
      const hits = nextAnswers.filter(
        (answer, answerIndex) => questions[answerIndex]?.answer === answer,
      ).length
      const score = Math.round((hits / questions.length) * 1000)

      setDone(true)
      onComplete({
        score,
        label: `${hits} из ${questions.length}`,
        summary: `Точность ${Math.round((hits / questions.length) * 100)}%.`,
      })
      return
    }

    setIndex((currentIndex) => currentIndex + 1)
  }

  return (
    <section className="game-panel">
      <div className="game-panel__header">
        <div>
          <span className="eyebrow">Knowledge check</span>
          <h3>Короткая внутренняя аттестация</h3>
        </div>
        <div className="game-panel__metrics">
          <span>
            Вопрос {Math.min(index + 1, questions.length)}/{questions.length}
          </span>
          <span>Лучший score: {bestScore ?? 'нет'}</span>
        </div>
      </div>

      {done ? (
        <div className="quiz-result">
          <h4>Квиз завершён</h4>
          <p>
            Верных ответов: {correct} из {questions.length}.
          </p>
          <p className="quiz-card__explanation">
            {correct === questions.length
              ? 'Отличный результат: базовые риски распознаны без ошибок.'
              : 'Повторите карточки, где были ошибки, и обращайте внимание на подсказки перед выбором.'}
          </p>
          <div className="game-panel__actions">
            <button type="button" className="button button--primary" onClick={restart}>
              Пройти заново
            </button>
            <Link to="/materials" className="button button--ghost">
              Вернуться к теме
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="quiz-card">
            <small>Вопрос {index + 1}</small>
            <h4>{current.prompt}</h4>
            <div className="quiz-card__toolbar">
              <button
                type="button"
                className="button button--ghost"
                onClick={() => setHintVisible((visible) => !visible)}
              >
                {hintVisible ? 'Скрыть подсказку' : 'Подсказка'}
              </button>
              <span className="inline-hint">Прогресс: {answers.length}/{questions.length}</span>
            </div>
            {hintVisible ? (
              <p className="quiz-card__hint">{current.hint ?? 'Ищите вариант с наименьшим риском для данных и аккаунта.'}</p>
            ) : null}
            <div className="quiz-options">
              {current.options.map((option, optionIndex) => {
                const isChosen = selected === optionIndex
                const isCorrect = current.answer === optionIndex

                return (
                  <button
                    key={option}
                    type="button"
                    className={`quiz-option ${
                      selected !== null && isCorrect
                        ? 'quiz-option--correct'
                        : selected !== null && isChosen
                          ? 'quiz-option--wrong'
                          : isChosen
                            ? 'quiz-option--selected'
                            : ''
                    }`}
                    onClick={() => pick(optionIndex)}
                  >
                    {option}
                  </button>
                )
              })}
            </div>
            {selected !== null ? (
              <div className="quiz-card__feedback">
                <strong>{selected === current.answer ? 'Верно' : 'Стоит выбрать другой вариант'}</strong>
                <p>{current.explanation}</p>
              </div>
            ) : null}
          </div>

          <div className="game-panel__actions">
            <button type="button" className="button button--primary" onClick={next}>
              {index === questions.length - 1 ? 'Завершить' : 'Следующий вопрос'}
            </button>
            <span className="inline-hint">Верно сейчас: {correct}</span>
          </div>
        </>
      )}
    </section>
  )
}
