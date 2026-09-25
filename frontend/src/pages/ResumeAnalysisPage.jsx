import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Target,
  Layers,
  Code2,
  Copy,
  Check,
  RefreshCw,
  FolderGit2,
  HelpCircle,
  Clock,
  Printer,
  ShieldCheck,
  Award,
  Zap,
  BarChart3,
  Search,
  BookOpen,
  MessageSquare,
  FileCode,
  ExternalLink,
  Info,
  Flame,
  CheckCheck,
  XCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import GlassCard from "../components/GlassCard";
import PrimaryButton from "../components/PrimaryButton";
import ProgressBar from "../components/ProgressBar";
import Skeleton from "../components/Skeleton";
import { useToast } from "../context/ToastContext";

// Predefined target roles with industry-aligned focus
const PRESET_ROLES = [
  {
    id: "web-dev",
    name: "Web Development",
    title: "Web Development / Full Stack",
    icon: Code2,
    badge: "Most Popular",
    skills: ["React", "Node.js", "Express", "MongoDB", "REST APIs", "Tailwind CSS"],
    description: "Evaluates modern frontend, backend, APIs, database integration, and deployment.",
  },
  {
    id: "frontend",
    name: "Frontend Developer",
    title: "Frontend Developer",
    icon: Layers,
    badge: "High Demand",
    skills: ["React / Next.js", "TypeScript", "Tailwind CSS", "Redux/Zustand", "Performance"],
    description: "Benchmarks component architecture, state management, responsiveness, and web vitals.",
  },
  {
    id: "backend",
    name: "Backend Developer",
    title: "Backend Developer",
    icon: Target,
    badge: "Core Tech",
    skills: ["Node.js / Python / Java", "PostgreSQL / MongoDB", "Microservices", "Redis", "Security"],
    description: "Analyzes API scalability, database schema design, caching, auth, and system design.",
  },
  {
    id: "sde",
    name: "Software Development Engineer (SDE)",
    title: "Software Development Engineer (SDE)",
    icon: Award,
    badge: "Campus Favorite",
    skills: ["DSA", "OOP", "System Design", "Java / C++ / Python", "SQL", "Git"],
    description: "Focuses on computer science fundamentals, algorithmic problem solving, and architecture.",
  },
  {
    id: "aiml",
    name: "AI / Machine Learning Engineer",
    title: "AI / Machine Learning Engineer",
    icon: Sparkles,
    badge: "Emerging Tech",
    skills: ["Python", "PyTorch / TensorFlow", "Pandas", "Scikit-Learn", "LLMs / RAG"],
    description: "Evaluates machine learning pipelines, deep learning, prompt engineering, and MLOps.",
  },
  {
    id: "devops",
    name: "DevOps & Cloud Engineer",
    title: "DevOps & Cloud Engineer",
    icon: Zap,
    badge: "High Salary",
    skills: ["Docker", "Kubernetes", "AWS / GCP", "CI/CD", "Terraform", "Linux"],
    description: "Benchmarks containerization, cloud infrastructure, automated pipelines, and monitoring.",
  },
  {
    id: "mobile",
    name: "Mobile App Developer",
    title: "Mobile App Developer",
    icon: FolderGit2,
    badge: "App Stores",
    skills: ["React Native", "Flutter", "Mobile UI", "Offline Sync", "APIs"],
    description: "Checks mobile responsiveness, native device APIs, state management, and app lifecycles.",
  },
];

const ANALYSIS_STEPS = [
  "Parsing PDF layout, typography & structural sections...",
  "Running ATS parser & forensic keyword density scanner...",
  "Analyzing action verbs, passive phrasing & metric quantification...",
  "Benchmarking against industry standards for selected role...",
  "Synthesizing 5-pillar scores, STAR rewrites, and 90-day mastery roadmap...",
];

