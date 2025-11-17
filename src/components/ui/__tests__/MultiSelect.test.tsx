import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import MultiSelect from '../MultiSelect'

function MultiSelectHarness() {
  const [selected, setSelected] = useState<string[]>([])

  return (
    <MultiSelect
      label="Select attendees"
      placeholder="Pick attendees"
      options={['Hosts', 'Guests', 'VIP']}
      selected={selected}
      onChange={setSelected}
    />
  )
}

describe('MultiSelect', () => {
  it('allows selecting and clearing multiple options', async () => {
    const user = userEvent.setup()
    render(<MultiSelectHarness />)

    const trigger = screen.getByRole('button', { name: /pick attendees/i })
    await user.click(trigger)

    const hostsCheckbox = screen.getByLabelText('Hosts', { selector: 'input' })
    await user.click(hostsCheckbox)

    expect(screen.getByText('1 selected')).toBeInTheDocument()
    expect(screen.getByText('Hosts')).toBeInTheDocument()

    const guestsCheckbox = screen.getByLabelText('Guests', { selector: 'input' })
    await user.click(guestsCheckbox)
    expect(screen.getByText('2 selected')).toBeInTheDocument()

    const clearButton = screen.getByRole('button', { name: /clear all/i })
    await user.click(clearButton)

    expect(screen.getByText('Pick attendees')).toBeInTheDocument()
  })

  it('closes the dropdown when the trigger is clicked twice', async () => {
    const user = userEvent.setup()
    render(<MultiSelectHarness />)

    const trigger = screen.getByRole('button', { name: /pick attendees/i })
    await user.click(trigger)
    expect(screen.getByRole('checkbox', { name: 'Hosts' })).toBeInTheDocument()

    await user.click(trigger)
    expect(screen.queryByRole('checkbox', { name: 'Hosts' })).not.toBeInTheDocument()
  })
})
