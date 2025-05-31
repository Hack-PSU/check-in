import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import LogsPage from './page'; // Importing from page.tsx
import { useAllScans } from 'src/common/api/scan/hook';
import { useAllUsers } from 'src/common/api/user/hook';
import { useAllEvents } from 'src/common/api/event/hook';
import { useAllOrganizers } from 'src/common/api/organizer/hook';
import { CheckInLogEntry } from 'src/common/types/log';

// Firebase is now manually mocked via __mocks__/@firebase/auth.js

// Keep the specific mock for your local firebase config if it does more than just export auth
// If src/common/config/firebase.ts *only* does `getAuth()` and exports it,
// the manual mock for @firebase/auth should be sufficient if `src/common/config/firebase`
// correctly imports and re-exports `getAuth` or its result.
// Let's simplify this or ensure it uses the auto-mocked firebase.
// If `src/common/config/firebase` is `export const auth = getAuth();` then it should pick the mock.
// No need to use jest.requireActual if we want the mock to propagate.

jest.mock('src/common/config/firebase', () => {
  // This will now use the getAuth from __mocks__/@firebase/auth.js
  const { getAuth } = require('@firebase/auth');
  return {
    auth: getAuth(),
  };
});


// Mock the hooks
jest.mock('src/common/api/scan/hook');
jest.mock('src/common/api/user/hook');
jest.mock('src/common/api/event/hook');
jest.mock('src/common/api/organizer/hook');

// Mock the CheckInLogTable component
jest.mock('src/components/CheckInLogTable', () => {
  // Mocking the table and asserting it receives correct data
  return jest.fn(({ data }: { data: CheckInLogEntry[] }) => (
    <div data-testid="check-in-log-table">
      {data.map(entry => (
        <div key={entry.scanId} data-testid={`log-entry-${entry.scanId}`}>
          {entry.userName} - {entry.eventName}
        </div>
      ))}
    </div>
  ));
});


const mockScansData = [
  { id: 'scan1', userEmail: 'user1@example.com', eventId: 'event1', organizerEmail: 'org1@example.com', timestamp: 1678886400000 },
  { id: 'scan2', userEmail: 'user2@example.com', eventId: 'event2', organizerEmail: 'org2@example.com', timestamp: 1678972800000 },
];
const mockUsersData = [
  { email: 'user1@example.com', name: 'User One' },
  { email: 'user2@example.com', name: 'User Two' },
];
const mockEventsData = [
  { id: 'event1', name: 'Event Alpha', hackathonId: 'hack1' },
  { id: 'event2', name: 'Event Beta', hackathonId: 'hack2' },
];
const mockOrganizersData = [
  { email: 'org1@example.com', name: 'Organizer Alpha' },
  { email: 'org2@example.com', name: 'Organizer Beta' },
];

