import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { animate } from "animejs";
import {
  ArrowUpRight,
  Bot,
  BookOpen,
  BriefcaseBusiness,
  Camera,
  Code2,
  Compass,
  Globe2,
  Layers3,
  Menu,
  MessageCircle,
  Moon,
  Network,
  Route,
  Send,
  Settings2,
  Sun,
  Terminal,
  Trash2,
  Wifi,
  X,
  Zap,
} from "lucide-react";
import profilePhoto from "../assets/my/my.webp";
import calistungScreenshot from "../assets/projects/ayo-belajar-beranda.webp";
import {
  applyTheme,
  getInitialTheme,
  getSavedTheme,
  getSystemTheme,
  getSystemThemeMedia,
  saveTheme,
} from "./theme.js";

const navItems = [
  { id: "project", label: "Project" },
  { id: "tentang", label: "Tentang" },
  { id: "skill", label: "Skill" },
  { id: "contact", label: "Kontak" },
];

const personaStorageKey = "khazul-ai-assistant-persona";
const conversationStorageKey = "khazul-ai-assistant-conversations";

const personaOptions = [
  { id: "ayah", label: "Ayah" },
  { id: "ibu", label: "Ibu" },
  { id: "pacar", label: "Pacar", needsGender: true },
  { id: "teman", label: "Teman", needsGender: true },
];

const genderOptions = [
  { id: "pria", label: "Pria" },
  { id: "wanita", label: "Wanita" },
];

const personaPrompts = {
  ayah: `Kamu adalah sosok ayah yang hangat, sabar, suportif, dan peduli.
Panggil pengguna dengan "Nak".
Gunakan gaya bicara seperti ayah kepada anak.
Jangan gunakan kata "gw", "gue", "lo", atau "bro".`,
  ibu: `Kamu adalah sosok ibu yang lembut, perhatian, dan penyayang.
Panggil pengguna dengan "Nak".
Gunakan gaya bicara seperti ibu kepada anak.
Jangan gunakan kata "gw", "gue", "lo", atau "bro".`,
  pacar_pria: `Kamu adalah pacar laki-laki yang perhatian, hangat, romantis, dan suportif.
Panggil pengguna dengan "Sayang", "Syg", "Cintaku", atau "Beb".
Gunakan bahasa natural seperti pasangan chat sehari-hari.
Boleh memakai singkatan chat.
Jangan berlebihan atau cringe.`,
  pacar_wanita: `Kamu adalah pacar perempuan yang manis, perhatian, hangat, dan suportif.
Panggil pengguna dengan "Sayang", "Syg", "Cintaku", atau "Beb".
Gunakan bahasa natural seperti pasangan chat sehari-hari.
Boleh memakai singkatan chat natural.`,
  teman_pria: `Kamu adalah teman cowok dekat.
Gunakan bahasa santai sehari-hari.
Gunakan gaya "gw" dan "lo" secara natural.
Tetap ramah dan suportif.`,
  teman_wanita: `Kamu adalah teman cewek dekat.
Gunakan bahasa santai sehari-hari.
Boleh menggunakan "gw" dan "lo" secara natural.
Tetap ramah dan suportif.`,
};

const journey = [
  {
    label: "TKJ",
    icon: Network,
    title: "SMK Teknik Komputer dan Jaringan",
    body: "Dasar komputer, jaringan, dan troubleshooting mulai terbentuk dari jurusan TKJ.",
  },
  {
    label: "Kerja",
    icon: BriefcaseBusiness,
    title: "Bekerja di luar bidang teknologi",
    body: "Setelah tamat SMK, saya tidak langsung melanjutkan pendidikan IT atau bekerja formal di teknologi karena kondisi pendidikan dan biaya.",
  },
  {
    label: "Mandiri",
    icon: Route,
    title: "Belajar mandiri sambil bekerja",
    body: "Saat ini saya bekerja sebagai sopir, namun tetap menyisihkan waktu untuk belajar coding, mencoba ide, dan membangun project sendiri.",
  },
  {
    label: "Project",
    icon: Bot,
    title: "Membangun Haruchan Warming",
    body: "Project ini menjadi ruang praktik untuk automation, integrasi bot, API key, AI persona, media, dan workflow Telegram/WhatsApp.",
  },
  {
    label: "Aplikasi edukasi",
    icon: BookOpen,
    title: "Menyelesaikan Ayo Belajar Calistung",
    body: "Membangun aplikasi Android untuk menemani anak belajar membaca, menulis, dan berhitung melalui permainan berbahasa Indonesia.",
  },
];

const calistungFeatures = [
  "Membaca, menulis & berhitung",
  "Mengenal huruf, angka & hewan",
  "Panduan suara Indonesia",
  "Permainan & audio offline",
  "Progres belajar di perangkat",
  "Area orang tua",
];

const skills = [
  {
    name: "Python",
    group: "Programming",
    icon: Terminal,
    note: "Automation & scripting",
  },
  {
    name: "JavaScript",
    group: "Programming",
    icon: Code2,
    note: "Logic & web behavior",
  },
  {
    name: "HTML",
    group: "Frontend",
    icon: Layers3,
    note: "Structure",
  },
  {
    name: "CSS",
    group: "Frontend",
    icon: Layers3,
    note: "Layout & styling",
  },
  {
    name: "Bootstrap",
    group: "Frontend",
    icon: Compass,
    note: "Fast UI build",
  },
  {
    name: "Tailwind",
    group: "Frontend",
    icon: Zap,
    note: "Utility-first styling",
  },
  {
    name: "Basic Networking / TKJ",
    group: "Networking",
    icon: Wifi,
    note: "Network basics",
  },
];

