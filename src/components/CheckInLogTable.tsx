import React, { useState, useMemo } from 'react';
import { CheckInLogEntry } from 'src/common/types/log';

interface CheckInLogTableProps {
  data: CheckInLogEntry[];
}

type SortKey = keyof CheckInLogEntry | null;

interface SortConfig {
  key: SortKey;
  direction: 'ascending' | 'descending';
}

interface Filters {
  userName: string;
  userEmail: string;
  eventName: string;
  organizerName: string;
  organizerEmail: string;
}

const CheckInLogTable: React.FC<CheckInLogTableProps> = ({ data }) => {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>({ key: 'timestamp', direction: 'descending' });
  const [filters, setFilters] = useState<Filters>({
    userName: '',
    userEmail: '',
    eventName: '',
    organizerName: '',
    organizerEmail: '',
  });

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>, filterKey: keyof Filters) => {
    setFilters({ ...filters, [filterKey]: e.target.value });
  };

  const filteredData = useMemo(() => {
    if (!data) return [];
    return data.filter(entry => {
      return (
        entry.userName.toLowerCase().includes(filters.userName.toLowerCase()) &&
        entry.userEmail.toLowerCase().includes(filters.userEmail.toLowerCase()) &&
        entry.eventName.toLowerCase().includes(filters.eventName.toLowerCase()) &&
        entry.organizerName.toLowerCase().includes(filters.organizerName.toLowerCase()) &&
        entry.organizerEmail.toLowerCase().includes(filters.organizerEmail.toLowerCase())
      );
    });
  }, [data, filters]);

  const requestSort = (key: SortKey) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = useMemo(() => {
    const sortableItems = [...filteredData];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        if (sortConfig.key === null) return 0;
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];

        if (valA === null || valA === undefined) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (valB === null || valB === undefined) return sortConfig.direction === 'ascending' ? 1 : -1;

        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortConfig.direction === 'ascending' ? valA - valB : valB - valA;
        }
        if (typeof valA === 'string' && typeof valB === 'string') {
          return sortConfig.direction === 'ascending' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        const strA = String(valA).toLowerCase();
        const strB = String(valB).toLowerCase();
        return sortConfig.direction === 'ascending' ? strA.localeCompare(strB) : strB.localeCompare(strA);
      });
    }
    return sortableItems;
  }, [filteredData, sortConfig]);

  const getSortIndicator = (key: SortKey) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <span className="ml-1 text-gray-400"></span>; // Placeholder for spacing
    }
    return sortConfig.direction === 'ascending' ? <span className="ml-1">🔼</span> : <span className="ml-1">🔽</span>;
  };

  return (
    <div className="overflow-x-auto">
      <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 rounded-lg shadow">
        <input
          type="text"
          placeholder="Filter by User Name"
          value={filters.userName}
          onChange={(e) => handleFilterChange(e, 'userName')}
          className="p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
        <input
          type="text"
          placeholder="Filter by User Email"
          value={filters.userEmail}
          onChange={(e) => handleFilterChange(e, 'userEmail')}
          className="p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
        <input
          type="text"
          placeholder="Filter by Event Name"
          value={filters.eventName}
          onChange={(e) => handleFilterChange(e, 'eventName')}
          className="p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
        <input
          type="text"
          placeholder="Filter by Organizer Name"
          value={filters.organizerName}
          onChange={(e) => handleFilterChange(e, 'organizerName')}
          className="p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
        <input
          type="text"
          placeholder="Filter by Organizer Email"
          value={filters.organizerEmail}
          onChange={(e) => handleFilterChange(e, 'organizerEmail')}
          className="p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>
      <div className="shadow border-b border-gray-200 sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th onClick={() => requestSort('userName')} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">User Name {getSortIndicator('userName')}</th>
              <th onClick={() => requestSort('userEmail')} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">User Email {getSortIndicator('userEmail')}</th>
              <th onClick={() => requestSort('eventName')} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">Event Name {getSortIndicator('eventName')}</th>
              <th onClick={() => requestSort('organizerName')} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">Organizer Name {getSortIndicator('organizerName')}</th>
              <th onClick={() => requestSort('organizerEmail')} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">Organizer Email {getSortIndicator('organizerEmail')}</th>
              <th onClick={() => requestSort('timestamp')} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">Timestamp {getSortIndicator('timestamp')}</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedData.map((entry, index) => (
              <tr key={entry.scanId || index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50 hover:bg-gray-100'}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.userName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{entry.userEmail}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{entry.eventName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{entry.organizerName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{entry.organizerEmail}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{new Date(entry.timestamp).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CheckInLogTable;
