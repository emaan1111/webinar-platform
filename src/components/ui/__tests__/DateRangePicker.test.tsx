import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import DateRangePicker from '../DateRangePicker'

function DateRangePickerHarness() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  return (
    <DateRangePicker
      label="Analytics range"
      startDate={startDate}
      endDate={endDate}
      onStartDateChange={setStartDate}
      onEndDateChange={setEndDate}
      onClear={() => {
        setStartDate('')
        setEndDate('')
      }}
    />
  )
}

describe('DateRangePicker', () => {
  it('selects presets and reflects friendly text', async () => {
    const user = userEvent.setup()
    render(<DateRangePickerHarness />)

    const trigger = screen.getByRole('button', { name: /select date range/i })
    await user.click(trigger)

    await user.click(screen.getByRole('button', { name: /last 7 days/i }))

    expect(screen.getByText('Last 7 Days')).toBeInTheDocument()
  })

  it('supports custom date entry and clearing the selection', async () => {
    const user = userEvent.setup()
    render(<DateRangePickerHarness />)

    const trigger = screen.getByRole('button', { name: /select date range/i })
    await user.click(trigger)

    const startInput = screen.getByLabelText(/start date/i)
    const endInput = screen.getByLabelText(/end date/i)

    await user.type(startInput, '2024-05-01')
    await user.type(endInput, '2024-05-03')

    expect(screen.getByText('May 1 - May 3, 2024')).toBeInTheDocument()

    const clear = screen.getByRole('button', { name: /clear dates/i })
    await user.click(clear)

    expect(screen.getByText('Select date range')).toBeInTheDocument()
  })
})
