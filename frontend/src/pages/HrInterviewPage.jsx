import React, { useEffect, useRef, useState } from "react";
import {
  Mic,
  RotateCcw,
  ArrowRightCircle,
  Volume2,
  VolumeX,
  Video,
  VideoOff,
  Timer,
  CheckCircle2,
} from "lucide-react";
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

  // Voice recording & duration state
  const [isListening, setIsListening] = useState(false);
  const [speakingSeconds, setSpeakingSeconds] = useState(0);
  const recognitionRef = useRef(null);
  const startTimeRef = useRef(null);
  const timerIntervalRef = useRef(null);

  // Audio TTS & Camera Preview state
  const [isSpeakingQuestion, setIsSpeakingQuestion] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      addToast(
        "Browser speech recognition is not supported in this browser. You can type your answers directly!",
        "info"
      );
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let finalTranscript = "";
      for (let i = 0; i < event.results.length; i += 1) {
        finalTranscript += event.results[i][0].transcript + " ";
      }
      setTranscript(finalTranscript.trim());
    };

    recognition.onend = () => {
      setIsListening(false);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };

    recognition.onerror = (event) => {
      if (event.error !== "no-speech") {
        addToast(`Microphone notification: ${event.error}. You can also type your answer.`, "info");
      }
      setIsListening(false);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [addToast]);

  // Handle webcam mirror toggle
  const toggleCamera = async () => {
    if (cameraActive) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      setCameraActive(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240 },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCameraActive(true);
        addToast("Webcam preview active. Maintain confident posture & eye contact!", "success");
      } catch (err) {
        addToast("Unable to access webcam. Check browser camera permissions.", "error");
      }
    }
  };

  // Re-attach video stream if camera is active
  useEffect(() => {
    if (cameraActive && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [cameraActive]);

  // Voice recording toggle with live timer
  const toggleListening = () => {
    const recognition = recognitionRef.current;
    if (!recognition) {
      addToast("Speech recognition not supported on this browser. You can type directly in the answer box.", "info");
      return;
    }

    if (isListening) {
      try {
        recognition.stop();
      } catch {
        // ignore
      }
      setIsListening(false);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    } else {
      try {
        setResult(null);
        startTimeRef.current = Date.now();
        setSpeakingSeconds(0);
        recognition.start();
        setIsListening(true);

        timerIntervalRef.current = setInterval(() => {
          setSpeakingSeconds((prev) => prev + 1);
        }, 1000);
      } catch {
        addToast("Unable to activate microphone. Please check your browser permissions.", "error");
      }
    }
  };

  // Text-To-Speech for Interviewer Question
  const toggleSpeakQuestion = () => {
    if (!("speechSynthesis" in window) || !question?.question) return;

    if (isSpeakingQuestion) {
      window.speechSynthesis.cancel();
      setIsSpeakingQuestion(false);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(question.question);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.onend = () => setIsSpeakingQuestion(false);
      utterance.onerror = () => setIsSpeakingQuestion(false);
      setIsSpeakingQuestion(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  const fetchQuestion = async () => {
    setLoadingQuestion(true);
    setResult(null);
    setTranscript("");
    setSpeakingSeconds(0);
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeakingQuestion(false);
    }

    try {
      const res = await api.get(`/api/hr/question?difficulty=${difficulty}`);
      const newQ = res.data?.data?.question || null;
      setQuestion(newQ);
      setAttempt(0);

      // Auto-speak question for realistic interview experience if user already started
      if (newQ && "speechSynthesis" in window && attempts.length > 0) {
        setTimeout(() => {
          const utterance = new SpeechSynthesisUtterance(newQ.question);
          utterance.rate = 0.95;
          utterance.onend = () => setIsSpeakingQuestion(false);
          utterance.onerror = () => setIsSpeakingQuestion(false);
          setIsSpeakingQuestion(true);
          window.speechSynthesis.speak(utterance);
        }, 300);
      }
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
      addToast("Please speak or type your answer before submitting", "error");
      return;
    }

    // Stop recording if active
    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      setIsListening(false);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }

    setSubmitting(true);
    try {
      const durationSec = speakingSeconds > 3
        ? speakingSeconds
        : startTimeRef.current
        ? Math.round((Date.now() - startTimeRef.current) / 1000)
        : null;

      const res = await api.post("/api/hr/submit", {
        question_id: question.id,
        transcript,
        ...(durationSec && durationSec > 2 ? { duration_sec: durationSec } : {}),
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
        addToast("Answer evaluated successfully!", "success");
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
    setSpeakingSeconds(0);
    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      setIsListening(false);
    }
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

  const formatTimer = (secs) => {
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remSecs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-50 flex items-center gap-2">
            HR Interview Practice
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-normal">
              AI Voice & Behavior Coach
            </span>
          </h2>
          <p className="text-xs text-slate-400">
            Practice real behavioral questions, record spoken answers, and receive instant STAR-method analysis.
          </p>
        </div>

        {/* Action badges: camera preview toggle */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleCamera}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs border transition ${
              cameraActive
                ? "bg-rose-500/20 border-rose-500/40 text-rose-200"
                : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
            }`}
          >
            {cameraActive ? <VideoOff className="h-3.5 w-3.5" /> : <Video className="h-3.5 w-3.5 text-indigo-400" />}
            {cameraActive ? "Turn Off Webcam" : "Webcam Mirror"}
          </button>
        </div>
      </div>

      {/* Optional Webcam Preview Box */}
      {cameraActive && (
        <GlassCard className="p-3 bg-slate-950/80 border-indigo-500/30 flex items-center justify-center">
          <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-black aspect-video max-h-48">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform -scale-x-100"
            />
            <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 text-[10px] text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Camera Mirror (Maintains Eye Contact)
            </div>
          </div>
        </GlassCard>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: question and input */}
        <GlassCard className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-[0.18em] text-slate-400">
                1. Select difficulty
              </span>
              <span className="text-sm text-slate-200">
                Choose the behavioral question level
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
                2. Interviewer Question
              </span>
              <span className="text-sm text-slate-200">
                Listen or read your prompt
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

          <div className="mt-2 text-sm text-slate-100 min-h-[48px] bg-slate-900/40 p-3 rounded-2xl border border-white/5 flex items-start justify-between gap-3">
            {loadingQuestion ? (
              <Skeleton className="h-10 w-full" />
            ) : question ? (
              <>
                <p className="leading-relaxed font-medium text-slate-100 flex-1">
                  &ldquo;{question.question}&rdquo;
                </p>
                <button
                  type="button"
                  onClick={toggleSpeakQuestion}
                  title="Listen to Interviewer Question"
                  className={`p-2 rounded-xl border transition shrink-0 ${
                    isSpeakingQuestion
                      ? "bg-indigo-500/20 border-indigo-400 text-indigo-300 animate-pulse"
                      : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                  }`}
                >
                  {isSpeakingQuestion ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </button>
              </>
            ) : (
              <p className="text-slate-500 text-xs">
                Click &ldquo;Start Interview&rdquo; above to receive your first behavioral prompt.
              </p>
            )}
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-[0.18em] text-slate-400">
                  3. Your Answer
                </span>
                {isListening && (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] text-emerald-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Recording: {formatTimer(speakingSeconds)}
                  </span>
                )}
              </div>
              {attempt > 0 && (
                <span className="text-[11px] text-slate-400">
                  Attempts for this question:{" "}
                  <span className="text-indigo-300 font-medium">{attempt}</span>
                </span>
              )}
            </div>

            {/* Answer textarea: Fully editable with typing OR voice dictation */}
            <textarea
              rows={6}
              className="w-full rounded-2xl bg-slate-950/70 border border-white/10 text-sm px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500/60 resize-none text-slate-100 placeholder:text-slate-500 leading-relaxed"
              placeholder="Click 'Start Speaking' to dictate your answer with your mic, or type and edit your answer directly here..."
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
            />

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <span className="text-[11px] text-slate-500">
                {transcript.trim() ? `${transcript.trim().split(/\s+/).length} words` : "0 words"}
              </span>

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs border transition ${
                    isListening
                      ? "bg-rose-500/20 border-rose-500/40 text-rose-200 animate-pulse"
                      : "bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-200"
                  }`}
                >
                  <Mic className="h-3.5 w-3.5" />
                  {isListening ? "Stop Recording" : "Start Speaking"}
                </button>

                <button
                  type="button"
                  onClick={handleRetake}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs border border-white/10 bg-white/5 hover:bg-white/10 text-slate-200"
                >
                  <RotateCcw className="h-3 w-3" />
                  Clear
                </button>

                <PrimaryButton
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting || !transcript.trim()}
                  className="gap-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {submitting ? "Evaluating..." : "Submit Answer"}
                </PrimaryButton>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Right: feedback + session controls */}
        <GlassCard className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
                AI Interviewer Evaluation
              </div>
              <div className="text-sm text-slate-200">
                STAR structure, pacing & behavioral assessment
              </div>
            </div>
          </div>

          {!result ? (
            <div className="text-xs text-slate-500 py-12 text-center flex flex-col items-center gap-2">
              <Mic className="h-8 w-8 text-slate-700 stroke-[1.5]" />
              <p>Speak or type your answer and click &ldquo;Submit Answer&rdquo;.</p>
              <p className="text-[11px] text-slate-600">
                The AI will grade your answer on filler words, speaking cadence (WPM), STAR alignment, and provide an improved model answer.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Scores row */}
              <div className="flex gap-3 flex-wrap">
                <div className="flex-1 space-y-1">
                  <div className="text-[11px] text-slate-400">Delivery & Confidence</div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-200 font-semibold">{result.confidence_score?.toFixed(1) ?? "—"}/10</span>
                    <span className="text-slate-400 text-[11px]">
                      {result.word_count} words • {result.speech_speed} WPM •{" "}
                      {result.filler_word_count} filler words
                    </span>
                  </div>
                  <ProgressBar value={result.confidence_score} max={10} />
                </div>
                {result.ai_score != null && (
                  <div className="text-center px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-400/30">
                    <div className="text-[10px] text-indigo-300 uppercase tracking-wider">AI Content Score</div>
                    <div className="text-lg font-bold text-indigo-200">{result.ai_score}<span className="text-xs text-slate-400">/10</span></div>
                  </div>
                )}
              </div>

              {/* Tone assessment */}
              {result.tone_assessment && (
                <div className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300 flex items-center gap-2">
                  <span className="text-slate-500 text-[11px] uppercase tracking-wider">Tone:</span>
                  <span className="text-slate-200 font-medium">{result.tone_assessment}</span>
                </div>
              )}

              {/* Missing elements */}
              {result.missing_elements?.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-rose-400">Missing Elements (STAR)</div>
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
                  <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400 font-semibold">Feedback</div>
                  <div className="text-xs text-slate-200 bg-white/5 border border-white/10 rounded-xl p-2.5 leading-relaxed max-h-48 overflow-y-auto">
                    {result.feedback_text || "No feedback from AI."}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-emerald-400 font-semibold">Model STAR Answer</div>
                  <div className="text-xs text-emerald-100 bg-emerald-500/5 border border-emerald-400/20 rounded-xl p-2.5 leading-relaxed max-h-48 overflow-y-auto">
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs border border-emerald-400/40 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20 transition"
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
