import React, { useState, useEffect, useRef } from "react";
import "./VoiceAssistant.css";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
import axios from "axios";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

const VoiceAssistant = () => {
  const [isListening, setIsListening] = useState(false);
  const [responseList, setResponseList] = useState([]);
  const [barsHeight, setBarsHeight] = useState([5, 10, 15, 8]);
  const { transcript, listening, resetTranscript } = useSpeechRecognition();
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const timeoutRef = useRef(null);

  // ✅ Check Microphone Permissions
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then(() => {
        console.log("✅ Microphone access granted.");
      })
      .catch((error) => {
        console.error("❌ Microphone access denied:", error);
        alert("Microphone access denied. Please allow microphone access in your browser settings.");
      });

    if (!SpeechRecognition.browserSupportsSpeechRecognition()) {
      alert("Your browser does not support speech recognition. 😢");
      console.error("❌ SpeechRecognition not supported in this browser.");
    }
  }, []);

  // 🎤 Start Listening
  const startListening = () => {
    console.log("🎤 Starting to listen...");
    SpeechRecognition.startListening({ continuous: true, interimResults: true }).catch((error) => {
      console.error("❌ Error starting speech recognition:", error);
    });
    setIsListening(true);
    initAudioVisualizer();
  };

  // 🛑 Stop Listening
  const stopListening = () => {
    console.log("🛑 Stopping listening...");
    SpeechRecognition.stopListening().catch((error) => {
      console.error("❌ Error stopping speech recognition:", error);
    });
    setIsListening(false);
    stopAudioVisualizer();
  };

  // 🎵 Initialize Audio Visualizer
  const initAudioVisualizer = () => {
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 32;
      visualizeAudio();
    });
  };

  // ❌ Stop Audio Visualizer
  const stopAudioVisualizer = () => {
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
  };

  // 📊 Visualize Audio
  const visualizeAudio = () => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    const updateBars = () => {
      analyserRef.current.getByteFrequencyData(dataArray);
      const newHeights = dataArray.slice(0, 4).map((value) => (value / 256) * 100);
      setBarsHeight(newHeights);
      requestAnimationFrame(updateBars);
    };
    updateBars();
  };

  // 🛑 Stop Everything (Listening, Speaking, and Visualizer)
  const stopAll = () => {
    console.log("🛑 Stopping all processes...");

    // Stop listening to the user
    SpeechRecognition.stopListening().catch((error) => {
      console.error("❌ Error stopping speech recognition:", error);
    });

    // Stop audio visualizer
    stopAudioVisualizer();

    // Stop AI speech if speaking
    const synth = window.speechSynthesis;
    if (synth.speaking) {
      synth.cancel(); // Stop ongoing speech
      console.log("🛑 Speech synthesis stopped.");
    }

    setIsListening(false); // Reset listening state
  };

  // 🌍 Fetch Response from Gemini API
  const fetchFromGemini = async (query) => {
    try {
      console.log("🚀 Sending request to Gemini API...");
      const res = await axios.post(
        GEMINI_API_URL,
        { contents: [{ parts: [{ text: query }] }] },
        { headers: { "Content-Type": "application/json" } }
      );

      console.log("✅ API Response:", res.data);
      const content = res.data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

      if (content) {
        const formattedResponse = formatResponse(content); // 🎯 Format content
        setResponseList((prev) => [...prev, { question: query, answer: formattedResponse }]);
        speakResponse(content); // Speak plain text
      } else {
        speakResponse("Sorry, I couldn’t generate a suitable response.");
      }
    } catch (error) {
      console.error("❌ Error fetching from Gemini:", error);
      speakResponse("Sorry, I couldn’t get the information right now.");
    }
  };

  // 🎨 Format AI Response to Match Gemini Style
  const formatResponse = (content) => {
    const lines = content.split("\n");

    return (
      <div>
        {lines.map((line, index) => {
          // ✅ Handle Bullet Points
          if (line.startsWith("* ") || line.startsWith("- ")) {
            return (
              <ul key={index}>
                <li>{line.replace(/^\* |^- /, "").trim()}</li>
              </ul>
            );
          }
          // ✅ Handle Code Blocks
          else if (line.startsWith("```")) {
            const codeBlock = lines.slice(index + 1, lines.indexOf("```", index + 1)).join("\n");
            return (
              <pre key={index}>
                <code>{codeBlock}</code>
              </pre>
            );
          }
          // ✅ Handle Headings
          else if (line.startsWith("# ")) {
            return <h1 key={index}>{line.replace("# ", "").trim()}</h1>;
          } else if (line.startsWith("## ")) {
            return <h2 key={index}>{line.replace("## ", "").trim()}</h2>;
          } else if (line.startsWith("### ")) {
            return <h3 key={index}>{line.replace("### ", "").trim()}</h3>;
          }
          // ✅ Handle Paragraphs
          else if (line.trim() !== "") {
            return <p key={index}>{line.trim()}</p>;
          }
          return null;
        })}
      </div>
    );
  };

  // 🗣️ Speak Response
  const speakResponse = (text) => {
    const synth = window.speechSynthesis;
    if (synth.speaking) {
      synth.cancel(); // Stop previous speech if ongoing
    }

    const plainText = text
      .replace(/<\/?[^>]+(>|$)/g, "") // Remove HTML tags
      .replace(/\n/g, " "); // Replace newlines with space

    const utterance = new SpeechSynthesisUtterance(plainText);
    synth.speak(utterance);
  };

  // 🎙️ Handle Transcript Change
  useEffect(() => {
    if (transcript) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        console.log("🎧 Processing transcript:", transcript);
        fetchFromGemini(transcript);
        resetTranscript();
      }, 1500);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [transcript]);

  // 🚨 Catch Errors Globally
  window.onerror = function (message, source, lineno, colno, error) {
    console.error(`❌ Error: ${message} at ${source}:${lineno}:${colno}`);
    if (error) console.error("Stack trace:", error.stack);
  };

  return (
    <>
      <h1>AI-Learning Assistant</h1>
      <div className="container">
        {/* 🎵 Left Section - Visualizer */}
        <div className="visualizer">
          <h1 className="label1">Echo Learn</h1>
          <div className="speech-box">{transcript || "Say something..."}</div>
          <button onClick={isListening ? stopAll : startListening} className="start-btn">
            {isListening ? "Stop" : "Start"}
          </button>
        </div>

        {/* 🤖 Right Section - AI Chat */}
        <div className="chat-section">
          <h1 className="label2">How Can I help you?</h1>
          {responseList.map((item, index) => (
            <div key={index} className="chat-item">
              <div className="user-msg">{item.question}</div>
              <div className="ai-response">{item.answer}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default VoiceAssistant;
