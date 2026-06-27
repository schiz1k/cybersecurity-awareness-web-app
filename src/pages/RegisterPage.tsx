import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { SectionTitle } from '../components/SectionTitle'
import { usePlatformState } from '../hooks/usePlatformState'

export function RegisterPage() {
  const navigate = useNavigate()
  const { hasRegisteredAccount, registerUser } = usePlatformState()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [city, setCity] = useState('')
  const [primaryTrack, setPrimaryTrack] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (hasRegisteredAccount) {
    return <Navigate to="/profile" replace />
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setMessage('')

    try {
      await registerUser({
        email,
        password,
        displayName,
        city: city || undefined,
        primaryTrack: primaryTrack || undefined,
      })
      navigate('/profile')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Не удалось создать аккаунт.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="page">
      <section className="page-hero">
        <div>
          <span className="eyebrow">Регистрация</span>
          <h1>Создайте личный аккаунт</h1>
          <p>
            После регистрации ваши результаты, закладки, завершённые материалы и профиль будут
            сохраняться в персональной записи пользователя.
          </p>
        </div>
        <div className="page-hero__aside">
          <div className="card compact-card">
            <strong>1</strong>
            <span>личный профиль</span>
          </div>
          <div className="card compact-card">
            <strong>∞</strong>
            <span>сохранённых результатов</span>
          </div>
        </div>
      </section>

      <section className="section section--split">
        <article className="card profile-card">
          <SectionTitle
            eyebrow="Новый пользователь"
            title="Регистрация в системе"
            description="Укажите основные данные, чтобы создать аккаунт и начать сохранять персональный прогресс."
          />

          <form className="profile-card" onSubmit={handleSubmit}>
            <label className="field">
              <span>Имя</span>
              <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} required />
            </label>
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
            <label className="field">
              <span>Город</span>
              <input value={city} onChange={(event) => setCity(event.target.value)} />
            </label>
            <label className="field">
              <span>Направление</span>
              <input
                value={primaryTrack}
                onChange={(event) => setPrimaryTrack(event.target.value)}
                placeholder="Например: SOC Tier 1"
              />
            </label>

            {message ? <div className="status-banner">{message}</div> : null}

            <div className="form-actions">
              <button type="submit" className="button button--primary" disabled={isSubmitting}>
                {isSubmitting ? 'Создание аккаунта...' : 'Зарегистрироваться'}
              </button>
              <Link to="/login" className="button button--ghost">
                Уже есть аккаунт
              </Link>
            </div>
          </form>
        </article>

        <div className="detail-column">
          <article className="card feature-card">
            <h3>Что появится после регистрации</h3>
            <ul className="stack-list">
              <li>Персональная история прохождений</li>
              <li>Собственные закладки и завершённые материалы</li>
              <li>Отдельный профиль в рейтинге участников</li>
            </ul>
          </article>
          <article className="card feature-card">
            <h3>Для кого это нужно</h3>
            <p>
              Регистрация нужна тем, кто проходит обучение регулярно и хочет сохранять результаты в
              собственной учётной записи.
            </p>
          </article>
        </div>
      </section>
    </div>
  )
}
