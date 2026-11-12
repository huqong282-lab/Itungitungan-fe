import { Link, useParams } from 'react-router'

type RoutePlaceholderPageProps = {
  title: string
}

function RoutePlaceholderPage({ title }: RoutePlaceholderPageProps) {
  const params = useParams()
  const routeParameter = Object.entries(params).find(([, value]) => value)

  return (
    <section>
      <h1>{title}</h1>
      <p>This page is a placeholder for {title.toLowerCase()}.</p>
      {routeParameter && (
        <p>
          {routeParameter[0]}: <code>{routeParameter[1]}</code>
        </p>
      )}
    </section>
  )
}

export function NotFoundPage() {
  return (
    <main>
      <h1>Page Not Found</h1>
      <p>The page you requested does not exist.</p>
      <Link to="/app">Back to Dashboard</Link>
    </main>
  )
}

export default RoutePlaceholderPage
