// src/pages/Report/ReportCardTemplate.jsx
import React from 'react';

export default function ReportCardTemplate({ student, reportData, school, getGradeFromScore, getPosition }) {
  const { subjects = [], overall = {}, attendance = {}, traits = {} } = reportData;
  
  // Calculate subject rankings
  const sortedSubjects = [...subjects].sort((a, b) => b.average - a.average);
  const rankedSubjects = sortedSubjects.map((subject, index) => ({
    ...subject,
    position: getPosition(index)
  }));

  // Reorder by subject name for display
  const displaySubjects = rankedSubjects.sort((a, b) => a.name?.localeCompare(b.name) || 0);

  // Calculate total students in class for position
  const totalStudents = reportData.total_students || 0;

  return (
    <div className="font-sans text-gray-800" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
      {/* School Header */}
      <div className="text-center border-b-2 border-blue-600 pb-4 mb-6">
        {school?.logo && (
          <div className="flex justify-center mb-2">
            <img src={school.logo} alt="School Logo" className="h-16 w-16 object-contain" />
          </div>
        )}
        <h1 className="text-2xl font-bold text-blue-800 uppercase">{school?.name || 'School Name'}</h1>
        <p className="text-sm text-gray-600">{school?.address || 'School Address'}</p>
        <p className="text-sm text-gray-600">
          Phone: {school?.phone || 'N/A'} | Email: {school?.email || 'N/A'}
        </p>
        <div className="mt-2 flex justify-center items-center space-x-6 text-sm flex-wrap">
          <span className="bg-blue-50 px-3 py-1 rounded">
            <strong>Term:</strong> {reportData.term_name}
          </span>
          <span className="bg-blue-50 px-3 py-1 rounded">
            <strong>Session:</strong> {reportData.session_name}
          </span>
          <span className="bg-blue-50 px-3 py-1 rounded">
            <strong>Class:</strong> {student.grade?.name}
          </span>
        </div>
      </div>

      {/* Student Info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
        <div>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Student Name</p>
          <p className="font-semibold text-gray-800">{student.name}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Admission No.</p>
          <p className="font-semibold text-gray-800">{student.admission_number}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Gender</p>
          <p className="font-semibold text-gray-800">{student.gender || 'N/A'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">House</p>
          <p className="font-semibold text-gray-800">{student.house || 'N/A'}</p>
        </div>
      </div>

      {/* Subjects Table */}
      <div className="overflow-x-auto mb-6">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-blue-600 text-white">
              <th className="py-2 px-3 text-left font-semibold">Subject</th>
              <th className="py-2 px-3 text-center font-semibold">CA/Test</th>
              <th className="py-2 px-3 text-center font-semibold">Exam</th>
              <th className="py-2 px-3 text-center font-semibold">Average</th>
              <th className="py-2 px-3 text-center font-semibold">Total</th>
              <th className="py-2 px-3 text-center font-semibold">Grade</th>
              <th className="py-2 px-3 text-center font-semibold">Position</th>
            </tr>
          </thead>
          <tbody>
            {displaySubjects.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-4 text-gray-500">No subjects found</td>
              </tr>
            ) : (
              displaySubjects.map((subject, index) => {
                const gradeInfo = getGradeFromScore(subject.average);
                return (
                  <tr key={subject.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="py-2 px-3 border border-gray-200 font-medium">{subject.name}</td>
                    <td className="py-2 px-3 text-center border border-gray-200">{subject.ca_score ?? '-'}</td>
                    <td className="py-2 px-3 text-center border border-gray-200">{subject.exam_score ?? '-'}</td>
                    <td className="py-2 px-3 text-center border border-gray-200 font-medium">{subject.average ?? '-'}</td>
                    <td className="py-2 px-3 text-center border border-gray-200 font-medium">{subject.total ?? '-'}</td>
                    <td className={`py-2 px-3 text-center border border-gray-200 font-bold ${gradeInfo.color}`}>
                      {gradeInfo.grade}
                    </td>
                    <td className="py-2 px-3 text-center border border-gray-200">{subject.position}</td>
                  </tr>
                );
              })
            )}
          </tbody>
          {displaySubjects.length > 0 && (
            <tfoot>
              <tr className="bg-blue-50 font-bold">
                <td className="py-2 px-3 border border-gray-200">Overall</td>
                <td className="py-2 px-3 text-center border border-gray-200" colSpan="2">-</td>
                <td className="py-2 px-3 text-center border border-gray-200">{overall.average ?? 0}%</td>
                <td className="py-2 px-3 text-center border border-gray-200">{overall.total ?? 0}</td>
                <td className={`py-2 px-3 text-center border border-gray-200 ${getGradeFromScore(overall.average || 0).color}`}>
                  {getGradeFromScore(overall.average || 0).grade}
                </td>
                <td className="py-2 px-3 text-center border border-gray-200">
                  {overall.position || (totalStudents > 0 ? `1/${totalStudents}` : '-')}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Grading Scale */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-6 text-sm">
        <div className="bg-green-100 p-2 text-center rounded border border-green-200">
          <span className="font-bold text-green-700">A</span>
          <span className="text-gray-600"> 90-100%</span>
        </div>
        <div className="bg-blue-100 p-2 text-center rounded border border-blue-200">
          <span className="font-bold text-blue-700">B</span>
          <span className="text-gray-600"> 80-89%</span>
        </div>
        <div className="bg-yellow-100 p-2 text-center rounded border border-yellow-200">
          <span className="font-bold text-yellow-700">C</span>
          <span className="text-gray-600"> 70-79%</span>
        </div>
        <div className="bg-orange-100 p-2 text-center rounded border border-orange-200">
          <span className="font-bold text-orange-700">D</span>
          <span className="text-gray-600"> 60-69%</span>
        </div>
        <div className="bg-red-100 p-2 text-center rounded border border-red-200">
          <span className="font-bold text-red-700">E</span>
          <span className="text-gray-600"> Below 60%</span>
        </div>
      </div>

      {/* Bottom Section - Combined from both templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 border-t-2 border-blue-600 pt-6">
        {/* Left Column - Attendance & Psychomotor */}
        <div>
          <h4 className="font-bold text-blue-700 mb-2 border-b border-blue-200 pb-1 text-sm uppercase tracking-wider">
            Attendance & Growth
          </h4>
          <div className="grid grid-cols-2 gap-2 text-sm bg-gray-50 p-3 rounded">
            <div>
              <span className="text-gray-600">Times Opened:</span>
              <span className="font-semibold ml-1">{attendance.times_opened || '-'}</span>
            </div>
            <div>
              <span className="text-gray-600">Times Present:</span>
              <span className="font-semibold ml-1">{attendance.times_present || '-'}</span>
            </div>
            <div>
              <span className="text-gray-600">Height:</span>
              <span className="font-semibold ml-1">{attendance.height || '-'}cm</span>
            </div>
            <div>
              <span className="text-gray-600">Weight:</span>
              <span className="font-semibold ml-1">{attendance.weight || '-'}kg</span>
            </div>
          </div>

          <h4 className="font-bold text-blue-700 mt-4 mb-2 border-b border-blue-200 pb-1 text-sm uppercase tracking-wider">
            Affective Traits
          </h4>
          <div className="grid grid-cols-2 gap-1 text-sm bg-gray-50 p-3 rounded">
            <div className="flex justify-between border-b border-gray-100 py-1">
              <span className="text-gray-600">Participation:</span>
              <span className="font-semibold">{traits.participation || '-'}</span>
            </div>
            <div className="flex justify-between border-b border-gray-100 py-1">
              <span className="text-gray-600">Homework:</span>
              <span className="font-semibold">{traits.homework || '-'}</span>
            </div>
            <div className="flex justify-between border-b border-gray-100 py-1">
              <span className="text-gray-600">Projects:</span>
              <span className="font-semibold">{traits.projects || '-'}</span>
            </div>
            <div className="flex justify-between border-b border-gray-100 py-1">
              <span className="text-gray-600">Leadership:</span>
              <span className="font-semibold">{traits.leadership || '-'}</span>
            </div>
            <div className="flex justify-between border-b border-gray-100 py-1">
              <span className="text-gray-600">Politeness:</span>
              <span className="font-semibold">{traits.politeness || '-'}</span>
            </div>
            <div className="flex justify-between border-b border-gray-100 py-1">
              <span className="text-gray-600">Punctuality:</span>
              <span className="font-semibold">{traits.punctuality || '-'}</span>
            </div>
            <div className="flex justify-between border-b border-gray-100 py-1">
              <span className="text-gray-600">Interaction:</span>
              <span className="font-semibold">{traits.interaction || '-'}</span>
            </div>
            <div className="flex justify-between border-b border-gray-100 py-1">
              <span className="text-gray-600">Responsibility:</span>
              <span className="font-semibold">{traits.responsibility || '-'}</span>
            </div>
          </div>

          <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded">
            <p><strong>Keys:</strong> A = Excellent, B = High, C = Minimum, D = Unnoticeable</p>
          </div>
        </div>

        {/* Right Column - Teachers Comments & Signatures */}
        <div>
          <h4 className="font-bold text-blue-700 mb-2 border-b border-blue-200 pb-1 text-sm uppercase tracking-wider">
            Teacher's Remarks
          </h4>
          <div className="bg-gray-50 p-3 rounded-lg mb-3 min-h-[80px] border border-gray-200">
            <p className="text-sm italic text-gray-700">
              "{reportData.teacher_comment || 'No comment provided'}"
            </p>
            <p className="text-xs text-gray-500 mt-2">
              <strong>Class Teacher:</strong> {reportData.class_teacher || 'N/A'}
            </p>
          </div>
          
          <div className="bg-gray-50 p-3 rounded-lg min-h-[80px] border border-gray-200">
            <p className="text-sm italic text-gray-700">
              "{reportData.head_teacher_comment || 'No comment provided'}"
            </p>
            <p className="text-xs text-gray-500 mt-2">
              <strong>Head Teacher:</strong> {reportData.head_teacher || 'N/A'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="border-t-2 border-gray-300 pt-2">
              <p className="text-xs text-gray-500">Class Teacher's Signature</p>
              <div className="h-8"></div>
              <p className="text-xs mt-1">Date: {reportData.signature_date || '-'}</p>
            </div>
            <div className="border-t-2 border-gray-300 pt-2">
              <p className="text-xs text-gray-500">Head Teacher's Signature</p>
              <div className="h-8"></div>
              <p className="text-xs mt-1">Date: {reportData.signature_date || '-'}</p>
            </div>
          </div>

          <div className="mt-4 p-2 bg-yellow-50 border-2 border-yellow-300 rounded text-center text-xs text-gray-600 font-semibold">
            <p>⚠ PLEASE RETURN THIS REPORT CARD ON RESUMPTION</p>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="mt-4 text-center text-xs text-gray-400 border-t border-gray-200 pt-4">
        <p>Generated on {new Date().toLocaleDateString()} | {school?.name || 'School Name'} - Report Card</p>
      </div>
    </div>
  );
}