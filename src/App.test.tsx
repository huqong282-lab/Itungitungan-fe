import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders the not found page for an unmatched location', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: 'Page Not Found' })).toBeInTheDocument()
  })
})