const skillGroups = ["Programming", "Frontend", "Networking"];

const projectFeatures = [
  "Telegram/WhatsApp automation",
  "Pair warming dan group warming",
  "AI persona dan voice note",
  "Auto status/bio",
  "Random media",
  "API key",
];

const socialLinks = [
  { name: "GitHub", href: "https://www.github.com/khazulys", icon: Code2 },
  {
    name: "Second GitHub",
    href: "https://www.github.com/khazuly",
    icon: Code2,
  },
  {
    name: "Instagram",
    href: "https://www.instagram.com/khazulys",
    icon: Camera,
  },
  {
    name: "Threads",
    href: "https://www.threads.com/@khazulys",
    icon: MessageCircle,
  },
  {
    name: "Facebook",
    href: "https://www.facebook.com/khazul.yussery.2025",
    icon: Globe2,
  },
  {
    name: "Fanspage",
    href: "https://www.facebook.com/python.codeer",
    icon: Globe2,
  },
  { name: "Telegram", href: "https://t.me/khazulyss", icon: Send },
  {
    name: "Quora",
    href: "https://id.quora.com/profile/Khazul-Yussery",
    icon: MessageCircle,
  },
];

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function personaNeedsGender(type) {
  return type === "pacar" || type === "teman";
}

function normalizePersona(persona) {
  if (!persona || typeof persona !== "object") return null;

  const type = typeof persona.type === "string" ? persona.type : "";
  const gender = typeof persona.gender === "string" ? persona.gender : "";
  const isKnownType = personaOptions.some((option) => option.id === type);
  const isKnownGender = genderOptions.some((option) => option.id === gender);

  if (!isKnownType) return null;
  if (personaNeedsGender(type) && !isKnownGender) return null;

  return {
    type,
    gender: personaNeedsGender(type) ? gender : "",
  };
}

function isPersonaComplete(persona) {
  return Boolean(normalizePersona(persona));
}

function getPersonaKey(persona) {
  const normalized = normalizePersona(persona);
  if (!normalized) return "";

  return normalized.gender
    ? `${normalized.type}_${normalized.gender}`
    : normalized.type;
}

function getPersonaLabel(persona) {
  const normalized = normalizePersona(persona);
  if (!normalized) return "Pilih persona";

  const typeLabel =
    personaOptions.find((option) => option.id === normalized.type)?.label ||
    "Persona";
  const genderLabel = normalized.gender
    ? genderOptions.find((option) => option.id === normalized.gender)?.label ||
      ""
    : "";

  return [typeLabel, genderLabel].filter(Boolean).join(" ");
}

function buildPersonaSystemPrompt(persona) {
  const key = getPersonaKey(persona);
  const prompt = personaPrompts[key];

  return prompt || "";
}

function loadStoredPersona() {
  if (typeof window === "undefined") return null;

  try {
    const stored = window.localStorage.getItem(personaStorageKey);
    return normalizePersona(stored ? JSON.parse(stored) : null);
  } catch {
    return null;
  }
}

function saveStoredPersona(persona) {
  if (typeof window === "undefined") return;

  const normalized = normalizePersona(persona);

  if (!normalized) {
    window.localStorage.removeItem(personaStorageKey);
    return;
  }

  window.localStorage.setItem(personaStorageKey, JSON.stringify(normalized));
}

