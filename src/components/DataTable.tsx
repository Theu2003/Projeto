export interface Column<T> {
  key: keyof T & string;
  header: string;
  render?: (row: T) => React.ReactNode;
}

export interface DataTableAction<T> {
  label: string | ((row: T) => string | null);
  onClick: (row: T) => void;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  actions?: DataTableAction<T>[];
  emptyMessage?: string;
  className?: string;
  caption?: string;
}

export function DataTable<T extends { id: string }>({
  columns,
  data,
  actions,
  emptyMessage,
  className,
  caption,
}: DataTableProps<T>) {
  const isEmpty = data.length === 0;

  if (isEmpty && emptyMessage) {
    return <p className="text-gray-500 dark:text-gray-400 text-center py-8">{emptyMessage}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className={`min-w-full divide-y divide-gray-200 dark:divide-gray-700 ${className ?? ''}`}>
        {caption && <caption className="text-sm text-gray-500 dark:text-gray-400 mb-2">{caption}</caption>}
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                {col.header}
              </th>
            ))}
            {actions && actions.length > 0 && (
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            )}
          </tr>
        </thead>
        {!isEmpty && (
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {data.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                    {col.render ? col.render(row) : String(row[col.key] ?? '')}
                  </td>
                ))}
                {actions && actions.length > 0 && (
                  <td className="px-4 py-3 text-sm space-x-2">
                    {actions.map((action, idx) => {
                      const label = typeof action.label === 'function' ? action.label(row) : action.label;
                      if (!label) return null;
                      return (
                        <button
                          key={idx}
                          onClick={() => action.onClick(row)}
                          className="text-green-600 dark:text-green-400 hover:underline"
                        >
                          {label}
                        </button>
                      );
                    })}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        )}
      </table>
    </div>
  );
}
