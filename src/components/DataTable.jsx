import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Search, ChevronDown } from 'lucide-react';

export default function DataTable({
  columns,
  data,
  loading = false,
  title = "",
  onSearch = null,
  searchPlaceholder = "Search...",
  showSearch = true,
  showPagination = true,
  pageSizeOptions = [10, 20, 25, 30, 50, 100],
  defaultPageSize = 10,
  onRowClick = null,
  actions = null,
  customRenderers = {} // Add custom renderers for specific columns
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [showPageSizeDropdown, setShowPageSizeDropdown] = useState(false);
  const [filteredData, setFilteredData] = useState(data);

  // Filter data based on search term
  useEffect(() => {
    if (!searchTerm.trim() || !onSearch) {
      setFilteredData(data);
    } else {
      const filtered = onSearch(data, searchTerm);
      setFilteredData(filtered);
    }
  }, [data, searchTerm, onSearch]);

  // Reset to first page when data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredData]);

  // Pagination calculations
  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentData = filteredData.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size) => {
    setPageSize(size);
    setCurrentPage(1);
    setShowPageSizeDropdown(false);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  // Render cell value with custom renderer if provided
  const renderCellValue = (row, column, value) => {
    if (customRenderers[column.accessor]) {
      return customRenderers[column.accessor](value, row);
    }
    return value;
  };

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
      {/* Header */}
      {(title || showSearch) && (
        <div className="p-4 border-b border-slate-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {title && <h2 className="text-lg font-semibold text-white">{title}</h2>}
          {showSearch && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearch}
                placeholder={searchPlaceholder}
                className="pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none w-full sm:w-80"
              />
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-3"></div>
            <p className="text-gray-400">Loading...</p>
          </div>
        ) : currentData.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-400">No data found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-700/50">
              <tr>
                {columns.map((col, idx) => (
                  <th
                    key={idx}
                    className="py-3 px-4 text-left text-sm font-medium text-gray-300"
                    style={{ width: col.width }}
                  >
                    {col.header}
                  </th>
                ))}
                {actions && <th className="py-3 px-4 text-right text-sm font-medium text-gray-300">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {currentData.map((row, rowIdx) => (
                <tr
                  key={row.id || rowIdx}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`border-b border-slate-700 hover:bg-slate-700/30 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                >
                  {columns.map((col, colIdx) => (
                    <td key={colIdx} className="py-3 px-4 text-white">
                      {col.accessor ? renderCellValue(row, col, row[col.accessor]) : col.render(row)}
                    </td>
                  ))}
                  {actions && (
                    <td className="py-3 px-4 text-right">
                      {typeof actions === 'function' ? actions(row) : actions}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {showPagination && totalPages > 0 && (
        <div className="p-4 border-t border-slate-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-sm text-gray-400">
            Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} entries
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setShowPageSizeDropdown(!showPageSizeDropdown)}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 border border-slate-600 rounded-lg text-sm text-gray-300 hover:bg-slate-600 transition-colors"
              >
                {pageSize} / page
                <ChevronDown className={`h-4 w-4 transition-transform ${showPageSizeDropdown ? 'rotate-180' : ''}`} />
              </button>
              {showPageSizeDropdown && (
                <div className="absolute bottom-full mb-1 right-0 bg-slate-700 border border-slate-600 rounded-lg shadow-lg z-10 min-w-[100px]">
                  {pageSizeOptions.map((size) => (
                    <button
                      key={size}
                      onClick={() => handlePageSizeChange(size)}
                      className={`block w-full text-left px-4 py-2 text-sm hover:bg-slate-600 transition-colors ${
                        pageSize === size ? 'text-blue-400 bg-slate-600/50' : 'text-gray-300'
                      }`}
                    >
                      {size} per page
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                className="px-3 py-1.5 bg-slate-700 border border-slate-600 rounded-lg text-sm text-gray-300 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                First
              </button>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1.5 bg-slate-700 border border-slate-600 rounded-lg text-sm text-gray-300 hover:bg-slate-600 disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              
              {getPageNumbers().map((page, idx) => (
                <button
                  key={idx}
                  onClick={() => typeof page === 'number' && handlePageChange(page)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    page === currentPage
                      ? 'bg-blue-600 text-white'
                      : page === '...'
                      ? 'bg-transparent text-gray-400 cursor-default'
                      : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                  }`}
                  disabled={page === '...'}
                >
                  {page}
                </button>
              ))}
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 bg-slate-700 border border-slate-600 rounded-lg text-sm text-gray-300 hover:bg-slate-600 disabled:opacity-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 bg-slate-700 border border-slate-600 rounded-lg text-sm text-gray-300 hover:bg-slate-600 disabled:opacity-50"
              >
                Last
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}