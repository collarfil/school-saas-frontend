// src/pages/PublicAdmission.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { publicApi } from "../api/axios";
import {
  User, BookOpen, Shield, GraduationCap, ChevronRight, ChevronLeft,
  CheckCircle, AlertCircle, RefreshCw, X, Search, School as SchoolIcon,
  MapPin, ArrowRight,
} from "lucide-react";

export default function PublicAdmission() {
  const navigate = useNavigate();

  // 0 = select school, 1 = personal, 2 = academic, 3 = guardian, 4 = success
  const [step, setStep] = useState(0);

  // School selection
  const [search, setSearch] = useState("");
  const [schools, setSchools] = useState([]);
  const [searchingSchools, setSearchingSchools] = useState(false);
  const [school, setSchool] = useState(null);
  const [grades, setGrades] = useState([]);
  const [sessions, setSessions] = useState([]);

  // Form
  const [formData, setFormData] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    gender: "male",
    date_of_birth: "",
    phone: "",
    email: "",
    address: "",
    grade_id: "",
    school_session_id: "",
    term: "", // FIXED: Added term to state
    prev_grade: "",
    prev_school: "",
    guardian_name: "",
    guardian_relationship: "Father",
    guardian_phone: "",
    guardian_email: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [applicationNumber, setApplicationNumber] = useState("");
  const [alert, setAlert] = useState({ show: false, type: "", message: "" });

  const showAlert = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: "", message: "" }), 4000);
  };

  // Load schools when on step 0
  useEffect(() => {
    if (step !== 0) return;
    const fetchSchools = async () => {
      setSearchingSchools(true);
      try {
        const res = await publicApi.get("/public/schools/search", {
          params: search ? { query: search } : {},
        });
        setSchools(res.data?.data || []);
      } catch (err) {
        console.error("Failed to load schools:", err);
        setSchools([]);
      } finally {
        setSearchingSchools(false);
      }
    };
    const t = setTimeout(fetchSchools, 300);
    return () => clearTimeout(t);
  }, [search, step]);

  // Select a school → fetch grades + sessions using school_uuid or school_id
  const handleSelectSchool = async (s) => {
    try {
      const res = await publicApi.get(`/public/schools/${s.uuid}`);
      const schoolData = res.data.data;
      setSchool(schoolData);

      // FIXED: Pass school_uuid to guarantee resolution regardless of ID structure
      const [gradesRes, sessionsRes] = await Promise.all([
        publicApi.get("/public/grades", {
          params: { school_uuid: schoolData.uuid, school_id: schoolData.id },
        }),
        publicApi.get("/public/school-sessions", {
          params: { school_uuid: schoolData.uuid, school_id: schoolData.id },
        }),
      ]);

      setGrades(gradesRes.data?.data || []);
      setSessions(sessionsRes.data?.data || []);

      setStep(1);
    } catch (err) {
      console.error("Failed to load school details:", err);
      toast.error("Failed to load school details");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // FIXED: Auto-populate term when selecting a school session
    if (name === "school_session_id") {
      const selectedSession = sessions.find((s) => String(s.id) === String(value));
      setFormData((prev) => ({
        ...prev,
        school_session_id: value,
        term: selectedSession ? selectedSession.term : "",
      }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateStep = (s) => {
    if (s === 1) {
      if (!formData.first_name || !formData.last_name || !formData.phone) {
        toast.error("Please fill in First Name, Last Name, and Phone.");
        return false;
      }
    }
    if (s === 2) {
      if (!formData.grade_id) {
        toast.error("Please select a Target Grade.");
        return false;
      }
      if (!formData.school_session_id) {
        toast.error("Please select an Academic Session.");
        return false;
      }
    }
    if (s === 3) {
      if (!formData.guardian_name || !formData.guardian_phone) {
        toast.error("Please provide guardian name and phone.");
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(step)) setStep((p) => Math.min(p + 1, 3));
  };
  const prevStep = () => setStep((p) => Math.max(p - 1, 0));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step !== 3) return;
    if (!school) {
      toast.error("Please select a school.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        school_uuid: school.uuid,
        first_name: formData.first_name.trim(),
        middle_name: formData.middle_name.trim() || null,
        last_name: formData.last_name.trim(),
        gender: formData.gender,
        date_of_birth: formData.date_of_birth || null,
        phone: formData.phone.trim(),
        email: formData.email.trim() || null,
        address: formData.address.trim() || null,
        grade_id: formData.grade_id,
        school_session_id: formData.school_session_id || null,
        term: formData.term || null, // FIXED: Sent term in payload
        prev_grade: formData.prev_grade.trim() || null,
        prev_school: formData.prev_school.trim() || null,
        guardian_name: formData.guardian_name.trim(),
        guardian_relationship: formData.guardian_relationship,
        guardian_phone: formData.guardian_phone.trim(),
        guardian_email: formData.guardian_email.trim() || null,
      };

      const res = await publicApi.post("/public/admissions/apply", payload);

      if (res.data?.status === "success") {
        setApplicationNumber(res.data.data?.application_number || "");
        setStep(4);
      } else {
        showAlert("error", res.data?.message || "Submission failed");
      }
    } catch (err) {
      console.error("Submission error:", err);
      const errors = err.response?.data?.errors;
      if (errors) {
        Object.values(errors).flat().forEach((m) => toast.error(m));
      } else {
        showAlert("error", err.response?.data?.message || "Submission failed");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============ STEP 0: SELECT SCHOOL ============
  if (step === 0) {
    return (
      <div className="min-h-screen w-full bg-slate-900 text-white py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 px-4 py-1.5 rounded-full text-sm mb-4">
              <GraduationCap className="w-4 h-4" />
              Admission Portal
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
              Apply for <span className="text-indigo-400">Admission</span>
            </h1>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Search and select the school you want to apply to, then complete the application form.
            </p>
          </div>

          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search schools by name or location..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-12 pr-4 py-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {searchingSchools ? (
            <div className="flex justify-center py-16">
              <RefreshCw className="w-8 h-8 animate-spin text-indigo-400" />
            </div>
          ) : schools.length === 0 ? (
            <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-12 text-center">
              <SchoolIcon className="w-12 h-12 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-400">
                {search ? "No schools match your search." : "No schools available yet."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {schools.map((s) => (
                <button
                  key={s.uuid}
                  onClick={() => handleSelectSchool(s)}
                  className="text-left bg-slate-800/60 border border-slate-700 hover:border-indigo-500/60 rounded-2xl p-5 transition group"
                >
                  <div className="flex items-start gap-4">
                    {s.logo ? (
                      <img src={s.logo} alt={s.name} className="w-14 h-14 rounded-xl object-cover bg-slate-700" />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                        <SchoolIcon className="w-7 h-7 text-white" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white text-lg truncate">{s.name}</h3>
                      {s.address && (
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{s.address}</span>
                        </p>
                      )}
                      <span className="inline-flex items-center gap-1 text-indigo-400 text-xs font-medium mt-3 group-hover:gap-2 transition-all">
                        Select <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ============ STEP 4: SUCCESS ============
  if (step === 4) {
    return (
      <div className="min-h-screen w-full bg-slate-900 text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-800/60 border border-slate-700 rounded-2xl p-8 text-center">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Application Submitted!</h2>
          <p className="text-gray-400 mb-4">
            Your application to <span className="text-white font-medium">{school?.name}</span> has been received.
          </p>
          {applicationNumber && (
            <div className="bg-slate-700/50 p-4 rounded-lg mb-4">
              <p className="text-xs text-gray-400">Application Number</p>
              <p className="text-xl font-mono text-indigo-400">{applicationNumber}</p>
            </div>
          )}
          <p className="text-sm text-gray-400 mb-6">
            Save this number to check your application status later.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => navigate("/admission/status")}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium transition"
            >
              Check Application Status
            </button>
            <button
              onClick={() => navigate("/")}
              className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium transition"
            >
              Return Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============ STEPS 1–3: FORM ============
  return (
    <div className="min-h-screen w-full bg-slate-900 text-white py-12 px-6">
      <div className="max-w-3xl mx-auto">
        {/* Selected school banner */}
        <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-2xl p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {school.logo ? (
              <img src={school.logo} alt={school.name} className="w-12 h-12 rounded-lg object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-indigo-500 flex items-center justify-center">
                <SchoolIcon className="w-6 h-6 text-white" />
              </div>
            )}
            <div>
              <p className="text-xs text-gray-400">Applying to</p>
              <p className="font-bold text-white">{school.name}</p>
            </div>
          </div>
          <button
            onClick={() => setStep(0)}
            className="text-sm text-indigo-300 hover:text-white underline"
          >
            Change school
          </button>
        </div>

        {alert.show && (
          <div className={`mb-4 p-4 rounded-lg flex items-center justify-between text-sm ${
            alert.type === "success"
              ? "bg-green-900/30 text-green-300 border border-green-700"
              : "bg-red-900/30 text-red-300 border border-red-700"
          }`}>
            <div className="flex items-center gap-2">
              {alert.type === "success" ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <span>{alert.message}</span>
            </div>
            <button onClick={() => setAlert({ show: false })}>
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Progress */}
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 grid grid-cols-3 gap-2 text-xs">
            {[
              { n: 1, label: "Personal", icon: <User className="w-4 h-4" /> },
              { n: 2, label: "Academic", icon: <BookOpen className="w-4 h-4" /> },
              { n: 3, label: "Guardian", icon: <Shield className="w-4 h-4" /> },
            ].map((s) => (
              <div
                key={s.n}
                className={`flex items-center gap-2 pb-1 border-b-2 ${
                  step >= s.n ? "border-indigo-500 text-indigo-300 font-medium" : "border-slate-700 text-gray-500"
                }`}
              >
                {s.icon}
                <span>{s.n}. {s.label}</span>
              </div>
            ))}
          </div>

          {/* STEP 1: PERSONAL */}
          {step === 1 && (
            <Section title="Student Information" icon={<User className="w-5 h-5" />}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input label="First Name *" name="first_name" value={formData.first_name} onChange={handleInputChange} required />
                <Input label="Middle Name" name="middle_name" value={formData.middle_name} onChange={handleInputChange} />
                <Input label="Last Name *" name="last_name" value={formData.last_name} onChange={handleInputChange} required />
                <Select
                  label="Gender *"
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  options={[
                    { value: "male", label: "Male" },
                    { value: "female", label: "Female" },
                    { value: "other", label: "Other" },
                  ]}
                />
                <Input label="Date of Birth" type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleInputChange} />
                <Input label="Phone *" name="phone" value={formData.phone} onChange={handleInputChange} required />
                <div className="md:col-span-3">
                  <Input label="Email" type="email" name="email" value={formData.email} onChange={handleInputChange} />
                </div>
                <div className="md:col-span-3">
                  <Textarea label="Residential Address" name="address" value={formData.address} onChange={handleInputChange} />
                </div>
              </div>
            </Section>
          )}

          {/* STEP 2: ACADEMIC */}
          {step === 2 && (
            <Section title="Academic Placement" icon={<BookOpen className="w-5 h-5" />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Target Grade *"
                  name="grade_id"
                  value={formData.grade_id}
                  onChange={handleInputChange}
                  required
                  options={[
                    { value: "", label: "Select Grade" },
                    ...grades.map((g) => ({ value: g.id, label: g.name })),
                  ]}
                />

                <Select
                  label="Academic Session & Term *"
                  name="school_session_id"
                  value={formData.school_session_id}
                  onChange={handleInputChange}
                  required
                  options={[
                    { value: "", label: "Select Session" },
                    ...sessions.map((s) => ({
                      value: s.id,
                      label: `${s.name} — ${s.term}${s.is_current ? " (Current)" : ""}`,
                    })),
                  ]}
                />

                <Input
                  label="Term"
                  name="term"
                  value={formData.term}
                  onChange={handleInputChange}
                  placeholder="Auto-populated from session or enter term"
                />

                <Input
                  label="Previous Grade"
                  name="prev_grade"
                  value={formData.prev_grade}
                  onChange={handleInputChange}
                  placeholder="e.g. Primary 5"
                />

                <div className="md:col-span-2">
                  <Input
                    label="Previous School"
                    name="prev_school"
                    value={formData.prev_school}
                    onChange={handleInputChange}
                    placeholder="Name of former school"
                  />
                </div>
              </div>
            </Section>
          )}

          {/* STEP 3: GUARDIAN */}
          {step === 3 && (
            <Section title="Guardian Information" icon={<Shield className="w-5 h-5" />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Guardian Full Name *" name="guardian_name" value={formData.guardian_name} onChange={handleInputChange} required />
                <Select
                  label="Relationship *"
                  name="guardian_relationship"
                  value={formData.guardian_relationship}
                  onChange={handleInputChange}
                  options={[
                    { value: "Father", label: "Father" },
                    { value: "Mother", label: "Mother" },
                    { value: "Guardian", label: "Guardian" },
                    { value: "Other", label: "Other" },
                  ]}
                />
                <Input label="Guardian Phone *" name="guardian_phone" value={formData.guardian_phone} onChange={handleInputChange} required />
                <Input label="Guardian Email" type="email" name="guardian_email" value={formData.guardian_email} onChange={handleInputChange} />
              </div>
            </Section>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-700">
            {step > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                className="px-4 py-2 text-sm bg-slate-700 hover:bg-slate-600 rounded-lg transition flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            ) : <div />}

            {step < 3 ? (
              <button
                type="button"
                onClick={nextStep}
                className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 rounded-lg transition flex items-center gap-2"
              >
                Next Step <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 text-sm bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-lg font-medium transition flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Submitting...
                  </>
                ) : (
                  <>Submit Application</>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

// ------- Reusable components -------
function Section({ title, icon, children }) {
  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4 text-indigo-400">
        {icon}
        <h2 className="text-lg font-bold text-white">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Input({ label, ...props }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-300 mb-1.5">{label}</label>
      <input
        {...props}
        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </div>
  );
}

function Select({ label, options, ...props }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-300 mb-1.5">{label}</label>
      <select
        {...props}
        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

function Textarea({ label, ...props }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-300 mb-1.5">{label}</label>
      <textarea
        {...props}
        rows={3}
        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
      />
    </div>
  );
}