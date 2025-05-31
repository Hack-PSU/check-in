import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import CheckInLogTable from './CheckInLogTable';
import { CheckInLogEntry } from 'src/common/types/log';

const mockData: CheckInLogEntry[] = [
  { scanId: '1', userName: 'Alice Wonderland', userEmail: 'alice@example.com', eventName: 'Mad Tea Party', organizerName: 'Mad Hatter', organizerEmail: 'hatter@example.com', timestamp: 1678886400000, hackathonId: 'ht1' }, // Mar 15 2023 12:00:00
  { scanId: '2', userName: 'Bob The Builder', userEmail: 'bob@example.com', eventName: 'Construction Con', organizerName: 'Wendy', organizerEmail: 'wendy@example.com', timestamp: 1678972800000, hackathonId: 'ht2' }, // Mar 16 2023 12:00:00
  { scanId: '3', userName: 'Charlie Brown', userEmail: 'charlie@example.com', eventName: 'Comic Expo', organizerName: 'Snoopy', organizerEmail: 'snoopy@example.com', timestamp: 1678790400000, hackathonId: 'ht1' }, // Mar 14 2023 12:00:00
  { scanId: '4', userName: 'Diana Prince', userEmail: 'diana@example.com', eventName: 'Hero Summit', organizerName: 'Wonder Woman', organizerEmail: 'ww@example.com', timestamp: 1679059200000, hackathonId: 'ht3' }, // Mar 17 2023 12:00:00
];

describe('CheckInLogTable', () => {
  test('renders table with initial data', () => {
    render(<CheckInLogTable data={mockData} />);
    expect(screen.getByText('Alice Wonderland')).toBeInTheDocument();
    expect(screen.getByText('Bob The Builder')).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(mockData.length + 1); // +1 for header row
  });

  // Filtering Tests
  test('filters by user name', () => {
    render(<CheckInLogTable data={mockData} />);
    fireEvent.change(screen.getByPlaceholderText('Filter by User Name'), { target: { value: 'Alice' } });
    expect(screen.getByText('Alice Wonderland')).toBeInTheDocument();
    expect(screen.queryByText('Bob The Builder')).not.toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(2); // Alice + header
  });

  test('filters by user email', () => {
    render(<CheckInLogTable data={mockData} />);
    fireEvent.change(screen.getByPlaceholderText('Filter by User Email'), { target: { value: 'charlie@example.com' } });
    expect(screen.getByText('Charlie Brown')).toBeInTheDocument();
    expect(screen.queryByText('Alice Wonderland')).not.toBeInTheDocument();
  });

  test('filters by event name', () => {
    render(<CheckInLogTable data={mockData} />);
    fireEvent.change(screen.getByPlaceholderText('Filter by Event Name'), { target: { value: 'Hero Summit' } });
    expect(screen.getByText('Diana Prince')).toBeInTheDocument();
    expect(screen.queryByText('Mad Tea Party')).not.toBeInTheDocument();
  });

  test('filters by organizer name', () => {
    render(<CheckInLogTable data={mockData} />);
    fireEvent.change(screen.getByPlaceholderText('Filter by Organizer Name'), { target: { value: 'Snoopy' } });
    expect(screen.getByText('Charlie Brown')).toBeInTheDocument();
    expect(screen.queryByText('Mad Hatter')).not.toBeInTheDocument();
  });

  test('filters by organizer email', () => {
    render(<CheckInLogTable data={mockData} />);
    fireEvent.change(screen.getByPlaceholderText('Filter by Organizer Email'), { target: { value: 'ww@example.com' } });
    expect(screen.getByText('Diana Prince')).toBeInTheDocument();
    expect(screen.queryByText('wendy@example.com')).not.toBeInTheDocument();
  });

  test('filter is case-insensitive', () => {
    render(<CheckInLogTable data={mockData} />);
    fireEvent.change(screen.getByPlaceholderText('Filter by User Name'), { target: { value: 'alice wonderland' } });
    expect(screen.getByText('Alice Wonderland')).toBeInTheDocument();
  });

  test('shows all data when filter is cleared', () => {
    render(<CheckInLogTable data={mockData} />);
    const filterInput = screen.getByPlaceholderText('Filter by User Name');
    fireEvent.change(filterInput, { target: { value: 'Alice' } });
    expect(screen.getAllByRole('row')).toHaveLength(2);
    fireEvent.change(filterInput, { target: { value: '' } });
    expect(screen.getAllByRole('row')).toHaveLength(mockData.length + 1);
  });

  // Sorting Tests
  test('sorts by user name ascending and descending', () => {
    render(<CheckInLogTable data={mockData} />);
    const userNameHeader = screen.getByText('User Name');

    // Ascending
    fireEvent.click(userNameHeader);
    let rows = screen.getAllByRole('row');
    expect(rows[1].textContent).toContain('Alice Wonderland'); // First data row
    expect(rows[mockData.length].textContent).toContain('Diana Prince'); // Last data row

    // Descending
    fireEvent.click(userNameHeader);
    rows = screen.getAllByRole('row');
    expect(rows[1].textContent).toContain('Diana Prince');
    expect(rows[mockData.length].textContent).toContain('Alice Wonderland');
  });

  test('sorts by timestamp ascending and descending (default sort is timestamp descending)', () => {
    render(<CheckInLogTable data={mockData} />);
    const timestampHeader = screen.getByText('Timestamp');
    let rows = screen.getAllByRole('row');

    // Initial (default) sort is timestamp descending
    expect(rows[1].textContent).toContain('Diana Prince'); // Latest timestamp
    expect(rows[mockData.length].textContent).toContain('Charlie Brown'); // Oldest timestamp

    // Click once for Ascending
    fireEvent.click(timestampHeader);
    rows = screen.getAllByRole('row');
    expect(rows[1].textContent).toContain('Charlie Brown');
    expect(rows[mockData.length].textContent).toContain('Diana Prince');

    // Click again for Descending
    fireEvent.click(timestampHeader);
    rows = screen.getAllByRole('row');
    expect(rows[1].textContent).toContain('Diana Prince');
    expect(rows[mockData.length].textContent).toContain('Charlie Brown');
  });

  test('sorts by event name', () => {
    render(<CheckInLogTable data={mockData} />);
    const eventNameHeader = screen.getByText('Event Name');
    fireEvent.click(eventNameHeader); // Ascending
    let rows = screen.getAllByRole('row');
    expect(rows[1].textContent).toContain('Comic Expo');
    expect(rows[mockData.length].textContent).toContain('Mad Tea Party');
  });

  test('maintains filter while sorting', () => {
    render(<CheckInLogTable data={mockData} />);
    fireEvent.change(screen.getByPlaceholderText('Filter by Event Name'), { target: { value: 'Con' } }); // Filters to "Construction Con"

    expect(screen.getByText('Bob The Builder')).toBeInTheDocument();
    expect(screen.queryByText('Alice Wonderland')).not.toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(2); // Bob + header

    const userNameHeader = screen.getByText('User Name');
    fireEvent.click(userNameHeader); // Sort by user name (only Bob is visible, so no change in order)

    let rows = screen.getAllByRole('row');
    expect(rows[1].textContent).toContain('Bob The Builder');
    expect(screen.getAllByRole('row')).toHaveLength(2);

    // Clear filter
    fireEvent.change(screen.getByPlaceholderText('Filter by Event Name'), { target: { value: '' } });
    expect(screen.getAllByRole('row')).toHaveLength(mockData.length + 1);
  });
});