describe('LogsPage', () => {
  const mockUseAllScans = useAllScans as jest.Mock;
  const mockUseAllUsers = useAllUsers as jest.Mock;
  const mockUseAllEvents = useAllEvents as jest.Mock;
  const mockUseAllOrganizers = useAllOrganizers as jest.Mock;

  beforeEach(() => {
    // Reset mocks before each test
    mockUseAllScans.mockReset();
    mockUseAllUsers.mockReset();
    mockUseAllEvents.mockReset();
    mockUseAllOrganizers.mockReset();
    // Clear mock call counts for the table component
    (require('src/components/CheckInLogTable') as jest.Mock).mockClear();
  });

  test('displays loading state initially', () => {
    mockUseAllScans.mockReturnValue({ data: null, isLoading: true, error: null });
    mockUseAllUsers.mockReturnValue({ data: null, isLoading: true, error: null });
    mockUseAllEvents.mockReturnValue({ data: null, isLoading: true, error: null });
    mockUseAllOrganizers.mockReturnValue({ data: null, isLoading: true, error: null });

    render(<LogsPage />);
    expect(screen.getByText('Loading check-in logs...')).toBeInTheDocument();
  });

  test('displays error state if any hook returns an error', () => {
    mockUseAllScans.mockReturnValue({ data: null, isLoading: false, error: new Error('Scan error') });
    mockUseAllUsers.mockReturnValue({ data: mockUsersData, isLoading: false, error: null });
    mockUseAllEvents.mockReturnValue({ data: mockEventsData, isLoading: false, error: null });
    mockUseAllOrganizers.mockReturnValue({ data: mockOrganizersData, isLoading: false, error: null });

    render(<LogsPage />);
    expect(screen.getByText('Error loading data. Please try again later.')).toBeInTheDocument();
  });

  test('displays "No check-in logs found." when there are no scans', async () => {
    mockUseAllScans.mockReturnValue({ data: [], isLoading: false, error: null });
    mockUseAllUsers.mockReturnValue({ data: mockUsersData, isLoading: false, error: null });
    mockUseAllEvents.mockReturnValue({ data: mockEventsData, isLoading: false, error: null });
    mockUseAllOrganizers.mockReturnValue({ data: mockOrganizersData, isLoading: false, error: null });

    render(<LogsPage />);
    expect(screen.getByText('No check-in logs found.')).toBeInTheDocument();
  });

  test('transforms data correctly and passes it to CheckInLogTable', async () => {
    mockUseAllScans.mockReturnValue({ data: mockScansData, isLoading: false, error: null });
    mockUseAllUsers.mockReturnValue({ data: mockUsersData, isLoading: false, error: null });
    mockUseAllEvents.mockReturnValue({ data: mockEventsData, isLoading: false, error: null });
    mockUseAllOrganizers.mockReturnValue({ data: mockOrganizersData, isLoading: false, error: null });

    render(<LogsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('check-in-log-table')).toBeInTheDocument();
    });

    const tableMock = require('src/components/CheckInLogTable') as jest.Mock;
    expect(tableMock).toHaveBeenCalledTimes(1);

    const expectedLogEntries: CheckInLogEntry[] = [
      {
        scanId: 'scan1',
        userEmail: 'user1@example.com',
        userName: 'User One',
        eventName: 'Event Alpha',
        organizerEmail: 'org1@example.com',
        organizerName: 'Organizer Alpha',
        timestamp: 1678886400000,
        hackathonId: 'hack1',
      },
      {
        scanId: 'scan2',
        userEmail: 'user2@example.com',
        userName: 'User Two',
        eventName: 'Event Beta',
        organizerEmail: 'org2@example.com',
        organizerName: 'Organizer Beta',
        timestamp: 1678972800000,
        hackathonId: 'hack2',
      },
    ];

    // Check that the data passed to the mock table is correct
    const actualDataPassed = tableMock.mock.calls[0][0].data;
    expect(actualDataPassed).toEqual(expectedLogEntries);

    // Also check rendered output from the mock table
    expect(screen.getByTestId('log-entry-scan1')).toHaveTextContent('User One - Event Alpha');
    expect(screen.getByTestId('log-entry-scan2')).toHaveTextContent('User Two - Event Beta');
  });

  test('handles missing user, event, or organizer data gracefully', async () => {
    const partialScans = [{ id: 'scan3', userEmail: 'user3@unknown.com', eventId: 'event3unknown', organizerEmail: 'org3unknown@example.com', timestamp: Date.now() }];
    mockUseAllScans.mockReturnValue({ data: partialScans, isLoading: false, error: null });
    mockUseAllUsers.mockReturnValue({ data: mockUsersData, isLoading: false, error: null }); // user3 is missing
    mockUseAllEvents.mockReturnValue({ data: mockEventsData, isLoading: false, error: null }); // event3 is missing
    mockUseAllOrganizers.mockReturnValue({ data: mockOrganizersData, isLoading: false, error: null }); // org3 is missing

    render(<LogsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('check-in-log-table')).toBeInTheDocument();
    });

    const tableMock = require('src/components/CheckInLogTable') as jest.Mock;
    const actualDataPassed = tableMock.mock.calls[0][0].data;

    expect(actualDataPassed[0].userName).toBe('Unknown User');
    expect(actualDataPassed[0].eventName).toBe('Unknown Event');
    expect(actualDataPassed[0].organizerName).toBe('Unknown Organizer');
    expect(screen.getByTestId('log-entry-scan3')).toHaveTextContent('Unknown User - Unknown Event');
  });

});
