import AdminDataTable from "../components/AdminDataTable";

const columns = [
  { name: "Name", selector: row => row.name, sortable: true },
  { name: "Admission #", selector: row => row.admission_number, sortable: true },
  { name: "Grade", selector: row => row.grade_name || row.grade?.name, sortable: true },
  { name: "Email", selector: row => row.email },
  { name: "Actions", cell: row => <button className="text-indigo-600">Edit</button> }
];

export default function AdminStudents() {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Students</h2>
      <AdminDataTable endpoint="/api/v1/students" columns={columns} />
    </div>
  );
}
