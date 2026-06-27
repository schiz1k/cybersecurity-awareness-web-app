import { BookOpenText, Mail, MapPin, ShieldCheck, Target, UsersRound } from 'lucide-react'

const projectFacts = [
  {
    icon: ShieldCheck,
    title: 'Практика вместо сухой теории',
    text: 'Тренажёры помогают распознавать фишинг, защищать аккаунты, работать с личными данными и закреплять безопасные привычки.',
  },
  {
    icon: BookOpenText,
    title: 'Понятная база знаний',
    text: 'Материалы собраны короткими карточками, чтобы пользователь мог быстро изучить тему и сразу перейти к проверке знаний.',
  },
  {
    icon: UsersRound,
    title: 'Командный формат',
    text: 'Рейтинг и профиль прогресса помогают поддерживать регулярное обучение внутри учебной группы или команды.',
  },
]

const contacts = [
  {
    icon: Mail,
    label: 'Email',
    value: 'cyberarena@example.com',
  },
  {
    icon: MapPin,
    label: 'Формат',
    value: 'онлайн-платформа для обучения',
  },
]

export function AboutPage() {
  return (
    <div className="page about-page">
      <section className="page-hero about-hero">
        <div>
          <span className="eyebrow">О нас</span>
          <h1>Cyber Arena помогает пользователям безопаснее действовать в цифровой среде.</h1>
          <p>
            Проект объединяет короткие материалы, интерактивные тренировки, прогресс и рейтинг,
            чтобы просвещение пользователей в кибербезопасности было регулярным, понятным и
            практичным.
          </p>
        </div>
        <div className="about-hero__card">
          <Target size={34} />
          <strong>Цель проекта</strong>
          <p>
            Просвещение пользователей в кибербезопасности: объяснять риски простым языком,
            формировать безопасные привычки и помогать проверять знания на практике.
          </p>
        </div>
      </section>

      <section className="section about-section">
        <div className="section__intro">
          <span className="eyebrow">Информация о проекте</span>
          <h2>Обучение, которое легко встроить в повседневную работу</h2>
          <p>
            Cyber Arena подходит для самостоятельного изучения и командных программ. Пользователь
            проходит материалы, закрепляет темы в тренажёрах и видит личный прогресс в профиле.
          </p>
        </div>
        <div className="about-grid">
          {projectFacts.map((item) => {
            const Icon = item.icon

            return (
              <article className="card about-card" key={item.title}>
                <span>
                  <Icon size={24} />
                </span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            )
          })}
        </div>
      </section>

      <section className="section about-contact-section">
        <article className="card about-contact-card">
          <div>
            <span className="eyebrow">Контакты</span>
            <h2>Связь с проектом</h2>
            <p>
              По вопросам внедрения, материалов и обратной связи можно использовать контактные
              данные ниже.
            </p>
          </div>
          <div className="about-contact-list">
            {contacts.map((item) => {
              const Icon = item.icon

              return (
                <div className="about-contact-item" key={item.label}>
                  <span>
                    <Icon size={20} />
                  </span>
                  <div>
                    <small>{item.label}</small>
                    <strong>{item.value}</strong>
                  </div>
                </div>
              )
            })}
          </div>
        </article>
      </section>
    </div>
  )
}
