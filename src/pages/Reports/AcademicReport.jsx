import { GraduationCap, Printer, Download } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AcademicReport() {
  const handlePrint = () => window.print();
  const handleExport = () => toast.success('Export functionality coming soon');

  return (
    <div className="text-white p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <GraduationCap className="h-8 w-8 text-blue-400" />
          <div>
            <h2 className="text-2xl font-bold">Academic Performance Report</h2>
            <p className="text-gray-400 mt-1">Track student academic progress</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button onClick={handlePrint} className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg flex items-center space-x-2">
            <Printer className="h-4 w-4" /><span>Print</span>
          </button>
          <button onClick={handleExport} className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg flex items-center space-x-2">
            <Download className="h-4 w-4" /><span>Export</span>
          </button>
        </div>
      </div>
      <div className="bg-slate-800 rounded-lg p-8 text-center">
        <GraduationCap className="h-16 w-16 text-gray-500 mx-auto mb-4" />
        <p className="text-gray-400">Academic performance report feature coming soon...</p>
      </div>
    </div>
  );
}