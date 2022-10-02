import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import App from './App'
import '@testing-library/jest-dom'
import userEvent from '@testing-library/user-event'
import { act } from 'react-dom/test-utils'

describe('Renders the app', () => {

  const mockFetch = (response, isReject = false) => {
    if (isReject) {
      global.fetch = jest.fn(response)
    } else {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          json: response,
        })
      )
    }
  }

  afterEach(() => {
    jest.clearAllMocks()
  })
  
  test('renders App as per snapshot', () => {
    const container = render(<App />)
    expect(container).toMatchSnapshot()
  })

  test('accepts input and show loading icon', async () => {
    mockFetch(() => Promise.resolve({ deliverySchedule: '12:34 12:45 001' }))

    act(() => {
      render(<App />)
    })

    userEvent.type(screen.getByTestId('coffee-order-input'), 'A')  
    fireEvent.click(screen.getByTestId('submit-button'))
    expect(screen.getByTestId('loading-icon')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.queryByTestId('loading-icon')).not.toBeInTheDocument()
    })
  })

  test('dismiss output and give focus back to Order input', async () => {
    mockFetch(() => Promise.resolve({ deliverySchedule: '12:34 12:45 001' }))
    
    act(() => {
      render(<App />)
    })

    userEvent.type(screen.getByTestId('coffee-order-input'), 'A')  
    fireEvent.click(screen.getByTestId('submit-button'))
    await waitFor(() => {
      expect(screen.queryByTestId('loading-icon')).not.toBeInTheDocument()
      expect(screen.getByTestId('coffee-order-output').textContent).toBe('12:34 12:45 001')
      fireEvent.click(screen.getByTestId('dismiss-output'))
      expect(screen.getByTestId('coffee-order-input')).toHaveFocus()
    })
  })
  
  test('accepts input and handle error', async () => {
    mockFetch(() => Promise.reject(new Error('bad input')), true)

    act(() => {
      render(<App />)
    })

    userEvent.type(screen.getByTestId('coffee-order-input'), 'A')  
    fireEvent.click(screen.getByTestId('submit-button'))
    expect(screen.getByTestId('loading-icon')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByTestId('coffee-order-output').textContent).toBe('bad input')
    })
  })

  test('accepts input and handle response with "error"', async () => {
    mockFetch(() => Promise.resolve({ error: 'terrible input' }))

    act(() => {
      render(<App />)
    })

    userEvent.type(screen.getByTestId('coffee-order-input'), 'A')
    fireEvent.click(screen.getByTestId('submit-button'))
    await waitFor(() => {
      expect(screen.queryByTestId('loading-icon')).not.toBeInTheDocument()
      expect(screen.getByTestId('coffee-order-output').textContent).toBe('terrible input')
    })
  })
})