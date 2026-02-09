import { useEffect, useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";

export default function Result() {
    const [grades, setGrades] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [filteredSubjects, setFilteredSubjects] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [students, setStudents] = useState([]);
    const [results, setResults] = useState([]);
    const [existingResults, setExistingResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saveLoading, setSaveLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(false);
    const [filters, setFilters] = useState({
        grade_id: '',
        subject_id: '',
        school_session_id: '',
        term: ''
    });

    const terms = ['First Term', 'Second Term', 'Third Term'];

    // Get school_id from localStorage
    const getSchoolId = () => {
        try {
            const userData = localStorage.getItem('user');
            if (userData) {
                const user = JSON.parse(userData);
                return user?.school?.id || user?.school_id;
            }
        } catch (error) {
            console.error("Error getting school ID:", error);
        }
        return null;
    };

    // Helper function to extract array data from API responses
    const extractArrayData = (response) => {
        if (!response || !response.data) return [];
        
        const data = response.data;
        
        if (data?.status === 'success') {
            if (Array.isArray(data.data)) return data.data;
            if (data.data && Array.isArray(data.data.data)) return data.data.data;
            if (data.data && Array.isArray(data.data.items)) return data.data.items;
            return [];
        }
        
        if (Array.isArray(data)) return data;
        if (data?.data && Array.isArray(data.data)) return data.data;
        if (data?.items && Array.isArray(data.items)) return data.items;
        if (data?.results && Array.isArray(data.results)) return data.results;
        
        return [];
    };

    const fetchAllData = async () => {
        setLoading(true);
        const schoolId = getSchoolId();
        
        if (!schoolId) {
            toast.error("No school ID found. Please login again.");
            setLoading(false);
            return;
        }

        try {
            const [gradesRes, subjectsRes, sessionsRes] = await Promise.all([
                api.get("/grades", { params: { school_id: schoolId } }),
                api.get("/subjects", { params: { school_id: schoolId } }),
                api.get("/school-sessions", { params: { school_id: schoolId } })
            ]);

            const gradesList = extractArrayData(gradesRes);
            const subjectsList = extractArrayData(subjectsRes);
            const sessionsList = extractArrayData(sessionsRes);

            setGrades(gradesList);
            setSubjects(subjectsList);
            setSessions(sessionsList);
            
            console.log("✅ Data loaded:", {
                grades: gradesList.length,
                subjects: subjectsList.length,
                sessions: sessionsList.length
            });

        } catch (err) {
            console.error("❌ Fetch data error:", err);
            toast.error("Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, []);

    useEffect(() => {
        if (filters.grade_id) {
            filterSubjectsByGrade(filters.grade_id);
        } else {
            setFilteredSubjects([]);
            setResults([]);
        }
    }, [filters.grade_id, subjects]);

    useEffect(() => {
        if (filters.grade_id && filters.subject_id && filters.school_session_id && filters.term) {
            fetchExistingResults();
            fetchStudents();
        } else {
            setResults([]);
            setExistingResults([]);
        }
    }, [filters.grade_id, filters.subject_id, filters.school_session_id, filters.term]);

    const filterSubjectsByGrade = (gradeId) => {
        const filtered = subjects.filter(subject => 
            !subject.grade_id || subject.grade_id == gradeId
        );
        setFilteredSubjects(filtered);
        setFilters(prev => ({ ...prev, subject_id: '' }));
    };

    const fetchStudents = async () => {
        const schoolId = getSchoolId();
        if (!schoolId) {
            toast.error("No school ID found");
            return;
        }

        try {
            const response = await api.get("/students", { 
                params: { 
                    grade_id: filters.grade_id,
                    school_session_id: filters.school_session_id,
                    school_id: schoolId
                }
            });
            
            const studentsData = extractArrayData(response);
            
            const initialResults = studentsData.map(student => {
                const existingResult = existingResults.find(r => r.student_id === student.id);
                
                return {
                    student_id: student.id,
                    roll_number: student.roll_number || student.roll_no || `00${student.id}`.slice(-3),
                    name: student.name || `${student.first_name || ''} ${student.last_name || ''}`.trim(),
                    score: existingResult?.score || '',
                    score2: existingResult?.score2 || '',
                    total: existingResult?.total || 0,
                    existing_id: existingResult?.id || null
                };
            });
            
            setResults(initialResults);
        } catch (err) {
            console.error("❌ Fetch students error:", err);
            toast.error("Failed to load students");
            setResults([]);
        }
    };

    const fetchExistingResults = async () => {
        setFetchLoading(true);
        const schoolId = getSchoolId();
        
        if (!schoolId) {
            toast.error("No school ID found");
            setFetchLoading(false);
            return;
        }

        try {
            const response = await api.get("/results", {
                params: {
                    grade_id: filters.grade_id,
                    subject_id: filters.subject_id,
                    school_session_id: filters.school_session_id,
                    term: filters.term,
                    school_id: schoolId
                }
            });
            
            const resultsData = extractArrayData(response);
            setExistingResults(resultsData);
        } catch (err) {
            console.error("❌ Fetch existing results error:", err);
            setExistingResults([]);
        } finally {
            setFetchLoading(false);
        }
    };

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    };

    const handleScoreChange = (index, field, value) => {
        const updatedResults = [...results];
        updatedResults[index][field] = value;
        
        if (field === 'score' || field === 'score2') {
            const testScore = parseFloat(updatedResults[index].score) || 0;
            const examScore = parseFloat(updatedResults[index].score2) || 0;
            updatedResults[index].total = testScore + examScore;
        }
        
        setResults(updatedResults);
    };

    const handleDeleteRow = (index) => {
        const updatedResults = results.filter((_, i) => i !== index);
        setResults(updatedResults);
    };

    const handleSave = async () => {
        if (!filters.grade_id || !filters.subject_id || !filters.school_session_id || !filters.term) {
            toast.error("Please select all required filters (Class, Subject, Session, Term)");
            return;
        }

        const schoolId = getSchoolId();
        if (!schoolId) {
            toast.error("No school ID found. Please login again.");
            return;
        }

        const resultsToSave = results
            .filter(result => result.score !== '' && result.score2 !== '')
            .map(result => ({
                student_id: result.student_id,
                score: parseFloat(result.score),
                score2: parseFloat(result.score2),
                total: result.total
            }));

        if (resultsToSave.length === 0) {
            toast.error("Please enter scores for at least one student");
            return;
        }

        setSaveLoading(true);
        try {
            const payload = {
                grade_id: parseInt(filters.grade_id),
                subject_id: parseInt(filters.subject_id),
                school_session_id: parseInt(filters.school_session_id),
                term: filters.term,
                results: resultsToSave,
                school_id: schoolId  // Added school_id
            };

            console.log("📤 Sending payload:", payload);

            await api.post("/results", payload);
            toast.success("Results saved successfully!");
            await fetchExistingResults();
        } catch (err) {
            console.error("❌ Save results error:", err.response?.data || err);
            
            if (err.response?.data?.errors) {
                const errors = err.response.data.errors;
                Object.keys(errors).forEach(field => {
                    errors[field].forEach(message => toast.error(`${field}: ${message}`));
                });
            } else if (err.response?.data?.message) {
                toast.error(err.response.data.message);
            } else {
                toast.error("Failed to save results");
            }
        } finally {
            setSaveLoading(false);
        }
    };

    const handleLoadForEdit = async () => {
        if (!filters.grade_id || !filters.subject_id || !filters.school_session_id || !filters.term) {
            toast.error("Please select all filters first");
            return;
        }
        try {
            await fetchExistingResults();
            toast.success("Results loaded for editing!");
        } catch (err) {
            console.error("❌ Load for edit error:", err);
            toast.error("Failed to load results for editing");
        }
    };

    const handleLockResults = async () => {
        if (!filters.grade_id || !filters.school_session_id || !filters.term) {
            toast.error("Please select Class, Session, and Term first");
            return;
        }

        const schoolId = getSchoolId();
        if (!schoolId) {
            toast.error("No school ID found");
            return;
        }

        try {
            await api.post("/result-lock/lock", {
                grade_id: parseInt(filters.grade_id),
                school_session_id: parseInt(filters.school_session_id),
                term: filters.term,
                school_id: schoolId  // Added school_id
            });
            toast.success("Results locked successfully!");
        } catch (err) {
            console.error("❌ Lock results error:", err);
            toast.error("Failed to lock results");
        }
    };

    const handleUnlockResults = async () => {
        if (!filters.grade_id || !filters.school_session_id || !filters.term) {
            toast.error("Please select Class, Session, and Term first");
            return;
        }

        const schoolId = getSchoolId();
        if (!schoolId) {
            toast.error("No school ID found");
            return;
        }

        try {
            await api.post("/result-lock/unlock", {
                grade_id: parseInt(filters.grade_id),
                school_session_id: parseInt(filters.school_session_id),
                term: filters.term,
                school_id: schoolId  // Added school_id
            });
            toast.success("Results unlocked successfully!");
        } catch (err) {
            console.error("❌ Unlock results error:", err);
            toast.error("Failed to unlock results");
        }
    };

    const getGradeName = (grade) => {
        return grade?.name || grade?.grade_name || 'N/A';
    };

    const getSubjectName = (subject) => {
        return subject?.name || subject?.subject_name || 'N/A';
    };

    const getSessionName = (session) => {
        return session?.name || session?.session_name || 'N/A';
    };

    // Safe array variables
    const gradesArray = Array.isArray(grades) ? grades : [];
    const filteredSubjectsArray = Array.isArray(filteredSubjects) ? filteredSubjects : [];
    const sessionsArray = Array.isArray(sessions) ? sessions : [];
    const resultsArray = Array.isArray(results) ? results : [];

    return (
        <div className="text-white p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Result Entry Grid</h2>
                <div className="text-sm text-gray-400">
                    {gradesArray.length} Classes • {subjects.length} Subjects • {sessionsArray.length} Sessions
                </div>
            </div>

            {/* Debug Info */}
            <div className="mb-4 p-3 bg-slate-800 rounded text-sm">
                <div className="text-gray-300">
                    <strong>School ID:</strong> {getSchoolId() || "Not found"}
                </div>
            </div>

            {/* Filters Section */}
            <div className="bg-slate-800 p-6 rounded-lg shadow-md mb-6 border border-slate-700">
                <h3 className="text-lg font-semibold mb-4">Select Filters</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Class Dropdown */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                            Class <span className="text-red-400">*</span>
                        </label>
                        <select
                            value={filters.grade_id}
                            onChange={(e) => handleFilterChange('grade_id', e.target.value)}
                            className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                            disabled={loading}
                        >
                            <option value="">Select Class</option>
                            {gradesArray.map(grade => (
                                <option key={grade.id} value={grade.id}>
                                    {getGradeName(grade)}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Subject Dropdown */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                            Subject <span className="text-red-400">*</span>
                        </label>
                        <select
                            value={filters.subject_id}
                            onChange={(e) => handleFilterChange('subject_id', e.target.value)}
                            className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                            disabled={!filters.grade_id || loading}
                        >
                            <option value="">Select Subject</option>
                            {filteredSubjectsArray.map(subject => (
                                <option key={subject.id} value={subject.id}>
                                    {getSubjectName(subject)}
                                </option>
                            ))}
                        </select>
                        {!filters.grade_id && (
                            <p className="text-xs text-gray-400 mt-1">Select a class first</p>
                        )}
                    </div>

                    {/* Session Dropdown */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                            Session <span className="text-red-400">*</span>
                        </label>
                        <select
                            value={filters.school_session_id}
                            onChange={(e) => handleFilterChange('school_session_id', e.target.value)}
                            className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                            disabled={loading}
                        >
                            <option value="">Select Session</option>
                            {sessionsArray.map(session => (
                                <option key={session.id} value={session.id}>
                                    {getSessionName(session)}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Term Dropdown */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                            Term <span className="text-red-400">*</span>
                        </label>
                        <select
                            value={filters.term}
                            onChange={(e) => handleFilterChange('term', e.target.value)}
                            className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                        >
                            <option value="">Select Term</option>
                            {terms.map(term => (
                                <option key={term} value={term}>
                                    {term}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-700">
                    <div className="space-x-3">
                        <button
                            onClick={handleLockResults}
                            disabled={!filters.grade_id || !filters.school_session_id || !filters.term}
                            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:bg-red-800 disabled:opacity-50 transition-colors font-medium"
                        >
                            Lock Results
                        </button>
                        <button
                            onClick={handleUnlockResults}
                            disabled={!filters.grade_id || !filters.school_session_id || !filters.term}
                            className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 disabled:bg-orange-800 disabled:opacity-50 transition-colors font-medium"
                        >
                            Unlock Results
                        </button>
                    </div>
                    <div className="space-x-3">
                        <button
                            onClick={handleLoadForEdit}
                            disabled={!filters.grade_id || !filters.subject_id || !filters.school_session_id || !filters.term || fetchLoading}
                            className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 disabled:bg-yellow-800 disabled:opacity-50 transition-colors font-medium"
                        >
                            {fetchLoading ? "Loading..." : "Load for Edit"}
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saveLoading || resultsArray.length === 0}
                            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:bg-green-800 disabled:opacity-50 transition-colors font-medium"
                        >
                            {saveLoading ? "Saving..." : "Save Results"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Results Table */}
            <div className="bg-slate-800 rounded-lg shadow-md overflow-hidden border border-slate-700">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead className="bg-slate-700">
                            <tr>
                                <th className="border border-slate-600 py-3 px-4 font-bold text-left">Roll Number</th>
                                <th className="border border-slate-600 py-3 px-4 font-bold text-left">Name</th>
                                <th className="border border-slate-600 py-3 px-4 font-bold text-left">Score (Test)</th>
                                <th className="border border-slate-600 py-3 px-4 font-bold text-left">Score (Exam)</th>
                                <th className="border border-slate-600 py-3 px-4 font-bold text-left">Total (Auto sum)</th>
                                <th className="border border-slate-600 py-3 px-4 font-bold text-left">Status</th>
                                <th className="border border-slate-600 py-3 px-4 font-bold text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="border border-slate-600 py-8 px-4 text-center text-gray-400">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
                                        Loading data...
                                    </td>
                                </tr>
                            ) : resultsArray.length > 0 ? (
                                resultsArray.map((result, index) => (
                                    <tr key={result.student_id} className="border-b border-slate-700 hover:bg-slate-700/40 transition-colors">
                                        <td className="border border-slate-600 py-3 px-4 font-mono">{result.roll_number}</td>
                                        <td className="border border-slate-600 py-3 px-4">{result.name}</td>
                                        <td className="border border-slate-600 py-3 px-4">
                                            <input
                                                type="number"
                                                min="0"
                                                max="40"
                                                value={result.score}
                                                onChange={(e) => handleScoreChange(index, 'score', e.target.value)}
                                                className="w-20 p-1 bg-slate-600 border border-slate-500 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-center text-white"
                                                placeholder="0-40"
                                            />
                                        </td>
                                        <td className="border border-slate-600 py-3 px-4">
                                            <input
                                                type="number"
                                                min="0"
                                                max="60"
                                                value={result.score2}
                                                onChange={(e) => handleScoreChange(index, 'score2', e.target.value)}
                                                className="w-20 p-1 bg-slate-600 border border-slate-500 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-center text-white"
                                                placeholder="0-60"
                                            />
                                        </td>
                                        <td className="border border-slate-600 py-3 px-4 font-bold text-center">{result.total}</td>
                                        <td className="border border-slate-600 py-3 px-4">
                                            <span className={`px-2 py-1 rounded-full text-xs ${
                                                result.existing_id 
                                                    ? 'bg-green-500/20 text-green-300' 
                                                    : 'bg-gray-500/20 text-gray-300'
                                            }`}>
                                                {result.existing_id ? 'Saved' : 'New'}
                                            </span>
                                        </td>
                                        <td className="border border-slate-600 py-3 px-4">
                                            <button
                                                onClick={() => handleDeleteRow(index)}
                                                className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm transition-colors"
                                            >
                                                Delete Row
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="border border-slate-600 py-8 px-4 text-center text-gray-400">
                                        {filters.grade_id && filters.school_session_id 
                                            ? "No students found for the selected class and session." 
                                            : "Please select Class and Session to load students."}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}