function randomId() {
  if (typeof window !== "undefined" && window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function createConversationId(persona) {
  const personaKey = getPersonaKey(persona) || "default";

  return `portfolio:${personaKey}:${randomId()}`.slice(0, 120);
}

function loadConversationMap() {
  if (typeof window === "undefined") return {};

  try {
    const stored = window.localStorage.getItem(conversationStorageKey);
    const parsed = stored ? JSON.parse(stored) : {};

    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveConversationMap(map) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(conversationStorageKey, JSON.stringify(map));
}

function getStoredConversationId(persona) {
  const personaKey = getPersonaKey(persona) || "default";
  const map = loadConversationMap();
  const stored = typeof map[personaKey] === "string" ? map[personaKey] : "";

  if (stored) return stored;

  const conversationId = createConversationId(persona);
  saveConversationMap({ ...map, [personaKey]: conversationId });

  return conversationId;
}

function resetStoredConversationId(persona) {
  const personaKey = getPersonaKey(persona) || "default";
  const map = loadConversationMap();
  const conversationId = createConversationId(persona);

  saveConversationMap({ ...map, [personaKey]: conversationId });

  return conversationId;
}

function extractAssistantText(data) {
  if (typeof data === "string") return data;
  if (!data || typeof data !== "object") return "";

  const directKeys = [
    "reply",
    "response",
    "message",
    "answer",
    "text",
    "content",
    "result",
  ];
  for (const key of directKeys) {
    if (typeof data[key] === "string") return data[key];
  }

  if (data.data) {
    const nested = extractAssistantText(data.data);
    if (nested) return nested;
  }

  const choice = data.choices?.[0];
  if (choice?.message?.content) return choice.message.content;
  if (choice?.text) return choice.text;

  return "";
}

function renderInlineMarkdown(text, keyPrefix) {
  const parts = [];
  const pattern = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match;
  let index = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];
    const key = `${keyPrefix}-${index}`;

    if (token.startsWith("`")) {
      parts.push(<code key={key}>{token.slice(1, -1)}</code>);
    } else if (token.startsWith("**")) {
      parts.push(<strong key={key}>{token.slice(2, -2)}</strong>);
    } else {
      parts.push(<em key={key}>{token.slice(1, -1)}</em>);
    }

    lastIndex = pattern.lastIndex;
    index += 1;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

function MarkdownContent({ content }) {
  const lines = content.split(/\r?\n/);
  const blocks = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (!line.trim()) {
      index += 1;
      continue;
    }

    if (line.trim().startsWith("```")) {
      const language = line.trim().slice(3).trim();
      const codeLines = [];
      index += 1;

      while (index < lines.length && !lines[index].trim().startsWith("```")) {
        codeLines.push(lines[index]);
        index += 1;
      }

      index += 1;
      blocks.push(
        <pre key={`code-${blocks.length}`}>
          <code data-language={language || undefined}>
            {codeLines.join("\n")}
          </code>
        </pre>,
      );
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      const HeadingTag = `h${heading[1].length + 2}`;
      blocks.push(
        <HeadingTag key={`heading-${blocks.length}`}>
          {renderInlineMarkdown(heading[2], `heading-${blocks.length}`)}
        </HeadingTag>,
      );
      index += 1;
      continue;
    }

    const listMatch = line.match(/^(\s*)([-*]|\d+\.)\s+(.+)$/);
    if (listMatch) {
      const ordered = /\d+\./.test(listMatch[2]);
      const items = [];

      while (index < lines.length) {
        const itemMatch = lines[index].match(/^(\s*)([-*]|\d+\.)\s+(.+)$/);
        if (!itemMatch || /\d+\./.test(itemMatch[2]) !== ordered) break;

        items.push(itemMatch[3]);
        index += 1;
      }

      const ListTag = ordered ? "ol" : "ul";
      blocks.push(
        <ListTag key={`list-${blocks.length}`}>
          {items.map((item, itemIndex) => (
            <li key={`${item}-${itemIndex}`}>
              {renderInlineMarkdown(item, `list-${blocks.length}-${itemIndex}`)}
            </li>
          ))}
        </ListTag>,
      );
      continue;
    }

    const paragraph = [line.trim()];
    index += 1;

    while (
      index < lines.length &&
      lines[index].trim() &&
      !lines[index].trim().startsWith("```") &&
      !/^(#{1,3})\s+/.test(lines[index]) &&
      !/^(\s*)([-*]|\d+\.)\s+/.test(lines[index])
    ) {
      paragraph.push(lines[index].trim());
      index += 1;
    }

    blocks.push(
      <p key={`paragraph-${blocks.length}`}>
        {renderInlineMarkdown(
          paragraph.join(" "),
          `paragraph-${blocks.length}`,
        )}
      </p>,
    );
  }

  return <div className="ai-markdown">{blocks}</div>;
}

function App() {
  const [theme, setTheme] = useState(getInitialTheme);
  const [hasManualTheme, setHasManualTheme] = useState(() =>
    Boolean(getSavedTheme()),
  );
  const [activeSection, setActiveSection] = useState("");
  const mainRef = useRef(null);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);
  useEffect(() => {
    if (hasManualTheme) return;
    const media = getSystemThemeMedia();
    if (!media) return;
    const sync = () => setTheme(getSystemTheme());
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, [hasManualTheme]);

  useEffect(() => {
    const root = mainRef.current;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const animations = new Set();
    const reveal = new IntersectionObserver(
      (entries) => {
        entries.forEach(({ target, isIntersecting }) => {
          if (!isIntersecting) return;
          reveal.unobserve(target);
          if (media.matches) return;
          const animation = animate(target, {
            opacity: [0, 1],
            translateY: [18, 0],
            duration: 520,
            delay: Number(target.dataset.delay || 0),
            ease: "out(3)",
            onComplete: () => animations.delete(animation),
          });
          animations.add(animation);
        });
      },
      { threshold: 0.08 },
    );
    root.querySelectorAll(".reveal").forEach((el) => reveal.observe(el));
    const showAll = () => {
      if (!media.matches) return;
      animations.forEach((a) => a.complete());
      animations.clear();
      reveal.disconnect();
    };
    media.addEventListener("change", showAll);
    const updateActive = () => {
      let current = "";
      navItems.forEach(({ id }) => {
        const rect = document.getElementById(id)?.getBoundingClientRect();
        if (rect && rect.top <= window.innerHeight * 0.4) current = id;
      });
      if (
        window.scrollY + window.innerHeight >=
        document.documentElement.scrollHeight - 4
      )
        current = "contact";
      setActiveSection(current);
    };
    updateActive();
    window.addEventListener("scroll", updateActive, { passive: true });
    return () => {
      reveal.disconnect();
      animations.forEach((a) => a.revert());
      media.removeEventListener("change", showAll);
      window.removeEventListener("scroll", updateActive);
    };
  }, []);

  const toggleTheme = () => {
    setHasManualTheme(true);
    setTheme((current) => {
      const next = current === "dark" ? "light" : "dark";
      saveTheme(next);
      return next;
    });
  };
  return (
    <div className="portfolio">
      <a className="skip-link" href="#main">
        Langsung ke konten
      </a>
      <Header
        theme={theme}
        activeSection={activeSection}
        onToggleTheme={toggleTheme}
      />
      <main id="main" ref={mainRef} tabIndex={-1}>
        <Hero />
        <Project />
        <About />
        <Skills />
        <AiSection />
        <Social />
        <Contact />
      </main>
      <AiAssistantChat />
    </div>
  );
}

function AiAssistantChat() {
  const [isMounted, setIsMounted] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [persona, setPersona] = useState(() => loadStoredPersona());
  const [personaDraft, setPersonaDraft] = useState({ type: "", gender: "" });
  const [isPersonaSetupOpen, setIsPersonaSetupOpen] = useState(false);
  const panelRef = useRef(null);
  const launcherRef = useRef(null);
  const textareaRef = useRef(null);
  const messagesEndRef = useRef(null);
  const animationRef = useRef(null);
  const personaRef = useRef(persona);
  const conversationIdRef = useRef(
    persona ? getStoredConversationId(persona) : "",
  );
  const activePersona = useMemo(() => normalizePersona(persona), [persona]);
  const personaLabel = useMemo(
    () => getPersonaLabel(activePersona),
    [activePersona],
  );

  const focusTextarea = useCallback(() => {
    window.requestAnimationFrame(() => {
      textareaRef.current?.focus();
    });
  }, []);

  useEffect(() => {
    personaRef.current = persona;
  }, [persona]);

  const closeChat = useCallback(() => {
    const panel = panelRef.current;

    animationRef.current?.pause?.();

    if (!panel || prefersReducedMotion()) {
      setIsMounted(false);
      requestAnimationFrame(() => launcherRef.current?.focus());
      return;
    }

    animationRef.current = animate(panel, {
      scale: [1, 0.98],
      opacity: [1, 0],
      translateY: [0, 15],
      duration: 200,
      ease: "in(2)",
      onComplete: () => {
        setIsMounted(false);
        requestAnimationFrame(() => launcherRef.current?.focus());
      },
    });
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    const id = requestAnimationFrame(() => {
      const target = isPersonaSetupOpen
        ? panelRef.current?.querySelector(".ai-persona-option")
        : textareaRef.current || panelRef.current?.querySelector("button");
      target?.focus();
    });
    return () => cancelAnimationFrame(id);
  }, [isMounted, isPersonaSetupOpen]);

  const openChat = useCallback(() => {
    if (isMounted) {
      focusTextarea();
      return;
    }

    setIsMounted(true);
  }, [focusTextarea, isMounted]);

  useEffect(() => {
    if (!isMounted) return undefined;

    const panel = panelRef.current;
    if (!panel) return undefined;

    animationRef.current?.pause?.();

    if (prefersReducedMotion()) {
      panel.style.opacity = "1";
      panel.style.transform = "none";
      if (isPersonaComplete(personaRef.current)) focusTextarea();
      return undefined;
    }

    panel.style.transformOrigin = "right bottom";
    animationRef.current = animate(panel, {
      scale: [0.98, 1],
      opacity: [0, 1],
      translateY: [15, 0],
      duration: 260,
      ease: "out(3)",
      onComplete: () => {
        if (isPersonaComplete(personaRef.current)) focusTextarea();
      },
    });

    return () => {
      animationRef.current?.pause?.();
    };
  }, [focusTextarea, isMounted]);

  useEffect(() => {
    if (!isMounted) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") closeChat();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeChat, isMounted]);

  useEffect(() => {
    if (!isMounted || activePersona) return;

    setPersonaDraft({ type: "", gender: "" });
    setIsPersonaSetupOpen(true);
  }, [activePersona, isMounted]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 140)}px`;
  }, [input, isMounted]);

  useEffect(() => {
    if (!isMounted) return;

    messagesEndRef.current?.scrollIntoView({ block: "end" });
  }, [isMounted, isSending, messages]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setInput("");
    if (activePersona) {
      conversationIdRef.current = resetStoredConversationId(activePersona);
    }
    focusTextarea();
  }, [activePersona, focusTextarea]);

  const openPersonaSetup = useCallback(() => {
    setPersonaDraft(activePersona || { type: "", gender: "" });
    setIsPersonaSetupOpen(true);
  }, [activePersona]);

  const applyPersona = useCallback(
    (nextPersona) => {
      const normalized = normalizePersona(nextPersona);
      if (!normalized) return;

      setPersona(normalized);
      setPersonaDraft(normalized);
      saveStoredPersona(normalized);
      if (getPersonaKey(personaRef.current) !== getPersonaKey(normalized)) {
        conversationIdRef.current = resetStoredConversationId(normalized);
        setMessages([]);
        setInput("");
      }
      setIsPersonaSetupOpen(false);
      focusTextarea();
    },
    [focusTextarea],
  );

  const selectPersonaType = useCallback(
    (type) => {
      if (!personaNeedsGender(type)) {
        applyPersona({ type, gender: "" });
        return;
      }

      setPersonaDraft((current) => ({
        type,
        gender: current.type === type ? current.gender : "",
      }));
    },
    [applyPersona],
  );

  const selectPersonaGender = useCallback(
    (gender) => {
      if (!personaNeedsGender(personaDraft.type)) return;
      applyPersona({ type: personaDraft.type, gender });
    },
    [applyPersona, personaDraft.type],
  );

  const closePersonaSetup = useCallback(() => {
    if (!activePersona) return;

    setPersonaDraft(activePersona);
    setIsPersonaSetupOpen(false);
    focusTextarea();
  }, [activePersona, focusTextarea]);

  const sendMessage = useCallback(async () => {
    const userMessage = input.trim();
    if (!userMessage || isSending) return;

    const currentPersona = normalizePersona(persona);

    if (!currentPersona) {
      setPersonaDraft({ type: "", gender: "" });
      setIsPersonaSetupOpen(true);
      return;
    }

    const userEntry = {
      id: `user-${Date.now()}`,
      role: "user",
      content: userMessage,
    };
    const conversationId =
      conversationIdRef.current || getStoredConversationId(currentPersona);
    const outgoingHistory = [...messages, userEntry]
      .slice(-16)
      .map((messageEntry) => ({
        role: messageEntry.role,
        content: messageEntry.content,
      }));

    setMessages((current) => [...current, userEntry]);
    setInput("");
    setIsSending(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversation_id: conversationId,
          message: userMessage,
          history: outgoingHistory,
          systemPrompt: buildPersonaSystemPrompt(currentPersona),
          persona: {
            ...currentPersona,
            label: getPersonaLabel(currentPersona),
          },
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.error || "AI Assistant sedang tidak bisa merespons.",
        );
      }

      const assistantText = extractAssistantText(data);

      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content:
            assistantText ||
            "Maaf, saya belum menerima jawaban yang bisa ditampilkan.",
        },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: `assistant-error-${Date.now()}`,
          role: "assistant",
          isError: true,
          content:
            error.message ||
            "Maaf, AI Assistant sedang bermasalah. Coba lagi sebentar lagi.",
        },
      ]);
    } finally {
      setIsSending(false);
      focusTextarea();
    }
  }, [focusTextarea, input, isSending, messages, persona]);

  const handleSubmit = (event) => {
    event.preventDefault();
    sendMessage();
  };

  const handleInputKeyDown = (event) => {
    if (
      event.key !== "Enter" ||
      event.shiftKey ||
      event.nativeEvent.isComposing
    )
      return;

    event.preventDefault();
    sendMessage();
  };

  return (
    <>
      <button
        type="button"
        ref={launcherRef}
        className={`chat-fab ${isMounted ? "is-hidden" : ""}`}
        onClick={isMounted ? closeChat : openChat}
        aria-label={isMounted ? "Tutup AI Assistant" : "Buka AI Assistant"}
        aria-expanded={isMounted}
        aria-hidden={isMounted}
        tabIndex={isMounted ? -1 : 0}
        title="AI Assistant"
      >
        <MessageCircle size={23} strokeWidth={2.4} />
      </button>

      {isMounted ? (
        <section
          ref={panelRef}
          className="ai-chat-window"
          role="dialog"
          aria-modal="false"
          aria-labelledby="ai-chat-title"
        >
          <header className="ai-chat-header">
            <div className="ai-chat-title">
              <span className="ai-chat-title-icon">
                <Bot size={19} />
              </span>
              <span className="ai-chat-title-copy">
                <span id="ai-chat-title">AI Assistant</span>
                <span className="ai-chat-persona-label">{personaLabel}</span>
              </span>
            </div>
            <div className="ai-chat-actions">
              <button
                type="button"
                className="ai-chat-icon-button"
                onClick={openPersonaSetup}
                disabled={isSending}
                aria-label="Pengaturan persona"
                title="Pengaturan persona"
              >
                <Settings2 size={17} />
              </button>
              <button
                type="button"
                className="ai-chat-icon-button ai-chat-clear-icon"
                onClick={clearChat}
                disabled={isSending || (messages.length === 0 && !input)}
                aria-label="Hapus percakapan"
                title="Hapus percakapan"
              >
                <Trash2 size={17} />
              </button>
              <button
                type="button"
                className="ai-chat-icon-button"
                onClick={closeChat}
                aria-label="Tutup chat"
                title="Tutup"
              >
                <X size={18} />
              </button>
            </div>
          </header>

          {isPersonaSetupOpen ? (
            <PersonaSetup
              draft={personaDraft}
              hasActivePersona={Boolean(activePersona)}
              onCancel={closePersonaSetup}
              onSelectGender={selectPersonaGender}
              onSelectType={selectPersonaType}
            />
          ) : (
            <>
              <div className="ai-chat-messages" aria-live="polite">
                {messages.length === 0 ? (
                  <div className="ai-chat-empty">
                    <Bot size={28} aria-hidden="true" />
                    <h3>Ada yang ingin diceritakan?</h3>
                    <p>Mulai obrolan dengan persona pilihanmu.</p>
                  </div>
                ) : null}

                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`ai-chat-row ${message.role === "user" ? "is-user" : "is-ai"}`}
                  >
                    <div
                      className={`ai-chat-bubble ${message.isError ? "is-error" : ""}`}
                    >
                      {message.role === "assistant" ? (
                        <MarkdownContent content={message.content} />
                      ) : (
                        <p>{message.content}</p>
                      )}
                    </div>
                  </div>
                ))}

                {isSending ? (
                  <div className="ai-chat-row is-ai">
                    <div
                      className="ai-chat-bubble ai-typing-bubble"
                      role="status"
                      aria-label="AI Assistant sedang mengetik"
                    >
                      <span className="ai-typing-dot" />
                      <span className="ai-typing-dot" />
                      <span className="ai-typing-dot" />
                    </div>
                  </div>
                ) : null}

                <div ref={messagesEndRef} />
              </div>

              <footer className="ai-chat-footer">
                <form className="ai-chat-form" onSubmit={handleSubmit}>
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={handleInputKeyDown}
                    rows={1}
                    placeholder="Tulis pesan..."
                    aria-label="Tulis pesan untuk AI Assistant"
                    disabled={isSending}
                  />
                  <button
                    type="submit"
                    className="ai-chat-send"
                    disabled={!input.trim() || isSending}
                    aria-label="Kirim pesan"
                  >
                    <Send size={18} />
                  </button>
                </form>
              </footer>
            </>
          )}
        </section>
      ) : null}
    </>
  );
}

function PersonaSetup({
  draft,
  hasActivePersona,
  onCancel,
  onSelectGender,
  onSelectType,
}) {
  const selectedOption = personaOptions.find(
    (option) => option.id === draft.type,
  );
  const needsGender = Boolean(selectedOption?.needsGender);

  return (
    <div
      className="ai-persona-screen"
      role="group"
      aria-labelledby="ai-persona-title"
    >
      <div className="ai-persona-panel">
        <div className="ai-persona-heading">
          <span className="ai-persona-kicker">Setup Persona</span>
          <h3 id="ai-persona-title">Pilih gaya ngobrol</h3>
          <p>
            Persona ini akan dipakai untuk semua pesan berikutnya sampai kamu
            menggantinya lagi.
          </p>
        </div>

        <div className="ai-persona-options" aria-label="Pilihan persona">
          {personaOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`ai-persona-option ${draft.type === option.id ? "is-active" : ""}`}
              onClick={() => onSelectType(option.id)}
            >
              <span>{option.label}</span>
              {option.needsGender ? (
                <small>Pilih gender</small>
              ) : (
                <small>Langsung aktif</small>
              )}
            </button>
          ))}
        </div>

        {needsGender ? (
          <div className="ai-persona-gender">
            <p>Pilih gender untuk persona {selectedOption.label}.</p>
            <div
              className="ai-persona-options is-gender"
              aria-label="Pilihan gender persona"
            >
              {genderOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={`ai-persona-option ${draft.gender === option.id ? "is-active" : ""}`}
                  onClick={() => onSelectGender(option.id)}
                >
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {hasActivePersona ? (
          <div className="ai-persona-actions">
            <button
              type="button"
              className="ai-persona-cancel"
              onClick={onCancel}
            >
              Batal
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Header({ theme, activeSection, onToggleTheme }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuButtonRef = useRef(null);
  const headerRef = useRef(null);
  useEffect(() => {
    if (!isOpen) return;
    const close = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    const outside = (event) => {
      if (!headerRef.current?.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener("keydown", close);
    document.addEventListener("pointerdown", outside);
    return () => {
      document.removeEventListener("keydown", close);
      document.removeEventListener("pointerdown", outside);
    };
  }, [isOpen]);
  useEffect(() => {
    const media = window.matchMedia("(min-width: 900px)");
    const resize = () => {
      if (media.matches) setIsOpen(false);
    };
    media.addEventListener("change", resize);
    return () => media.removeEventListener("change", resize);
  }, []);
  const links = navItems.map((item) => (
    <a
      key={item.id}
      href={`#${item.id}`}
      aria-current={activeSection === item.id ? "location" : undefined}
      onClick={() => {
        setIsOpen(false);
        if (isOpen)
          requestAnimationFrame(() =>
            document.getElementById(item.id)?.focus({ preventScroll: true }),
          );
      }}
    >
      {item.label}
    </a>
  ));
  return (
    <header ref={headerRef} className="site-header">
      <nav className="container nav-inner" aria-label="Navigasi utama">
        <a
          className="brand"
          href="#hero"
          onClick={() => setIsOpen(false)}
          aria-label="Khazul Yussery, beranda"
        >
          <span className="brand-mark">
            k<span>y.</span>
          </span>
          <span className="brand-name">Khazul Yussery</span>
        </a>
        <div className="desktop-nav">{links}</div>
        <div className="nav-actions">
          <button
            className="icon-button theme-toggle"
            onClick={onToggleTheme}
            aria-label={
              theme === "dark" ? "Aktifkan light mode" : "Aktifkan dark mode"
            }
          >
            {theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
          </button>
          <a
            className="nav-contact"
            href="https://t.me/khazulyss"
            target="_blank"
            rel="noreferrer"
          >
            Mari terhubung <ArrowUpRight size={15} />
          </a>
          <button
            ref={menuButtonRef}
            className="icon-button menu-toggle"
            aria-label={isOpen ? "Tutup menu" : "Buka menu"}
            aria-expanded={isOpen}
            aria-controls="mobile-nav"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </nav>
      <nav
        id="mobile-nav"
        className="mobile-nav container"
        aria-label="Navigasi mobile"
        hidden={!isOpen}
      >
        {links}
      </nav>
    </header>
  );
}

function Hero() {
  return (
    <section id="hero" className="hero container" tabIndex={-1}>
      <div className="hero-copy reveal">
        <p className="eyebrow hero-eyebrow">
          <span className="status-dot" /> Belajar. Membangun. Berkembang.
        </p>
        <h1>
          Khazul
          <br />
          <span>
            Yussery<span className="accent">.</span>
          </span>
        </h1>
        <p className="hero-role">Self-taught tech enthusiast</p>
        <p className="hero-description">
          Mengubah rasa ingin tahu menjadi project nyata. Saya belajar dan
          membangun bot, automation, serta pengalaman web secara mandiri.
        </p>
        <div className="button-row">
          <a className="button button-primary" href="#project">
            Lihat Project <ArrowUpRight size={18} />
          </a>
          <a
            className="button button-secondary"
            href="https://t.me/khazulyss"
            target="_blank"
            rel="noreferrer"
          >
            Hubungi Saya <MessageCircle size={17} />
          </a>
        </div>
        <div className="hero-topics">
          <span>Bot & automation</span>
          <span>Web development</span>
          <span>Aplikasi edukasi</span>
        </div>
      </div>
      <div className="hero-visual reveal" data-delay="60">
        <div className="portrait-frame">
          <span className="portrait-label">THE PERSON BEHIND THE PROJECTS</span>
          <img
            src={profilePhoto}
            alt="Khazul Yussery"
            width="1080"
            height="1080"
            fetchPriority="high"
          />
          <div className="portrait-caption">
            <span>Khazul Yussery</span>
            <span>
              Terus belajar, terus mencoba <ArrowUpRight size={15} />
            </span>
          </div>
        </div>
        <div className="portrait-note">
          <span className="note-icon">
            <Code2 size={21} />
          </span>
          <div>
            <strong>Dibangun dari rasa ingin tahu.</strong>
            <span>Satu ide, satu langkah, satu project.</span>
          </div>
        </div>
        <span className="portrait-side">INDEPENDENT LEARNER / BUILDER</span>
      </div>
      <a className="hero-scroll" href="#project">
        <span>Jelajahi karya saya</span>
        <span aria-hidden="true">↓</span>
      </a>
    </section>
  );
}

function Section({
  id,
  number,
  eyebrow,
  title,
  description,
  children,
  className = "",
}) {
  return (
    <section id={id} tabIndex={-1} className={`section ${className}`}>
      <div className="container">
        <div className="section-heading reveal">
          <p className="eyebrow">
            <span className="section-number">{number}</span>
            {eyebrow}
          </p>
          <h2>{title}</h2>
          {description && <p className="section-description">{description}</p>}
        </div>
        {children}
      </div>
    </section>
  );
}

function Project() {
  return (
    <Section
      id="project"
      number="01"
      eyebrow="Project unggulan"
      title={
        <>
          Ide yang menjadi
          <br />
          sesuatu yang nyata.
        </>
      }
      description="Tempat saya menerapkan hal yang dipelajari, menguji ide, dan terus memperbaikinya."
      className="project-section"
    >
      <article className="project-card calistung-card reveal">
        <div className="project-art calistung-art">
          <div className="project-art-top" aria-hidden="true">
            <span>
              <span className="status-dot" /> LEARNING THROUGH PLAY
            </span>
            <span>AB / 01</span>
          </div>
          <div className="calistung-preview">
            <span className="calistung-letter" aria-hidden="true">
              Aa
            </span>
            <div className="calistung-phone">
              <img
                src={calistungScreenshot}
                alt="Beranda Ayo Belajar Calistung dengan pilihan Angka, Huruf & Kata, Menulis, dan Hewan"
                width="390"
                height="844"
                loading="lazy"
              />
            </div>
            <span className="calistung-numbers" aria-hidden="true">
              123
            </span>
          </div>
          <div className="project-art-bottom" aria-hidden="true">
            <span>MAIN. BELAJAR. TUMBUH BERSAMA.</span>
            <BookOpen size={21} />
          </div>
        </div>
        <div className="project-copy">
          <div className="project-meta">
            <span className="pill">Project terbaru</span>
            <span>Android · Edukasi · Calistung</span>
          </div>
          <h3>
            Ayo Belajar Calistung<span className="accent">.</span>
          </h3>
          <p>
            Aplikasi Android untuk menemani anak mengenal huruf dan angka,
            membaca, menulis, serta berhitung melalui permainan. Dilengkapi
            panduan suara berbahasa Indonesia dan latihan yang bisa dimainkan
            offline.
          </p>
          <ul className="feature-list">
            {calistungFeatures.map((feature) => (
              <li key={feature}>
                <span aria-hidden="true">↗</span>
                {feature}
              </li>
            ))}
          </ul>
          <div className="button-row">
            <PrimaryLink
              href="https://ayobelajarapp.vercel.app"
              icon={ArrowUpRight}
            >
              Lihat Website
            </PrimaryLink>
          </div>
        </div>
      </article>
      <article className="project-card reveal">
        <div className="project-art" aria-hidden="true">
          <div className="art-grid" />
          <div className="project-art-top">
            <span>
              <span className="status-dot" /> AUTOMATION WORKSPACE
            </span>
            <span>HW / 02</span>
          </div>
          <div className="workflow">
            <div className="workflow-source">
              <Send size={22} />
              <span>Telegram</span>
            </div>
            <div className="workflow-connector">
              <span />
              <span />
            </div>
            <div className="workflow-core">
              <Bot size={34} strokeWidth={1.4} />
              <span>
                Haruchan<span>Automation, connected.</span>
              </span>
            </div>
            <div className="workflow-branches">
              <span />
              <span />
              <span />
            </div>
            <div className="workflow-outputs">
              <span>
                <MessageCircle size={18} />
                WhatsApp
              </span>
              <span>
                <Zap size={18} />
                Workflow
              </span>
              <span>
                <Bot size={18} />
                AI persona
              </span>
            </div>
          </div>
          <div className="project-art-bottom">
            <span>CONNECT. AUTOMATE. SIMPLIFY.</span>
            <ArrowUpRight size={21} />
          </div>
        </div>
        <div className="project-copy">
          <div className="project-meta">
            <span className="pill">Featured project</span>
            <span>Bot · Automation · AI</span>
          </div>
          <h3>
            Haruchan Warming<span className="accent">.</span>
          </h3>
          <p>
            Automation Telegram dan WhatsApp dalam satu project. Ruang praktik
            saya untuk membangun integrasi bot, mengelola workflow, dan
            mengeksplorasi AI.
          </p>
          <ul className="feature-list">
            {projectFeatures.map((feature) => (
              <li key={feature}>
                <span aria-hidden="true">↗</span>
                {feature}
              </li>
            ))}
          </ul>
          <div className="button-row">
            <PrimaryLink href="https://www.khzlai.web.id" icon={ArrowUpRight}>
              Lihat Website
            </PrimaryLink>
            <a
              className="text-link"
              href="https://t.me/Haruchan_bot"
              target="_blank"
              rel="noreferrer"
            >
              Coba Bot <ArrowUpRight size={16} />
            </a>
            <a
              className="text-link"
              href="https://t.me/haruchan_channel"
              target="_blank"
              rel="noreferrer"
            >
              Channel <ArrowUpRight size={16} />
            </a>
          </div>
        </div>
      </article>
    </Section>
  );
}

function About() {
  return (
    <Section
      id="tentang"
      number="02"
      eyebrow="Tentang & perjalanan"
      title={
        <>
          Jalannya berbeda.
          <br />
          Rasa ingin tahunya sama.
        </>
      }
    >
      <div className="about-layout">
        <div className="about-copy reveal">
          <p className="large-copy">
            Saya percaya kesempatan untuk belajar bisa dimulai dari mana saja.
          </p>
          <p>
            Saya lulusan SMK Teknik Komputer dan Jaringan. Kondisi pendidikan
            dan biaya membawa saya bekerja di luar bidang teknologi; saat ini
            saya bekerja sebagai sopir.
          </p>
          <p>
            Di sela pekerjaan, minat pada teknologi tetap hidup. Saya
            menyisihkan waktu untuk belajar coding, mencoba ide, dan membangun
            project sendiri. Mencoba, gagal, memperbaiki, lalu mencoba lagi.
          </p>
          <div className="about-signature">
            <span className="brand-mark">ky.</span>
            <span>
              Khazul Yussery<small>Selalu ada hal baru untuk dipelajari.</small>
            </span>
          </div>
        </div>
        <div
          id="perjalanan"
          tabIndex={-1}
          className="timeline reveal"
          data-delay="60"
        >
          {journey.map((item, index) => {
            const Icon = item.icon;
            return (
              <article className="timeline-item" key={item.title}>
                <span className="timeline-point">
                  <Icon size={19} />
                </span>
                <div>
                  <span className="timeline-index">
                    0{index + 1} / {item.label}
                  </span>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </Section>
  );
}

function Skills() {
  return (
    <Section
      id="skill"
      number="03"
      eyebrow="Kemampuan"
      title={
        <>
          Peralatan untuk
          <br />
          mewujudkan ide.
        </>
      }
      description="Teknologi yang saya gunakan dan terus pelajari melalui project."
      className="skills-section"
    >
      <div className="skill-grid">
        {skillGroups.map((group, index) => (
          <article
            className="skill-card reveal"
            data-delay={index * 60}
            key={group}
          >
            <div className="skill-card-heading">
              <span className="section-number">0{index + 1}</span>
              <h3>{group}</h3>
              <ArrowUpRight size={18} />
            </div>
            <div className="skill-list">
              {skills
                .filter((skill) => skill.group === group)
                .map((skill) => {
                  const Icon = skill.icon;
                  return (
                    <div className="skill-row" key={skill.name}>
                      <span className="skill-icon">
                        <Icon size={20} />
                      </span>
                      <div>
                        <h4>{skill.name}</h4>
                        <p>{skill.note}</p>
                      </div>
                    </div>
                  );
                })}
            </div>
          </article>
        ))}
      </div>
    </Section>
  );
}

function AiSection() {
  return (
    <Section
      id="ai"
      number="04"
      eyebrow="Pendekatan saya"
      title="Belajar bersama AI. Tetap berpikir mandiri."
    >
      <div className="ai-approach reveal">
        <div className="ai-approach-icon">
          <Bot size={40} strokeWidth={1.3} />
          <span>AI × HUMAN CURIOSITY</span>
        </div>
        <div>
          <h3>Alat bantu untuk melangkah lebih jauh.</h3>
          <p>
            Saya menggunakan AI untuk mempercepat belajar, eksperimen,
            debugging, dan development. Alur, logika, struktur, serta keputusan
            teknis tetap perlu saya pahami dan uji sendiri.
          </p>
          <div className="approach-tags">
            <span>Eksplorasi</span>
            <span>Pemahaman</span>
            <span>Pengujian</span>
          </div>
        </div>
      </div>
    </Section>
  );
}

function Social() {
  return (
    <Section
      id="social"
      number="05"
      eyebrow="Di tempat lain"
      title="Tetap terhubung."
      description="Catatan, project, dan percakapan berlanjut di sini."
    >
      <div className="social-grid">
        {socialLinks.map((link) => {
          const Icon = link.icon;
          return (
            <a
              className="social-link reveal"
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noreferrer"
            >
              <span className="social-icon">
                <Icon size={20} />
              </span>
              <span>{link.name}</span>
              <ArrowUpRight size={17} />
            </a>
          );
        })}
      </div>
    </Section>
  );
}

function Contact() {
  return (
    <section id="contact" tabIndex={-1} className="contact-section container">
      <div className="contact-card reveal">
        <div className="contact-decoration" aria-hidden="true">
          ↗
        </div>
        <p className="eyebrow">
          <span className="status-dot" /> Mari mulai percakapan
        </p>
        <h2>
          Punya ide?
          <br />
          Mari kita bicarakan<span>.</span>
        </h2>
        <p>
          Terbuka untuk ngobrol tentang project, bot, automation, atau hal
          menarik seputar teknologi.
        </p>
        <div className="button-row">
          <PrimaryLink href="https://t.me/khazulyss" icon={Send}>
            Hubungi Telegram
          </PrimaryLink>
          <a
            className="contact-github"
            href="https://www.github.com/khazulys"
            target="_blank"
            rel="noreferrer"
          >
            Jelajahi GitHub <ArrowUpRight size={17} />
          </a>
        </div>
      </div>
      <footer className="site-footer">
        <a href="#hero" className="brand">
          <span className="brand-mark">ky.</span>
          <span>Khazul Yussery</span>
        </a>
        <p>Dibangun dengan rasa ingin tahu.</p>
        <a className="text-link" href="#hero">
          Kembali ke atas <span aria-hidden="true">↑</span>
        </a>
      </footer>
    </section>
  );
}

function PrimaryLink({ href, icon: Icon, children }) {
  return (
    <a
      className="button button-primary"
      href={href}
      target="_blank"
      rel="noreferrer"
    >
      {children}
      <Icon size={18} />
    </a>
  );
}

export default App;
