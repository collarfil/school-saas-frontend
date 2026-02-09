import React, { useEffect, useMemo, useState } from "react";
import DataTable from "react-data-table-component";

// Example props: endpoint="/api/v1/students"
export default function AdminDataTable({ endpoint, columns: initialColumns }) {
  const [data, setData] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("");

  const token = localStorage.getItem("token");

  const fetchData = async (page, per_page, filterText = "") => {
    const q = new URLSearchParams({ page, per_page, search: filterText }).toString();
    const res = await fetch(`${endpoint}?${q}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    const json = await res.json();
    // adapt to your backend shape: { data: [...], meta: { total } }
    setData(json.data || json.items || json);
    setTotalRows(json.meta?.total || json.total || (json.length ?? 0));
  };

  useEffect(() => {
    fetchData(page, perPage, filter);
    // eslint-disable-next-line
  }, [page, perPage]);

  const handlePerRowsChange = async (newPerPage, page) => {
    setPerPage(newPerPage);
  };

  const handlePageChange = (page) => {
    setPage(page);
  };

  const handleFilter = (e) => {
    setFilter(e.target.value);
    // debounce if heavy; for now immediate:
    fetchData(1, perPage, e.target.value);
    setPage(1);
  };

  const columns = useMemo(() => initialColumns, [initialColumns]);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <input
          value={filter}
          onChange={handleFilter}
          placeholder="Search..."
          className="border px-3 py-2 rounded-lg"
        />
      </div>

      <DataTable
        columns={columns}
        data={data}
        pagination
        paginationServer
        paginationTotalRows={totalRows}
        onChangeRowsPerPage={handlePerRowsChange}
        onChangePage={handlePageChange}
        highlightOnHover
        selectableRows={false}
        persistTableHead
      />
    </div>
  );
}