const ResumeAnalysisPage = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  // Selection states
  const [selectedRole, setSelectedRole] = useState(PRESET_ROLES[0].name);
  const [customRole, setCustomRole] = useState("");
  const [isCustom, setIsCustom] = useState(false);

  // File upload states
  const [resumeFile, setResumeFile] = useState(null);
  const [useExisting, setUseExisting] = useState(false);
  const [hasExistingResume, setHasExistingResume] = useState(false);
  const [existingSkills, setExistingSkills] = useState([]);

  // Analysis result & loading states
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState("scorecard"); 

  // History & Drawer states
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [copiedType, setCopiedType] = useState(null);

  const fileInputRef = useRef(null);

  // Fetch initial latest analysis and user resume status
  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const res = await api.get("/api/resume/latest");
        if (res.data?.data?.hasResume) {
          setHasExistingResume(true);
          setExistingSkills(res.data.data.resumeSkills || []);
        }
        if (res.data?.data?.analysis) {
          setResult(res.data.data.analysis);
          setSelectedRole(res.data.data.analysis.role || PRESET_ROLES[0].name);
        }
      } catch {
        // Quietly fail or user is fresh
      } finally {
        setLoadingInitial(false);
      }
    };

    const fetchHistory = async () => {
      try {
        const res = await api.get("/api/resume/history");
        setHistory(res.data?.data || []);
      } catch {
        // Ignore
      }
    };

    fetchLatest();
    fetchHistory();
  }, []);

  // Step cycling timer during analysis
  useEffect(() => {
    let interval;
    if (analyzing) {
      setAnalysisStep(0);
      interval = setInterval(() => {
        setAnalysisStep((prev) => (prev < ANALYSIS_STEPS.length - 1 ? prev + 1 : prev));
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [analyzing]);

  const effectiveRole = isCustom ? customRole.trim() || "Software Developer" : selectedRole;

  // File drop handler
  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type === "application/pdf") {
      setResumeFile(file);
      setUseExisting(false);
    } else {
      addToast("Please upload a PDF document", "error");
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === "application/pdf") {
      setResumeFile(file);
      setUseExisting(false);
    } else if (file) {
      addToast("Only PDF files are supported", "error");
    }
  };

  // Submit Analysis Request
  const handleAnalyze = async () => {
    if (!useExisting && !resumeFile) {
      addToast("Please upload your PDF resume first", "error");
      return;
    }

    if (isCustom && !customRole.trim()) {
      addToast("Please type your custom target role", "error");
      return;
    }

    setAnalyzing(true);

    try {
      let res;
      if (useExisting) {
        res = await api.post("/api/resume/reanalyze", {
          role: effectiveRole,
        });
      } else {
        const formData = new FormData();
        formData.append("resume", resumeFile);
        formData.append("role", effectiveRole);

        res = await api.post("/api/resume/analyze", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setHasExistingResume(true);
      }

      setResult(res.data?.data);
      addToast(`In-Depth analysis complete for ${effectiveRole}!`, "success");

      api.get("/api/resume/history").then((hRes) => setHistory(hRes.data?.data || []));

      setTimeout(() => {
        window.scrollTo({ top: 480, behavior: "smooth" });
      }, 100);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to analyze resume. Please try again.";
      addToast(msg, "error");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSelectHistoryItem = async (id) => {
    try {
      const res = await api.get(`/api/resume/${id}`);
      setResult(res.data?.data);
      setSelectedRole(res.data?.data?.role || PRESET_ROLES[0].name);
      setShowHistory(false);
      addToast(`Loaded analysis for ${res.data?.data?.role}`, "info");
      window.scrollTo({ top: 480, behavior: "smooth" });
    } catch {
      addToast("Failed to load historical analysis", "error");
    }
  };

  const handleCopyText = (text, type, index = null) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setCopiedIndex(index);
    addToast("Copied to clipboard!", "success");
    setTimeout(() => {
      setCopiedType(null);
      setCopiedIndex(null);
    }, 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* ─── Hero Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-400/30 text-indigo-300 text-xs font-medium mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            In-Depth Forensic Resume Analyzer & ATS Role Matcher
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-50">
            Comprehensive Resume Audit & Role Matching
          </h1>
          <p className="text-sm text-slate-400 max-w-3xl mt-1 leading-relaxed">
            Get an exhaustive recruiter & ATS diagnostics report: 5-pillar scoring, keyword heatmaps, section-by-section audit, passive verb detection, metric quantification rates, STAR bullet rewrites, tailored portfolio projects, and a 90-day role mastery roadmap.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {history.length > 0 && (
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 transition"
            >
              <Clock className="h-3.5 w-3.5 text-indigo-400" />
              History ({history.length})
            </button>
          )}

          {result && (
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 transition"
            >
              <Printer className="h-3.5 w-3.5" />
              Print / Save PDF Report
            </button>
          )}
        </div>
      </div>

      {/* ─── History Drawer ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <GlassCard className="p-4 border-indigo-500/30">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                  Past Role Diagnostic Reports
                </span>
                <button
                  onClick={() => setShowHistory(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Close
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {history.map((h) => (
                  <button
                    key={h._id}
                    onClick={() => handleSelectHistoryItem(h._id)}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition text-xs group"
                  >
                    <div>
                      <div className="font-semibold text-slate-100 group-hover:text-indigo-300">
                        {h.role}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {new Date(h.createdAt).toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-emerald-400">
                        {h.overall_score || h.role_match_score}%
                      </span>
                      <div className="text-[10px] text-slate-400">Score</div>
                    </div>
                  </button>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Role Selection & Upload Section ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Role Selection Grid (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs uppercase tracking-wider text-slate-300 font-semibold flex items-center gap-2">
              <Target className="h-4 w-4 text-indigo-400" />
              1. Select Target Job Role
            </label>
            <span className="text-xs text-slate-400">
              Role: <strong className="text-indigo-300">{effectiveRole}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PRESET_ROLES.map((role) => {
              const Icon = role.icon;
              const isSelected = !isCustom && selectedRole === role.name;
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => {
                    setSelectedRole(role.name);
                    setIsCustom(false);
                  }}
                  className={`p-3.5 rounded-2xl text-left border transition-all duration-200 transform hover:-translate-y-1 hover:scale-[1.015] hover:shadow-floating-hover hover:border-white/30 relative flex flex-col justify-between ${
                    isSelected
                      ? "bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-transparent border-indigo-400/60 shadow-soft"
                      : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`h-8 w-8 rounded-xl flex items-center justify-center ${
                          isSelected ? "bg-indigo-500 text-white" : "bg-white/10 text-slate-300"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="font-medium text-sm text-slate-100">{role.name}</div>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    )}
                  </div>

                  <p className="text-[11px] text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                    {role.description}
                  </p>

                  <div className="flex flex-wrap gap-1 mt-2.5">
                    {role.skills.slice(0, 3).map((sk) => (
                      <span
                        key={sk}
                        className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/5 text-slate-300 border border-white/5"
                      >
                        {sk}
                      </span>
                    ))}
                    {role.skills.length > 3 && (
                      <span className="text-[10px] px-1 py-0.5 text-slate-500">
                        +{role.skills.length - 3}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}

            {/* Custom Role Option */}
            <div
              className={`p-3.5 rounded-2xl border transition flex flex-col justify-between ${
                isCustom
                  ? "bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-transparent border-indigo-400/60 shadow-soft"
                  : "bg-white/5 border-white/10 hover:bg-white/10"
              }`}
            >
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setIsCustom(true)}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${isCustom ? "bg-indigo-500 text-white" : "bg-white/10 text-slate-300"}`}>
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-medium text-sm text-slate-100">Custom Target Role</div>
                    <div className="text-[11px] text-slate-400">Specify any specialized job title</div>
                  </div>
                </div>
                {isCustom && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
              </div>

              <div className="mt-3">
                <input
                  type="text"
                  placeholder="e.g. Data Analyst, Blockchain Dev, QA"
                  value={customRole}
                  onFocus={() => setIsCustom(true)}
                  onChange={(e) => {
                    setCustomRole(e.target.value);
                    setIsCustom(true);
                  }}
                  className="w-full text-xs px-3 py-2 rounded-xl bg-slate-950/60 border border-white/15 text-slate-200 outline-none focus:border-indigo-400 transition"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Resume Upload & Action (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <label className="text-xs uppercase tracking-wider text-slate-300 font-semibold flex items-center gap-2">
            <UploadCloud className="h-4 w-4 text-indigo-400" />
            2. Upload Candidate Resume (PDF)
          </label>

          <GlassCard className="p-5 flex flex-col justify-between h-[calc(100%-2rem)]">
            <div className="space-y-4">
              {hasExistingResume && (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-400/20 text-xs">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-indigo-300" />
                    <div>
                      <span className="font-medium text-indigo-200">
                        Profile Resume Available
                      </span>
                      {existingSkills.length > 0 && (
                        <div className="text-[10px] text-slate-400">
                          {existingSkills.length} skills indexed
                        </div>
                      )}
                    </div>
                  </div>
                  <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-indigo-300">
                    <input
                      type="checkbox"
                      checked={useExisting}
                      onChange={(e) => {
                        setUseExisting(e.target.checked);
                        if (e.target.checked) setResumeFile(null);
                      }}
                      className="rounded accent-indigo-500"
                    />
                    Use this resume
                  </label>
                </div>
              )}

              {!useExisting && (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition ${
                    resumeFile
                      ? "border-emerald-400/50 bg-emerald-500/5"
                      : "border-white/15 hover:border-indigo-400/40 hover:bg-white/5"
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {resumeFile ? (
                    <div className="space-y-2">
                      <div className="h-12 w-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center mx-auto text-emerald-300">
                        <FileText className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="font-medium text-xs text-slate-100 max-w-[200px] truncate mx-auto">
                          {resumeFile.name}
                        </div>
                        <div className="text-[10px] text-emerald-400 mt-0.5">
                          {(resumeFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for audit
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setResumeFile(null);
                        }}
                        className="text-[11px] text-rose-400 hover:underline pt-1"
                      >
                        Change file
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-slate-300">
                        <UploadCloud className="h-6 w-6 text-indigo-400" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-100">
                          Click to upload or drag & drop
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1">
                          Supported format: PDF (Max 8MB)
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-white/10 space-y-3">
              <PrimaryButton
                type="button"
                className="w-full gap-2 py-3"
                onClick={handleAnalyze}
                disabled={analyzing || (!resumeFile && !useExisting)}
              >
                {analyzing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Auditing for {effectiveRole}...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Run Deep Forensic Audit for {effectiveRole}</span>
                  </>
                )}
              </PrimaryButton>

              <p className="text-[11px] text-center text-slate-400">
                5-Pillar scoring • ATS Keyword Heatmap • STAR Rewrites • 90-Day Roadmap
              </p>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* ─── Loading Analysis Progress State ─────────────────────────────────── */}
      <AnimatePresence>
        {analyzing && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-6 rounded-3xl bg-gradient-to-r from-indigo-900/30 via-purple-900/20 to-slate-900/40 border border-indigo-500/30 backdrop-blur-xl shadow-glass"
          >
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="relative">
                <div className="h-16 w-16 rounded-full border-4 border-indigo-500/20 border-t-indigo-400 animate-spin" />
                <Sparkles className="h-6 w-6 text-indigo-300 absolute inset-0 m-auto" />
              </div>

              <div className="flex-1 text-center md:text-left space-y-2">
                <div className="text-sm font-semibold text-indigo-200">
                  Performing Forensic Audit for {effectiveRole}
                </div>
                <div className="text-xs text-slate-300 animate-pulse">
                  {ANALYSIS_STEPS[analysisStep]}
                </div>
                <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                    style={{ width: `${((analysisStep + 1) / ANALYSIS_STEPS.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Detailed Results Dashboard ───────────────────────────────────────── */}
      {loadingInitial ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      ) : result ? (
        <div className="space-y-6 pt-2">
          {/* Executive Recruiter Sentiment & 6-Second Scan Banner */}
          <GlassCard className="p-5 border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-slate-900/50">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1.5 max-w-3xl">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] uppercase tracking-wider px-2.5 py-0.5 rounded-full font-bold bg-indigo-500/20 border border-indigo-400/40 text-indigo-300">
                    6-Second Recruiter Screen
                  </span>
                  <span
                    className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold border ${
                      result.first_impression?.sentiment_badge === "Strong Hire Potential"
                        ? "bg-emerald-500/10 border-emerald-400/30 text-emerald-300"
                        : result.first_impression?.sentiment_badge === "Gaps to Address"
                        ? "bg-rose-500/10 border-rose-400/30 text-rose-300"
                        : "bg-indigo-500/10 border-indigo-400/30 text-indigo-300"
                    }`}
                  >
                    {result.first_impression?.sentiment_badge || "Interview Contender"}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Est. Reading Time: <strong>{result.first_impression?.estimated_reading_time || "45s"}</strong> ({result.first_impression?.word_count || 450} words)
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-100 leading-snug">
                  {result.first_impression?.verdict || result.summary}
                </h3>
                <div className="flex flex-col sm:flex-row gap-2 pt-1 text-xs text-slate-300">
                  {result.first_impression?.takeaways?.map((item, i) => (
                    <div key={i} className="flex items-start gap-1.5 bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/5">
                      <span className="text-indigo-400 font-bold">•</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Big Overall Composite Gauge */}
              <div className="flex items-center gap-4 border-t lg:border-t-0 lg:border-l border-white/10 pt-4 lg:pt-0 lg:pl-6 shrink-0">
                <div className="text-center">
                  <div className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">
                    Composite Score
                  </div>
                  <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-indigo-300 to-purple-300">
                    {result.overall_score}%
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {result.role_level}
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* 5-Pillar Score Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: "Role Relevance", score: result.multi_scores?.role_relevance ?? result.role_match_score, icon: Target, tone: "indigo" },
              { label: "ATS Formatting", score: result.multi_scores?.ats_formatting ?? result.ats_score, icon: ShieldCheck, tone: "emerald" },
              { label: "Impact & Metrics", score: result.multi_scores?.impact_quantification ?? 60, icon: BarChart3, tone: "blue" },
              { label: "Power Language", score: result.multi_scores?.power_language ?? 70, icon: Zap, tone: "purple" },
              { label: "Brevity & Layout", score: result.multi_scores?.brevity_structure ?? 80, icon: Layers, tone: "amber" },
            ].map((pillar, i) => {
              const Icon = pillar.icon;
              return (
                <GlassCard key={i} className="p-3.5 flex flex-col justify-between space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold truncate">
                      {pillar.label}
                    </span>
                    <Icon className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  </div>
                  <div className="text-2xl font-bold text-slate-100">
                    {pillar.score}%
                  </div>
                  <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        pillar.score >= 80
                          ? "bg-emerald-400"
                          : pillar.score >= 65
                          ? "bg-indigo-400"
                          : "bg-amber-400"
                      }`}
                      style={{ width: `${pillar.score}%` }}
                    />
                  </div>
                </GlassCard>
              );
            })}
          </div>

          {/* ─── Navigation Tabs for Deep Breakdown ────────────────────────────── */}
          <div className="flex items-center gap-1.5 overflow-x-auto border-b border-white/10 pb-2">
            {[
              { id: "scorecard", label: "Executive Scorecard", icon: BarChart3 },
              { id: "keywords", label: "ATS Keyword Heatmap", icon: Search },
              { id: "sections", label: "Section-by-Section Audit", icon: FileText },
              { id: "verbs", label: "Verbs & Metrics", icon: Zap },
              { id: "bullets", label: "STAR Bullet Rewrites", icon: Copy },
              { id: "projects", label: "Tailored Projects", icon: FolderGit2 },
              { id: "roadmap", label: "90-Day Role Roadmap", icon: BookOpen },
              { id: "outreach", label: "Recruiter & Interview Kit", icon: MessageSquare },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all duration-200 transform hover:scale-105 hover:-translate-y-0.5 whitespace-nowrap ${
                    isActive
                      ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-soft"
                      : "bg-white/5 hover:bg-white/10 text-slate-300"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* ─── TAB 1: Executive Scorecard & Role Overview ────────────────────── */}
          {activeTab === "scorecard" && (
            <div className="space-y-6">
              {/* Detailed Summary */}
              <GlassCard className="p-5 space-y-3">
                <span className="text-xs uppercase tracking-wider text-indigo-400 font-semibold flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Executive Audit Summary for {result.role}
                </span>
                <p className="text-sm text-slate-200 leading-relaxed">
                  {result.summary}
                </p>
              </GlassCard>

              {/* Strengths & Weaknesses Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <GlassCard className="p-5 border-emerald-500/20 space-y-3">
                  <span className="text-xs uppercase tracking-wider text-emerald-400 font-semibold flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Key Candidate Strengths for {result.role}
                  </span>
                  <ul className="space-y-2">
                    {result.role_readiness?.strengths?.map((str, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-xs text-slate-200">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </GlassCard>

                <GlassCard className="p-5 border-rose-500/20 space-y-3">
                  <span className="text-xs uppercase tracking-wider text-rose-400 font-semibold flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Critical Gaps & Red Flags
                  </span>
                  <ul className="space-y-2">
                    {result.role_readiness?.weaknesses?.map((w, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-xs text-slate-200">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                        <span>{w}</span>
                      </li>
                    ))}
                  </ul>
                </GlassCard>
              </div>

              {/* Actionable Suggestions */}
              <GlassCard className="p-5 space-y-3">
                <span className="text-xs uppercase tracking-wider text-indigo-300 font-semibold flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  High-Priority Action Items to Maximize Callbacks
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {result.suggestions?.map((sug, i) => (
                    <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-white/5 border border-white/5 text-xs text-slate-300">
                      <span className="h-5 w-5 rounded-full bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 flex items-center justify-center font-bold text-[10px] shrink-0">
                        {i + 1}
                      </span>
                      <span>{sug}</span>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>
          )}

          {/* ─── TAB 2: ATS Keyword Heatmap & Gap Analysis ────────────────────── */}
          {activeTab === "keywords" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                    <Search className="h-4 w-4 text-indigo-400" />
                    ATS Keyword Matrix for {result.role}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Applicant Tracking Systems filter candidates by keyword frequency. Here is your exact match breakdown:
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-white/10">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-white/5 border-b border-white/10 uppercase tracking-wider text-[10px] text-slate-400">
                    <tr>
                      <th className="p-3">Required Technology / Keyword</th>
                      <th className="p-3">Importance</th>
                      <th className="p-3">Status in Resume</th>
                      <th className="p-3">Frequency</th>
                      <th className="p-3">Placement Guidance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {result.keyword_gap_analysis?.map((item, idx) => (
                      <tr key={idx} className="hover:bg-white/5 transition">
                        <td className="p-3 font-semibold text-slate-100">
                          {item.keyword}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                              item.importance === "Critical"
                                ? "bg-rose-500/10 border-rose-400/30 text-rose-300"
                                : item.importance === "High"
                                ? "bg-amber-500/10 border-amber-400/30 text-amber-300"
                                : "bg-blue-500/10 border-blue-400/30 text-blue-300"
                            }`}
                          >
                            {item.importance}
                          </span>
                        </td>
                        <td className="p-3">
                          {item.status === "Found" ? (
                            <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                              <CheckCheck className="h-3.5 w-3.5" /> Present
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-rose-400 font-medium">
                              <XCircle className="h-3.5 w-3.5" /> Missing
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          <span className={item.frequency > 0 ? "text-emerald-300 font-bold" : "text-slate-500"}>
                            {item.frequency}x
                          </span>
                        </td>
                        <td className="p-3 text-slate-400 max-w-xs">
                          {item.context_advice}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ─── TAB 3: Section-by-Section Forensic Audit ──────────────────────── */}
          {activeTab === "sections" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Header & Contact */}
                <GlassCard className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider text-slate-300 font-semibold">
                      1. Contact Information & Header
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${result.sections_audit?.header?.status === "Good" ? "bg-emerald-500/10 border-emerald-400/30 text-emerald-300" : "bg-rose-500/10 border-rose-400/30 text-rose-300"}`}>
                      {result.sections_audit?.header?.status || "Good"}
                    </span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex flex-wrap gap-1.5">
                      {result.sections_audit?.header?.detected?.map((d, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 text-[11px]">
                          <Check className="h-3 w-3" /> {d}
                        </span>
                      ))}
                      {result.sections_audit?.header?.missing?.map((m, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 text-[11px]">
                          <AlertTriangle className="h-3 w-3" /> Missing: {m}
                        </span>
                      ))}
                    </div>
                    <p className="text-slate-400 leading-relaxed pt-1">
                      {result.sections_audit?.header?.advice}
                    </p>
                  </div>
                </GlassCard>

                {/* 2. Professional Summary */}
                <GlassCard className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider text-slate-300 font-semibold">
                      2. Professional Summary
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-500/10 border border-indigo-400/30 text-indigo-300">
                      {result.sections_audit?.summary_objective?.status || "Review"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {result.sections_audit?.summary_objective?.critique}
                  </p>
                  <div className="p-3 rounded-xl bg-indigo-500/5 border border-indigo-400/20 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-wider text-indigo-300 font-bold">
                        AI Recommended Role Summary
                      </span>
                      <button
                        onClick={() => handleCopyText(result.sections_audit?.summary_objective?.recommended_rewrite, "summary")}
                        className="text-[11px] text-indigo-300 hover:text-white flex items-center gap-1"
                      >
                        {copiedType === "summary" ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                        Copy
                      </button>
                    </div>
                    <p className="text-xs text-slate-200 italic">
                      "{result.sections_audit?.summary_objective?.recommended_rewrite}"
                    </p>
                  </div>
                </GlassCard>

                {/* 3. Projects Audit */}
                <GlassCard className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider text-slate-300 font-semibold">
                      3. Projects Section
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/10 border border-emerald-400/30 text-emerald-300">
                      Relevance: {result.sections_audit?.projects?.role_relevance_rating || "High"}
                    </span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {result.sections_audit?.projects?.findings?.map((f, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-indigo-400 font-bold">•</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </GlassCard>

                {/* 4. Experience & Metrics Audit */}
                <GlassCard className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider text-slate-300 font-semibold">
                      4. Experience & Quantification
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-purple-500/10 border border-purple-400/30 text-purple-300">
                      {result.sections_audit?.experience?.metric_bullets_percent || 30}% with Metrics
                    </span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {result.sections_audit?.experience?.findings?.map((f, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-purple-400 font-bold">•</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </GlassCard>

                {/* 5. Skills Section Categorization */}
                <GlassCard className="p-5 md:col-span-2 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider text-slate-300 font-semibold">
                      5. Technical Skills Categorization Guide
                    </span>
                    <span className="text-xs text-slate-400">
                      Best practice: Clean categorized breakdown
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
                    {result.sections_audit?.skills?.suggested_categorization &&
                      Object.entries(result.sections_audit.skills.suggested_categorization).map(([cat, list], i) => (
                        <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
                          <div className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider">
                            {cat}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {Array.isArray(list) && list.length > 0 ? (
                              list.map((s, idx) => (
                                <span key={idx} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-slate-300">
                                  {s}
                                </span>
                              ))
                            ) : (
                              <span className="text-[10px] text-slate-500 italic">Add recommended tools</span>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </GlassCard>
              </div>
            </div>
          )}

          {/* ─── TAB 4: Verbs & Metrics ────────────────────────────────────────── */}
          {activeTab === "verbs" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Metric Quantification Rate */}
                <GlassCard className="p-5 space-y-2 border-indigo-500/20">
                  <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                    Quantified Bullets Rate
                  </div>
                  <div className="text-4xl font-extrabold text-indigo-300">
                    {result.action_verbs_analysis?.quantification_percentage || 30}%
                  </div>
                  <ProgressBar value={(result.action_verbs_analysis?.quantification_percentage || 30) / 10} max={10} />
                  <p className="text-[11px] text-slate-400 pt-1">
                    Aim for 40%+ of your bullet points to contain measurable numbers (%, latency, user count).
                  </p>
                </GlassCard>

                {/* Strong Verbs */}
                <GlassCard className="p-5 md:col-span-2 space-y-3">
                  <div className="text-xs uppercase tracking-wider text-emerald-400 font-semibold flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Power Verbs Found in Your Resume
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {result.action_verbs_analysis?.strong_verbs?.map((v, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-lg text-xs bg-emerald-500/10 border border-emerald-400/30 text-emerald-200 font-medium capitalize">
                        {v}
                      </span>
                    ))}
                  </div>
                </GlassCard>
              </div>

              {/* Passive Verbs to Replace */}
              <GlassCard className="p-5 space-y-3">
                <div className="text-xs uppercase tracking-wider text-amber-400 font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Weak / Passive Phrases Detected (Replace for Greater Impact)
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {result.action_verbs_analysis?.weak_verbs_found?.map((item, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-rose-400 font-semibold line-through">
                          "{item.weak}"
                        </span>
                        <span className="text-emerald-300 font-semibold">
                          Replace with: {item.replacement}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {item.example}
                      </p>
                    </div>
                  ))}
                </div>
              </GlassCard>

              {/* Buzzwords Alert */}
              {result.action_verbs_analysis?.buzzwords_detected?.length > 0 && (
                <GlassCard className="p-4 border-amber-500/30 bg-amber-500/5 flex items-start gap-3">
                  <Flame className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1 text-xs">
                    <div className="font-semibold text-amber-200">
                      Overused Buzzwords Detected: {result.action_verbs_analysis.buzzwords_detected.join(", ")}
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                      Recruiters view phrases like "hardworking" or "team player" as resume filler. Eliminate these claims and replace them with concrete evidence in your project descriptions.
                    </p>
                  </div>
                </GlassCard>
              )}
            </div>
          )}

          {/* ─── TAB 5: STAR Bullet Rewrites ──────────────────────────────────── */}
          {activeTab === "bullets" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-100">
                    High-Impact Resume Bullet Transformations
                  </h3>
                  <p className="text-xs text-slate-400">
                    Replace passive statements with metric-driven, STAR-structured bullets tailored for {result.role}.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {result.bullet_improvements?.map((item, idx) => (
                  <GlassCard key={idx} className="p-4 space-y-3 border-white/10">
                    {/* Before */}
                    <div className="space-y-1">
                      <div className="text-[11px] uppercase tracking-wider text-rose-400 font-semibold flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                        Weak / Generic Phrasing
                      </div>
                      <div className="text-xs text-slate-300 bg-rose-500/5 border border-rose-400/20 rounded-xl p-2.5 line-through decoration-rose-400/60">
                        {item.original_or_issue}
                      </div>
                    </div>

                    {/* After */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="text-[11px] uppercase tracking-wider text-emerald-400 font-semibold flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                          ATS-Optimized STAR Rewrite
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyText(item.improved_version, "bullet", idx)}
                          className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 text-emerald-300 border border-emerald-400/30 transition"
                        >
                          {copiedType === "bullet" && copiedIndex === idx ? (
                            <>
                              <Check className="h-3 w-3" /> Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" /> Copy Bullet
                            </>
                          )}
                        </button>
                      </div>
                      <div className="text-xs text-emerald-100 bg-emerald-500/10 border border-emerald-400/30 rounded-xl p-3 font-medium leading-relaxed">
                        {item.improved_version}
                      </div>
                    </div>

                    {/* Reason */}
                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-1">
                      <Sparkles className="h-3 w-3 text-indigo-400 shrink-0" />
                      <span><strong>Recruiter Value:</strong> {item.reason}</span>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </div>
          )}

          {/* ─── TAB 6: Tailored Projects ─────────────────────────────────────── */}
          {activeTab === "projects" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-100">
                    Recommended Projects for {result.role}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Build one of these projects to prove mastery over your missing critical skills and stand out to hiring managers.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {result.suggested_projects?.map((proj, idx) => (
                  <GlassCard
                    key={idx}
                    className="p-5 flex flex-col justify-between border-white/10 hover:border-indigo-400/30 transition space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-semibold bg-indigo-500/15 border border-indigo-400/30 text-indigo-300">
                          {proj.difficulty || "Intermediate"}
                        </span>
                        <FolderGit2 className="h-4 w-4 text-slate-400" />
                      </div>

                      <h4 className="text-sm font-bold text-slate-100 leading-snug">
                        {proj.title}
                      </h4>

                      <p className="text-xs text-slate-300 leading-relaxed">
                        {proj.description}
                      </p>

                      <div className="space-y-1.5 pt-1">
                        <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                          Recommended Stack:
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {proj.tech_stack?.map((t, i) => (
                            <span
                              key={i}
                              className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-slate-200"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1.5 pt-1">
                        <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                          Key Features to Build:
                        </div>
                        <ul className="space-y-1 text-[11px] text-slate-300">
                          {proj.key_features?.slice(0, 3).map((f, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-indigo-400 font-bold">•</span>
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-white/5 space-y-1">
                      <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Skills You'll Prove:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {proj.skills_bridged?.map((sb, i) => (
                          <span
                            key={i}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-400/20 text-emerald-300"
                          >
                            {sb}
                          </span>
                        ))}
                      </div>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </div>
          )}

          {/* ─── TAB 7: 90-Day Role Roadmap ───────────────────────────────────── */}
          {activeTab === "roadmap" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-indigo-400" />
                  30-60-90 Day Skill Mastery Roadmap for {result.role}
                </h3>
                <p className="text-xs text-slate-400">
                  Follow this chronological roadmap to close all critical skill gaps and prepare for campus placement interviews.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {result.learning_roadmap?.map((phase, idx) => (
                  <GlassCard key={idx} className="p-5 space-y-3 border-white/10 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold bg-indigo-500/20 border border-indigo-400/30 text-indigo-300">
                          {phase.phase}
                        </span>
                        <span className="text-[11px] text-slate-400">{phase.time_frame}</span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-100">
                        {phase.title}
                      </h4>

                      <ul className="space-y-2 text-xs text-slate-300 pt-1">
                        {phase.milestones?.map((m, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                            <span>{m}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-3 border-t border-white/5 space-y-1">
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                        Recommended Tooling:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {phase.recommended_tools?.map((t, i) => (
                          <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </div>
          )}

          {/* ─── TAB 8: Recruiter Outreach & Interview Kit ────────────────────── */}
          {activeTab === "outreach" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 30-Sec Elevator Pitch */}
                <GlassCard className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider text-indigo-300 font-semibold flex items-center gap-1.5">
                      <Zap className="h-4 w-4" />
                      30-Second Elevator Pitch ("Tell Me About Yourself")
                    </span>
                    <button
                      onClick={() => handleCopyText(result.recruiter_outreach?.elevator_pitch, "pitch")}
                      className="text-[11px] text-indigo-300 hover:text-white flex items-center gap-1"
                    >
                      {copiedType === "pitch" ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                      Copy Pitch
                    </button>
                  </div>
                  <p className="text-xs text-slate-200 bg-white/5 border border-white/10 rounded-xl p-3 leading-relaxed italic">
                    "{result.recruiter_outreach?.elevator_pitch}"
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Use this spoken script when interviewers ask you to introduce yourself. It anchors directly to your {result.role} background.
                  </p>
                </GlassCard>

                {/* Cold Outreach / LinkedIn Message */}
                <GlassCard className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider text-purple-300 font-semibold flex items-center gap-1.5">
                      <MessageSquare className="h-4 w-4" />
                      High-Conversion LinkedIn / Recruiter DM
                    </span>
                    <button
                      onClick={() => handleCopyText(result.recruiter_outreach?.cold_email_linkedin_message, "dm")}
                      className="text-[11px] text-purple-300 hover:text-white flex items-center gap-1"
                    >
                      {copiedType === "dm" ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                      Copy Message
                    </button>
                  </div>
                  <pre className="text-xs text-slate-200 bg-white/5 border border-white/10 rounded-xl p-3 leading-relaxed whitespace-pre-wrap font-sans">
                    {result.recruiter_outreach?.cold_email_linkedin_message}
                  </pre>
                  <p className="text-[11px] text-slate-400">
                    Send directly to Tech Recruiters or Engineering Managers on LinkedIn for {result.role} openings.
                  </p>
                </GlassCard>
              </div>

              {/* Expected Interview Questions with Model Strategies */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-100">
                      Targeted Interview Questions for {result.role}
                    </h3>
                    <p className="text-xs text-slate-400">
                      High-probability questions technical interviewers will ask based on your resume projects and target role.
                    </p>
                  </div>

                  <PrimaryButton
                    type="button"
                    className="text-xs gap-1.5 shrink-0"
                    onClick={() => navigate("/technical-interview")}
                  >
                    <Code2 className="h-3.5 w-3.5" />
                    Practice Technical Interview Mode
                  </PrimaryButton>
                </div>

                <div className="space-y-3">
                  {result.interview_questions?.map((q, idx) => (
                    <GlassCard key={idx} className="p-4 space-y-2 border-white/10">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-400/20 text-indigo-300 font-semibold">
                          {q.category || "Technical Architecture"}
                        </span>
                        <span className="text-[11px] text-slate-400">Q{idx + 1}</span>
                      </div>

                      <div className="text-sm font-medium text-slate-100 leading-snug">
                        "{q.question}"
                      </div>

                      <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-xs text-slate-300 space-y-1">
                        <div className="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold flex items-center gap-1">
                          <Sparkles className="h-3 w-3" /> Recommended Answer Strategy:
                        </div>
                        <p className="leading-relaxed">
                          {q.answer_strategy}
                        </p>
                      </div>
                    </GlassCard>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default ResumeAnalysisPage;
