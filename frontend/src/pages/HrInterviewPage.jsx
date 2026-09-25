import React, { useEffect, useRef, useState } from "react";
import { Mic, RotateCcw, ArrowRightCircle } from "lucide-react";
import api from "../services/api";
import GlassCard from "../components/GlassCard";
import PrimaryButton from "../components/PrimaryButton";
import ProgressBar from "../components/ProgressBar";
import Skeleton from "../components/Skeleton";
import { useToast } from "../context/ToastContext";

const difficulties = [
  { id: "easy", label: "Easy" },
  { id: "medium", label: "Medium" },
  { id: "hard", label: "Hard" },
];

const HrInterviewPage = () => {
  const [difficulty, setDifficulty] = useState("easy");
  const [question, setQuestion] = useState(null);
  const [transcript, setTranscript] = useState("");
  const [result, setResult] = useState(null);
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [attempts, setAttempts] = useState([]); // session attempts
  const { addToast } = useToast();
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const startTimeRef = useRef(null); // tracks recording start time for duration_sec

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      addToast(
        "Browser speech recognition not available. Use Chrome for voice input.",
        "error"
      );
      return;
    }
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let finalTranscript = "";
      for (let i = 0; i < event.results.length; i += 1) {
        finalTranscript += event.results[i][0].transcript;
      }
      setTranscript(finalTranscript.trim());
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
      addToast("Speech recognition error. Please try again.", "error");
    };
  }, [addToast]);

  const toggleListening = () => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      try {
        setTranscript("");
        setResult(null);
        startTimeRef.current = Date.now(); // record start time
        recognition.start();
        setIsListening(true);
      } catch {
        addToast("Unable to start microphone. Check permissions.", "error");
      }
    }
  };

  const fetchQuestion = async () => {
    setLoadingQuestion(true);
    setResult(null);
    setTranscript("");
    try {
      const res = await api.get(`/api/hr/question?difficulty=${difficulty}`);
      setQuestion(res.data?.data?.question || null);
      setAttempt(0);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to fetch HR question";
      addToast(msg, "error");
    } finally {
      setLoadingQuestion(false);
    }
  };

  const handleSubmit = async () => {
    if (!question) {
      addToast("Please fetch a question first", "error");
      return;
    }
    if (!transcript.trim()) {
      addToast("Please speak your answer before submitting", "error");
      return;
    }
    setSubmitting(true);
    try {
      // Calculate real speaking duration for accurate WPM
      const durationSec = startTimeRef.current
        ? Math.round((Date.now() - startTimeRef.current) / 1000)
        : null;

      const res = await api.post("/api/hr/submit", {
        question_id: question.id,
        transcript,
        ...(durationSec && durationSec > 3 ? { duration_sec: durationSec } : {}),
      });
      const data = res.data?.data;
      setResult(data || null);
      setAttempt((prev) => prev + 1);
      if (data) {
        setAttempts((prev) => [
          ...prev,
          {
            questionId: question.id,
            confidence: data.confidence_score,
            fillers: data.filler_word_count,
            speechSpeed: data.speech_speed,
          },
        ]);
      }
    } catch (err) {
      const msg =
        err.response?.data?.message || "Failed to submit answer for feedback";
      addToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetake = () => {
    setTranscript("");
    setResult(null);
  };

  const handleNextQuestion = async () => {
    if (!result) {
      addToast("Submit your answer before moving to the next question.", "error");
      return;
    }
    await fetchQuestion();
  };

  const handleEndInterview = async () => {
    if (!attempts.length) {
      addToast("Answer at least one question before ending the interview.", "error");
      return;
    }

    const totalQuestions = attempts.length;
    const totalFillerWords = attempts.reduce(
      (sum, a) => sum + (a.fillers || 0),
      0
    );
    const averageConfidence =
      attempts.reduce((sum, a) => sum + (a.confidence || 0), 0) /
      totalQuestions;

    try {
      await api.post("/api/dashboard/summary", {
        mode: "HR",
        difficulty,
        average_confidence_score: averageConfidence,
        total_filler_words: totalFillerWords,
      });
      addToast("Interview summary saved to dashboard.", "success");
      setAttempts([]);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "Failed to save interview summary. Please try again.";
      addToast(msg, "error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-50">
            HR Interview Practice
          </h2>
          <p className="text-xs text-slate-400">
            Practice behavioral questions and get instant AI feedback on your
            answers.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Mic className="h-4 w-4 text-indigo-400" />
          <span>Simulated voice input using transcript box</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: question and input */}
        <GlassCard className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-[0.18em] text-slate-400">
                1. Select difficulty
              </span>
              <span className="text-sm text-slate-200">
                Choose the type of HR question
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {difficulties.map((d) => (
              <button
                key={d.id}
                onClick={() => setDifficulty(d.id)}
                className={`px-3 py-1.5 rounded-full text-xs border transition ${
                  difficulty === d.id
                    ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-transparent shadow-soft"
                    : "bg-white/5 border-white/10 text-slate-200 hover:bg-white/10"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between mt-2">
            <div className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-[0.18em] text-slate-400">
                2. Question
              </span>
              <span className="text-sm text-slate-200">
                Start or continue your HR interview
              </span>
            </div>
            <PrimaryButton
              type="button"
              onClick={fetchQuestion}
              disabled={loadingQuestion}
              className="gap-2"
            >
              <ArrowRightCircle className="h-4 w-4" />
              {loadingQuestion
                ? "Loading..."
                : !question && attempts.length === 0
                ? "Start Interview"
                : "New Question"}
            </PrimaryButton>
          </div>

          <div className="mt-2 text-sm text-slate-100 min-h-[48px]">
            {loadingQuestion ? (
              <Skeleton className="h-10" />
            ) : question ? (
              <p>{question.question}</p>
            ) : (
              <p className="text-slate-500 text-xs">
                Click &ldquo;Get Question&rdquo; to start your HR interview.
              </p>
            )}
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-[0.18em] text-slate-400">
                3. Your spoken answer (auto transcript)
              </span>
              {attempt > 0 && (
                <span className="text-[11px] text-slate-400">
                  Attempts for this question:{" "}
                  <span className="text-indigo-300 font-medium">
                    {attempt}
                  </span>
                </span>
              )}
            </div>
            <textarea
              rows={6}
              className="w-full rounded-2xl bg-slate-950/60 border border-white/10 text-sm px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500/60 resize-none"
              placeholder="Use the microphone to speak your answer. The transcript will appear here."
              value={transcript}
              readOnly
            />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={toggleListening}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs border border-white/10 ${
                  isListening
                    ? "bg-emerald-500/20 text-emerald-200"
                    : "bg-white/5 hover:bg-white/10 text-slate-200"
                }`}
              >
                <Mic className="h-3 w-3" />
                {isListening ? "Listening..." : "Start Speaking"}
              </button>
              <button
                type="button"
                onClick={handleRetake}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs border border-white/10 bg-white/5 hover:bg-white/10 text-slate-200"
              >
                <RotateCcw className="h-3 w-3" />
                Retake Question
              </button>
              <PrimaryButton
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="gap-2"
              >
                <Mic className="h-4 w-4" />
                {submitting ? "Analyzing..." : "Submit"}
              </PrimaryButton>
            </div>
          </div>
        </GlassCard>

        {/* Right: feedback + session controls */}
        <GlassCard className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
                AI Feedback
              </div>
              <div className="text-sm text-slate-200">
                Structured coaching on your answer
              </div>
            </div>
          </div>

          {!result ? (
            <div className="text-xs text-slate-500">
              Submit your answer to see AI feedback, improved sample answer, and
              confidence metrics here.
            </div>
          ) : (
            <div className="space-y-3">
              {/* Scores row */}
              <div className="flex gap-3 flex-wrap">
                <div className="flex-1 space-y-1">
                  <div className="text-[11px] text-slate-400">Confidence Score</div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-200">{result.confidence_score?.toFixed(1) ?? "—"}/10</span>
                    <span className="text-slate-400">
                      {result.word_count} words • {result.speech_speed} WPM •{" "}
                      {result.filler_word_count} filler words
                    </span>
                  </div>
                  <ProgressBar value={result.confidence_score} max={10} />
                </div>
                {result.ai_score != null && (
                  <div className="text-center px-3 py-1 rounded-xl bg-indigo-500/10 border border-indigo-400/30">
                    <div className="text-[11px] text-indigo-300">AI Score</div>
                    <div className="text-lg font-bold text-indigo-200">{result.ai_score}<span className="text-xs text-slate-400">/10</span></div>
                  </div>
                )}
              </div>

              {/* Tone assessment */}
              {result.tone_assessment && (
                <div className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300">
                  <span className="text-slate-500 mr-1">Tone:</span>{result.tone_assessment}
                </div>
              )}

              {/* Missing elements */}
              {result.missing_elements?.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-rose-400">Missing Elements</div>
                  <div className="flex flex-wrap gap-1">
                    {result.missing_elements.map((el, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-full text-[11px] bg-rose-500/10 border border-rose-400/30 text-rose-300">
                        {el}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Feedback + Improved answer */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Feedback</div>
                  <div className="text-xs text-slate-200 bg-white/5 border border-white/10 rounded-xl p-2 leading-relaxed max-h-40 overflow-y-auto">
                    {result.feedback_text || "No feedback from AI."}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Improved Answer</div>
                  <div className="text-xs text-emerald-100 bg-emerald-500/5 border border-emerald-400/20 rounded-xl p-2 leading-relaxed max-h-40 overflow-y-auto">
                    {result.improved_answer || "No improved answer provided."}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-white/5 flex flex-wrap gap-2 justify-end">
            <PrimaryButton
              type="button"
              className="text-xs"
              onClick={handleNextQuestion}
              disabled={!result || loadingQuestion}
            >
              Next Question
            </PrimaryButton>
            <button
              type="button"
              onClick={handleEndInterview}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs border border-emerald-400/40 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20"
            >
              End Interview & Save Summary
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default HrInterviewPage;

