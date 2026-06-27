import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { SectionTitle } from '../components/SectionTitle'
import { usePlatformState } from '../hooks/usePlatformState'

export function LoginPage() {
  const navigate = useNavigate()
  const { hasRegisteredAccount, loginUser } = usePlatformState()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (hasRegisteredAccount) {
    return <Navigate to="/profile" replace />
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage('')
    setIsSubmitting(true)

    try {
      await loginUser({ email, password })
      navigate('/profile')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Не удалось войти в аккаунт.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="page">
      <section className="page-hero">
        <div>
          <span className="eyebrow">Вход</span>
          <h1>Войдите в личный аккаунт</h1>
          <p>
            Используйте email и пароль, чтобы открыть свой профиль, историю результатов и сохранённые
            материалы.
          </p>
        </div>
        <div className="page-hero__aside">
          <div className="card compact-card">
            <strong>1</strong>
            <span>аккаунт</span>
          </div>
          <div className="card compact-card">
            <strong>24/7</strong>
            <span>доступ к прогрессу</span>
          </div>
        </div>
      </section>

      <section className="section section--split">
        <article className="card profile-card">
          <SectionTitle
            eyebrow="Авторизация"
            title="Вход в систему"
            description="После входа вы сможете сохранять результаты прохождений и работать с персональным профилем."
          />

          <form className="profile-card" onSubmit={handleSubmit}>
            <label className="field">
              <span>Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>
            <label className="field">
              <span>Пароль</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={8}
                required
              />
            </label>

            {message ? <div className="status-banner">{message}</div> : null}

            <div className="form-actions">
              <button type="submit" className="button button--primary" disabled={isSubmitting}>
                {isSubmitting ? 'Вход...' : 'Войти'}
              </button>
              <Link to="/register" className="button button--ghost">
                Создать аккаунт
              </Link>
            </div>
          </form>
        </article>

        <div className="detail-column">
          <article className="card feature-card">
            <h3>Что доступно после входа</h3>
            <ul className="stack-list">
              <li>Сохранение результатов и прогресса</li>
              <li>Персональные закладки и завершённые материалы</li>
              <li>Собственный профиль в рейтинге участников</li>
            </ul>
          </article>
        </div>
      </section>
    </div>
  )
}
