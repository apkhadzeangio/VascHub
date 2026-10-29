import React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, CalendarDays, CirclePlay, GitFork } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Search } from '@/search/Component'
import { LivePreviewListener } from '@/components/LivePreviewListener'
import { draftMode } from 'next/headers'
import { homepageDefaults, publicHref } from './defaults'
import { upcomingEvents } from './events'
import { getHomepageData, getHomepagePage } from './data'
import { LibraryCard } from '@/Library/Card'
import { dateLabel, postURL, ResourceCard } from './ResourceCard'

function SectionHeading({
  title,
  href,
  mobileTitle,
}: {
  title: string
  href?: string
  mobileTitle?: string
}) {
  return (
    <div className="vh-section-heading">
      <h2>
        {mobileTitle ? (
          <>
            <span className="vh-desktop-label">{title}</span>
            <span className="vh-mobile-label">{mobileTitle}</span>
          </>
        ) : (
          title
        )}
      </h2>
      {href && (
        <Button variant="ghost" size="lg" asChild>
          <Link href={href}>
            ყველას ნახვა
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </Button>
      )}
    </div>
  )
}
export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <Card className="vh-empty-state">
      <p>{children}</p>
    </Card>
  )
}

export async function HomePage() {
  const { home, resources, news, academyPost, libraryResources } = await getHomepageData()
  const { isEnabled: draft } = await draftMode()
  const topics = home?.topics?.length ? home.topics : homepageDefaults.topics
  const events = upcomingEvents(home?.events ?? [])
  return (
    <main className="vh-theme vh-home" tabIndex={-1}>
      {draft && <LivePreviewListener />}
      <div className="vh-container vh-home-sections">
        <section className="vh-intro" aria-labelledby="homepage-heading">
          <p className="vh-eyebrow">{home?.eyebrow ?? homepageDefaults.eyebrow}</p>
          <h1 id="homepage-heading">{home?.heading || homepageDefaults.heading}</h1>
          <p className="vh-intro-copy">{home?.intro ?? homepageDefaults.intro}</p>
          <div className="vh-home-search">
            <Search id="homepage-search" />
            <p className="vh-search-help">
              ძიება გამოქვეყნებულ სტატიებში, აღწერებსა და კატეგორიებში
            </p>
          </div>
          <div className="vh-topics">
            <h2>სწრაფი გადასვლა თემაზე</h2>
            <ul className="vh-topic-grid">
              {topics.map((topic, index) => (
                <li key={index}>
                  <Link href={`/library?q=${encodeURIComponent(topic.searchTerm)}`}>
                    <GitFork size={25} aria-hidden="true" />
                    <span>{topic.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
        <section aria-label="კლინიკური ბიბლიოთეკა">
          <SectionHeading title="კლინიკური ბიბლიოთეკა" href="/library" />
          <p className="vh-section-caption">გაიდლაინები, პუბლიკაციები და სასწავლო რესურსები</p>
          {libraryResources.length ? (
            <div className="vh-resource-grid">
              {libraryResources.map((resource) => (
                <LibraryCard key={resource.id} resource={resource} />
              ))}
            </div>
          ) : (
            <EmptyState>ბიბლიოთეკის რესურსები გამოქვეყნების შემდეგ გამოჩნდება.</EmptyState>
          )}
        </section>
        <section id="resources" className="vh-resources" aria-label="კლინიკური რესურსები">
          <SectionHeading
            title="ბოლო დამატებული რესურსები"
            mobileTitle="ახალი რესურსები"
            href="/posts"
          />
          <p className="vh-section-caption">გამოქვეყნებული სტატიები და მასალები</p>
          {resources.length ? (
            <div className="vh-resource-grid">
              {resources.map((post) => (
                <ResourceCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <EmptyState>
              გამოქვეყნებული რესურსები ჯერ არ არის. ახალი მასალები აქ გამოჩნდება.
            </EmptyState>
          )}
        </section>
        <section id="academy" className="vh-academy" aria-labelledby="academy-heading">
          <div className="vh-academy-intro">
            <span className="vh-badge">აკადემია</span>
            <h2 id="academy-heading">
              {home?.academy?.heading || homepageDefaults.academy.heading}
            </h2>
            <p>{home?.academy?.description ?? homepageDefaults.academy.description}</p>
            {academyPost ? (
              <Button size="lg" asChild>
                <Link href={postURL(academyPost)}>
                  სასწავლო მასალის ნახვა
                  <ArrowRight size={18} aria-hidden="true" />
                </Link>
              </Button>
            ) : (
              <p className="vh-academy-empty">სასწავლო მასალა მოგვიანებით დაემატება.</p>
            )}
          </div>
          <div className="vh-featured-course">
            <CirclePlay size={32} aria-hidden="true" />
            <p>გამორჩეული სასწავლო მასალა</p>
            {academyPost ? (
              <h3>
                <Link href={postURL(academyPost)}>{academyPost.title}</Link>
              </h3>
            ) : (
              <h3>შემდეგი სასწავლო ნაბიჯი — მალე</h3>
            )}
          </div>
        </section>
        <div className="vh-updates">
          <section id="events" aria-labelledby="events-heading">
            <h2 id="events-heading">უახლოესი ღონისძიებები</h2>
            {events.length ? (
              <div className="vh-event-list">
                {events.map((event, index) => {
                  const href = publicHref(event.url)
                  if (!href) return null
                  return (
                    <Link href={href} key={event.id || index} className="vh-event-link">
                      <Card className="vh-event-card">
                        <CalendarDays size={28} aria-hidden="true" />
                        <div>
                          <h3>{event.title}</h3>
                          <p>
                            {event.date ? (
                              <time dateTime={event.date}>{dateLabel(event.date)}</time>
                            ) : (
                              'თარიღი ზუსტდება'
                            )}
                            {event.location ? ` • ${event.location}` : ''}
                          </p>
                        </div>
                        <ArrowRight size={18} aria-hidden="true" />
                      </Card>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <EmptyState>ამ ეტაპზე ღონისძიებები არ არის გამოქვეყნებული.</EmptyState>
            )}
          </section>
          <section id="news" aria-labelledby="news-heading">
            <h2 id="news-heading">პროფესიული სიახლეები</h2>
            {news.length ? (
              <div className="vh-news-list">
                {news.map((post) => (
                  <article key={post.id}>
                    <p>პროფესიული სივრცე</p>
                    <h3>
                      <Link href={postURL(post)}>{post.title}</Link>
                    </h3>
                    <time dateTime={post.updatedAt}>{dateLabel(post.updatedAt)}</time>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState>პროფესიული სიახლეები მალე დაემატება.</EmptyState>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}

export async function generateHomepageMetadata(): Promise<Metadata> {
  const page = await getHomepagePage()
  return {
    title: page?.meta?.title || 'VascHub — სისხლძარღვთა ქირურგიის პროფესიული პლატფორმა',
    description: page?.meta?.description || page?.homepage?.intro || homepageDefaults.intro,
  }
}
