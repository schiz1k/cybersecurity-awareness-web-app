import {
  Bell,
  BookOpenText,
  ChartNoAxesCombined,
  ChevronDown,
  Clock3,
  Dumbbell,
  Home,
  Info,
  LogIn,
  Menu,
  Search,
  Shield,
  Settings,
  Sparkles,
  Trophy,
  UserPlus,
  UserRound,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { navigationLinks } from '../config/navigation'
import { useContentState } from '../hooks/useContentState'
import { usePlatformState } from '../hooks/usePlatformState'

function ScrollToTop() {
  const location = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [location.pathname])

  return null
}

export function Layout() {
  const [open, setOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { tests, materials } = useContentState()
  const { hasRegisteredAccount, state } = usePlatformState()
  const navIcons = {
    Главная: Home,
    Тренировки: Dumbbell,
    Рейтинг: Trophy,
    Материалы: BookOpenText,
    'О нас': Info,
    Профиль: UserRound,
  }
  const normalizedQuery = searchQuery.trim().toLowerCase()
  const searchResults = useMemo(() => {
    const testResults = tests
      .filter((test) => {
        if (!normalizedQuery) {
          return test.status === 'playable'
        }

        return `${test.title} ${test.description} ${test.category} ${test.deck.join(' ')}`
          .toLowerCase()
          .includes(normalizedQuery)
      })
      .slice(0, 4)
      .map((test) => ({
        description: `${test.category} · ${test.duration}`,
        icon: Dumbbell,
        label: test.title,
        to: `/tests/${test.slug}`,
        type: 'Тренировка',
      }))

    const materialResults = materials
      .filter((material) => {
        if (!normalizedQuery) {
          return true
        }

        return `${material.title} ${material.summary} ${material.category} ${material.highlights.join(' ')}`
          .toLowerCase()
          .includes(normalizedQuery)
      })
      .slice(0, normalizedQuery ? 4 : 2)
      .map((material) => ({
        description: `${material.category} · ${material.readTime}`,
        icon: BookOpenText,
        label: material.title,
        to: `/materials/${material.slug}`,
        type: 'Материал',
      }))

    return [...testResults, ...materialResults].slice(0, 6)
  }, [materials, normalizedQuery, tests])

  const notifications = hasRegisteredAccount
    ? [
        state.attempts[0]
          ? {
              description: state.attempts[0].summary,
              icon: Trophy,
              label: `Последний результат: ${state.attempts[0].score}`,
              to: '/profile',
            }
          : {
              description: 'Запустите первый тренажёр, чтобы получить персональный прогресс.',
              icon: Dumbbell,
              label: 'Начните тренировку',
              to: '/tests',
            },
        {
          description: 'Новые сценарии помогают закрепить фишинг, пароли и приватность.',
          icon: Shield,
          label: 'Доступны тренировки по кибергигиене',
          to: '/tests',
        },
        {
          description: `${state.bookmarkedMaterials.length} материалов сохранено в профиле.`,
          icon: BookOpenText,
          label: 'Ваши материалы',
          to: '/profile',
        },
      ]
    : []
  const notificationCount = notifications.length

  const closePanels = () => {
    setOpen(false)
    setSearchOpen(false)
    setNotificationsOpen(false)
    setProfileMenuOpen(false)
  }

  const toggleSearch = () => {
    setSearchOpen((current) => !current)
    setNotificationsOpen(false)
    setProfileMenuOpen(false)
    setOpen(false)
  }

  const toggleNotifications = () => {
    setNotificationsOpen((current) => !current)
    setSearchOpen(false)
    setProfileMenuOpen(false)
    setOpen(false)
  }

  const toggleProfileMenu = () => {
    setProfileMenuOpen((current) => !current)
    setSearchOpen(false)
    setNotificationsOpen(false)
    setOpen(false)
  }

  return (
    <>
      <ScrollToTop />
      <div className="shell">
        <header className="topbar">
          <NavLink to="/" className="brand" onClick={closePanels}>
            <span className="brand__mark">
              <Shield size={34} strokeWidth={2.2} />
            </span>
            <span className="brand__text">
              Cyber Arena
            </span>
          </NavLink>

          <nav className={`nav ${open ? 'nav--open' : ''}`}>
            {navigationLinks.map((link) => {
              const Icon = navIcons[link.label as keyof typeof navIcons]

              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) => `nav__link ${isActive ? 'nav__link--active' : ''}`}
                  onClick={closePanels}
                >
                  {Icon ? <Icon size={18} strokeWidth={2.1} /> : null}
                  {link.label}
                </NavLink>
              )
            })}
            {!hasRegisteredAccount ? (
              <div className="nav__auth">
                <NavLink to="/login" className="button button--ghost" onClick={closePanels}>
                  <LogIn size={16} />
                  Войти
                </NavLink>
                <NavLink to="/register" className="button button--primary" onClick={closePanels}>
                  <UserPlus size={16} />
                  Регистрация
                </NavLink>
              </div>
            ) : null}
          </nav>

          <div className="topbar__actions">
            <button
              type="button"
              className="icon-button"
              aria-label="Поиск"
              aria-expanded={searchOpen}
              title="Поиск"
              onClick={toggleSearch}
            >
              <Search size={20} />
            </button>
            <button
              type="button"
              className="icon-button notification-button"
              aria-label="Уведомления"
              aria-expanded={notificationsOpen}
              onClick={toggleNotifications}
            >
              <Bell size={19} />
              {notificationCount ? <span>{notificationCount}</span> : null}
            </button>
            {hasRegisteredAccount ? (
              <button
                type="button"
                className="profile-pill"
                aria-expanded={profileMenuOpen}
                onClick={toggleProfileMenu}
              >
                <span className="profile-pill__avatar">{state.learnerName.slice(0, 1)}</span>
                <span>{state.learnerName}</span>
                <ChevronDown size={16} />
              </button>
            ) : (
              <div className="auth-actions">
                <NavLink to="/login" className="button button--ghost" onClick={closePanels}>
                  <LogIn size={16} />
                  Войти
                </NavLink>
                <NavLink to="/register" className="button button--primary" onClick={closePanels}>
                  <UserPlus size={16} />
                  Регистрация
                </NavLink>
              </div>
            )}
            <NavLink to="/tests" className="button button--primary" onClick={closePanels}>
              Запустить тренажёр
            </NavLink>
            <button
              type="button"
              className="menu-button"
              aria-label="Открыть меню"
              onClick={() => {
                setOpen((current) => !current)
                setSearchOpen(false)
                setNotificationsOpen(false)
              }}
            >
              {open ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>

          {searchOpen ? (
            <div className="topbar-popover topbar-popover--search">
              <label className="topbar-search">
                <Search size={18} />
                <input
                  autoFocus
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Найти тренировку или материал..."
                />
              </label>
              <div className="topbar-results">
                {searchResults.length ? (
                  searchResults.map((item) => {
                    const Icon = item.icon

                    return (
                      <NavLink
                        key={`${item.type}-${item.to}`}
                        to={item.to}
                        className="topbar-result"
                        onClick={closePanels}
                      >
                        <span className="topbar-result__icon">
                          <Icon size={17} />
                        </span>
                        <span>
                          <strong>{item.label}</strong>
                          <small>{item.description}</small>
                        </span>
                        <b>{item.type}</b>
                      </NavLink>
                    )
                  })
                ) : (
                  <div className="topbar-empty">Ничего не найдено. Попробуйте другой запрос.</div>
                )}
              </div>
              <div className="topbar-popover__footer">
                <NavLink to="/tests" onClick={closePanels}>Все тренировки</NavLink>
                <NavLink to="/materials" onClick={closePanels}>Все материалы</NavLink>
              </div>
            </div>
          ) : null}

          {notificationsOpen ? (
            <div className="topbar-popover topbar-popover--notifications">
              <div className="topbar-popover__header">
                <strong>Уведомления</strong>
                <small>{hasRegisteredAccount ? 'Обновления профиля и тренировок' : 'Доступны после входа'}</small>
              </div>
              {hasRegisteredAccount ? (
                <div className="notification-list">
                  {notifications.map((item) => {
                    const Icon = item.icon

                    return (
                      <NavLink
                        key={item.label}
                        to={item.to}
                        className="notification-item"
                        onClick={closePanels}
                      >
                        <span>
                          <Icon size={17} />
                        </span>
                        <span>
                          <strong>{item.label}</strong>
                          <small>{item.description}</small>
                        </span>
                      </NavLink>
                    )
                  })}
                </div>
              ) : (
                <div className="notification-empty">
                  <Clock3 size={20} />
                  <p>Войдите в аккаунт, чтобы видеть результаты, напоминания и персональные рекомендации.</p>
                  <div>
                    <NavLink to="/login" className="button button--ghost" onClick={closePanels}>
                      Войти
                    </NavLink>
                    <NavLink to="/register" className="button button--primary" onClick={closePanels}>
                      Зарегистрироваться
                    </NavLink>
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {profileMenuOpen ? (
            <div className="topbar-popover topbar-popover--profile">
              <div className="topbar-popover__header">
                <strong>{state.learnerName}</strong>
                <small>{state.role}</small>
              </div>
              <div className="profile-menu-list">
                <NavLink to="/profile?section=progress" className="profile-menu-item" onClick={closePanels}>
                  <ChartNoAxesCombined size={17} />
                  <span>
                    <strong>Прогресс</strong>
                    <small>Статистика, активность и закладки</small>
                  </span>
                </NavLink>
                <NavLink to="/profile?section=settings" className="profile-menu-item" onClick={closePanels}>
                  <Settings size={17} />
                  <span>
                    <strong>Настройки</strong>
                    <small>Тема и размер шрифта</small>
                  </span>
                </NavLink>
                <NavLink to="/profile?section=achievements" className="profile-menu-item" onClick={closePanels}>
                  <Trophy size={17} />
                  <span>
                    <strong>Достижения</strong>
                    <small>Награды и прогресс выполнения</small>
                  </span>
                </NavLink>
                <NavLink to="/profile?section=recommendations" className="profile-menu-item" onClick={closePanels}>
                  <Sparkles size={17} />
                  <span>
                    <strong>Рекомендации</strong>
                    <small>Следующие тренировки и материалы</small>
                  </span>
                </NavLink>
              </div>
            </div>
          ) : null}
        </header>

        <main>
          <Outlet />
        </main>

        <footer className="footer">
          <div>
            <p className="footer__title">Cyber Arena</p>
            <p className="footer__copy">
              Платформа для просвещения пользователей в кибербезопасности: практические тренажёры,
              понятные материалы и прогресс обучения в одном месте.
            </p>
          </div>
        </footer>
      </div>
    </>
  )
}
