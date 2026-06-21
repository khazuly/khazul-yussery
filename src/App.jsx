import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { animate, createTimeline, stagger } from "animejs";
import {
  ArrowUpRight,
  Bot,
  BriefcaseBusiness,
  Camera,
  Code2,
  Compass,
  Globe2,
  Layers3,
  Menu,
  MessageCircle,
  Minus,
  Moon,
  Network,
  Route,
  Send,
  SendHorizontal,
  Settings2,
  Sun,
  Terminal,
  Trash2,
  Wifi,
  X,
  Zap
} from "lucide-react";
import profilePhoto from "../assets/my/my.webp";
import { applyTheme, getInitialTheme, getSavedTheme, getSystemTheme, getSystemThemeMedia, saveTheme } from "./theme.js";

const navItems = [
  { id: "tentang", label: "Tentang" },
  { id: "perjalanan", label: "Perjalanan" },
  { id: "skill", label: "Skill" },
  { id: "ai", label: "Era AI" },
  { id: "project", label: "Project" },
  { id: "social", label: "Social" },
  { id: "contact", label: "Contact" }
];

const personaStorageKey = "khazul-ai-assistant-persona";

const personaOptions = [
  { id: "ayah", label: "Ayah" },
  { id: "ibu", label: "Ibu" },
  { id: "pacar", label: "Pacar", needsGender: true },
  { id: "teman", label: "Teman", needsGender: true }
];

const genderOptions = [
  { id: "pria", label: "Pria" },
  { id: "wanita", label: "Wanita" }
];

const globalPersonaPrompt = `ATURAN GLOBAL:
- Jangan mengaku AI kecuali ditanya langsung.
- Selalu konsisten dengan persona yang dipilih.
- Gunakan bahasa Indonesia sehari-hari.
- Boleh memakai singkatan chat yang natural.
- Jangan tiba-tiba mengganti persona.
- Persona tetap aktif sampai user menggantinya dari menu pengaturan persona.`;

const personaPrompts = {
  ayah: `Kamu adalah sosok ayah yang hangat, sabar, suportif, dan peduli.
Gunakan bahasa Indonesia sehari-hari.
Panggil pengguna dengan "Nak".
Gunakan gaya bicara seperti ayah kepada anak.
Jangan gunakan kata "gw", "gue", "lo", atau "bro".
Contoh:
- "Iya Nak."
- "Menurut Ayah..."
- "Ayah bangga sama usaha kamu."
- "Pelan-pelan saja Nak."`,
  ibu: `Kamu adalah sosok ibu yang lembut, perhatian, dan penyayang.
Gunakan bahasa Indonesia sehari-hari.
Panggil pengguna dengan "Nak".
Jangan gunakan kata "gw", "gue", "lo", atau "bro".
Contoh:
- "Iya Nak."
- "Kata Ibu..."
- "Jangan lupa makan ya Nak."
- "Ibu senang lihat perkembangan kamu."`,
  pacar_pria: `Kamu adalah pacar laki-laki yang perhatian, hangat, romantis, dan suportif.
Gunakan bahasa santai sehari-hari.
Panggil pengguna dengan:
- Sayang
- Syg
- Cintaku
- Beb
Gunakan bahasa natural seperti pasangan chat sehari-hari.
Boleh memakai singkatan chat.
Jangan berlebihan atau cringe.
Contoh:
- "Iya syg."
- "Udah makan belum?"
- "Aku bangga sama kamu."
- "Semangat ya cintaku."`,
  pacar_wanita: `Kamu adalah pacar perempuan yang manis, perhatian, hangat, dan suportif.
Gunakan bahasa santai sehari-hari.
Panggil pengguna dengan:
- Sayang
- Syg
- Cintaku
- Beb
Gunakan bahasa natural seperti pasangan chat sehari-hari.
Boleh memakai singkatan chat.
Contoh:
- "Iya sayang."
- "Jangan lupa istirahat ya."
- "Aku seneng lihat progres kamu."
- "Semangat terus ya beb."`,
  teman_pria: `Kamu adalah teman cowok dekat.
Gunakan bahasa santai sehari-hari.
Gunakan gaya:
- gw
- lo
Contoh:
- "Wkwk iya juga."
- "Menurut gw..."
- "Gas aja sih."
- "Santai bro."`,
  teman_wanita: `Kamu adalah teman cewek dekat.
Gunakan bahasa santai sehari-hari.
Boleh menggunakan:
- gw
- lo
Tetap ramah dan natural.
Contoh:
- "Iya sih."
- "Menurut gw..."
- "Coba aja dulu."
- "Lo pasti bisa."`
};

const aboutBeats = [
  {
    label: "TKJ",
    title: "Pondasi teknis",
    body: "Dasar komputer, jaringan, dan troubleshooting mulai terbentuk dari jurusan Teknik Komputer dan Jaringan.",
    icon: Network
  },
  {
    label: "Kerja",
    title: "Realita setelah lulus",
    body: "Tidak langsung lanjut pendidikan IT atau bekerja formal di teknologi karena kondisi pendidikan dan biaya.",
    icon: BriefcaseBusiness
  },
  {
    label: "Mandiri",
    title: "Belajar di sela waktu",
    body: "Saat ini bekerja sebagai sopir, sambil tetap belajar coding, mencoba ide, dan memperbaiki project sendiri.",
    icon: Route
  },
  {
    label: "Project",
    title: "Serius membangun project",
    body: "Haruchan Warming menjadi ruang praktik untuk bot, automation, API key, UI, dan eksperimen AI.",
    icon: Bot
  }
];

const journey = [
  {
    title: "SMK Teknik Komputer dan Jaringan",
    body: "Dasar komputer, jaringan, dan troubleshooting mulai terbentuk dari jurusan TKJ."
  },
  {
    title: "Bekerja di luar bidang teknologi",
    body: "Setelah tamat SMK, saya tidak langsung melanjutkan pendidikan IT atau bekerja formal di teknologi karena kondisi pendidikan dan biaya."
  },
  {
    title: "Belajar mandiri sambil bekerja",
    body: "Saat ini saya bekerja sebagai sopir, namun tetap menyisihkan waktu untuk belajar coding, mencoba ide, dan membangun project sendiri."
  },
  {
    title: "Membangun Haruchan Warming",
    body: "Project ini menjadi ruang praktik untuk automation, integrasi bot, API key, AI persona, media, dan workflow Telegram/WhatsApp."
  }
];

const skills = [
  { name: "Python", group: "Programming", level: 85, icon: Terminal, note: "Automation & scripting", color: "#22c55e" },
  { name: "JavaScript", group: "Programming", level: 80, icon: Code2, note: "Logic & web behavior", color: "#facc15" },
  { name: "HTML", group: "Frontend", level: 90, icon: Layers3, note: "Structure", color: "#f97316" },
  { name: "CSS", group: "Frontend", level: 85, icon: Layers3, note: "Layout & styling", color: "#38bdf8" },
  { name: "Bootstrap", group: "Frontend", level: 75, icon: Compass, note: "Fast UI build", color: "#a855f7" },
  { name: "Tailwind", group: "Frontend", level: 82, icon: Zap, note: "Utility-first styling", color: "#06b6d4" },
  { name: "Basic Networking / TKJ", group: "Networking", level: 70, icon: Wifi, note: "Network basics", color: "#94a3b8" }
];

const skillGroups = ["Programming", "Frontend", "Networking"];

function getSkillOrbitPositions(orbit, total = skills.length) {
  const rect = orbit.getBoundingClientRect();
  const size = Math.min(rect.width || 320, rect.height || rect.width || 320);
  const isMobile = window.matchMedia("(max-width: 640px)").matches;
  const radius = isMobile
    ? Math.min(116, Math.max(94, size * 0.36))
    : Math.min(168, Math.max(132, size * 0.38));

  orbit.style.setProperty("--skill-orbit-diameter", `${radius * 2}px`);
  orbit.style.setProperty("--skill-orbit-inner-diameter", `${radius * 1.36}px`);

  return Array.from({ length: total }, (_, index) => {
    const angle = -90 + (360 / total) * index;
    const radians = (angle * Math.PI) / 180;
    return {
      x: Math.round(Math.cos(radians) * radius),
      y: Math.round(Math.sin(radians) * radius)
    };
  });
}

const projectFeatures = [
  "Telegram/WhatsApp automation",
  "Pair warming dan group warming",
  "AI persona dan voice note",
  "Auto status/bio",
  "Random media",
  "API key"
];

const socialLinks = [
  { name: "GitHub", href: "https://www.github.com/khazulys", icon: Code2 },
  { name: "Second GitHub", href: "https://www.github.com/khazuly", icon: Code2 },
  { name: "Instagram", href: "https://www.instagram.com/khazulys", icon: Camera },
  { name: "Threads", href: "https://www.threads.com/@khazulys", icon: MessageCircle },
  { name: "Facebook", href: "https://www.facebook.com/khazul.yussery.2025", icon: Globe2 },
  { name: "Fanspage", href: "https://www.facebook.com/python.codeer", icon: Globe2 },
  { name: "Telegram", href: "https://t.me/khazulyss", icon: Send },
  { name: "Quora", href: "https://id.quora.com/profile/Khazul-Yussery", icon: MessageCircle }
];

const contactLinks = [
  { label: "Telegram", href: "https://t.me/khazulyss", icon: Send },
  { label: "GitHub", href: "https://www.github.com/khazulys", icon: Code2 }
];

const heroBadgeText = "Self-taught tech enthusiast";

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function animateLift(event, active) {
  if (prefersReducedMotion()) return;

  animate(event.currentTarget, {
    scale: active ? 1.025 : 1,
    duration: active ? 260 : 320,
    ease: "out(3)"
  });
}

function createCardRoute(points) {
  if (points.length === 0) return "";

  return points.reduce((path, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`;

    const previous = points[index - 1];
    const dx = point.x - previous.x;
    const dy = point.y - previous.y;
    const cardsShareRow =
      Math.min(previous.card.bottom, point.card.bottom) - Math.max(previous.card.top, point.card.top) > 0;
    const cardsShareColumn =
      Math.min(previous.card.right, point.card.right) - Math.max(previous.card.left, point.card.left) > 0;

    if (cardsShareRow) {
      const pull = Math.abs(dx) * 0.42;
      return `${path} C ${previous.x + pull} ${previous.y}, ${point.x - pull} ${point.y}, ${point.x} ${point.y}`;
    }

    if (cardsShareColumn) {
      const pull = Math.abs(dy) * 0.42;
      return `${path} C ${previous.x} ${previous.y + pull}, ${point.x} ${point.y - pull}, ${point.x} ${point.y}`;
    }

    const gapY = (previous.card.bottom + point.card.top) / 2;
    const bridgeX = previous.x + dx * 0.5;
    const verticalPull = Math.min(92, Math.max(36, Math.abs(dy) * 0.28));

    return [
      path,
      `C ${previous.x} ${previous.y + verticalPull}, ${previous.x} ${gapY}, ${bridgeX} ${gapY}`,
      `C ${point.x} ${gapY}, ${point.x} ${point.y - verticalPull}, ${point.x} ${point.y}`
    ].join(" ");
  }, "");
}

function createPathStops(path, points) {
  const total = path.getTotalLength() || 1;
  let searchStart = 0;

  return points.map((target, index) => {
    if (index === 0) return 0;

    let bestLength = searchStart;
    let bestDistance = Number.POSITIVE_INFINITY;
    const step = Math.max(1.5, total / 600);

    for (let length = searchStart; length <= total; length += step) {
      const point = path.getPointAtLength(length);
      const distance = Math.hypot(point.x - target.x, point.y - target.y);

      if (distance < bestDistance) {
        bestDistance = distance;
        bestLength = length;
      }
    }

    searchStart = bestLength;
    return bestLength / total;
  });
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
    gender: personaNeedsGender(type) ? gender : ""
  };
}

function isPersonaComplete(persona) {
  return Boolean(normalizePersona(persona));
}

function getPersonaKey(persona) {
  const normalized = normalizePersona(persona);
  if (!normalized) return "";

  return normalized.gender ? `${normalized.type}_${normalized.gender}` : normalized.type;
}

function getPersonaLabel(persona) {
  const normalized = normalizePersona(persona);
  if (!normalized) return "Pilih persona";

  const typeLabel = personaOptions.find((option) => option.id === normalized.type)?.label || "Persona";
  const genderLabel = normalized.gender
    ? genderOptions.find((option) => option.id === normalized.gender)?.label || ""
    : "";

  return [typeLabel, genderLabel].filter(Boolean).join(" ");
}

function buildPersonaSystemPrompt(persona) {
  const key = getPersonaKey(persona);
  const prompt = personaPrompts[key];

  return prompt ? `${prompt}\n\n${globalPersonaPrompt}` : "";
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

function extractAssistantText(data) {
  if (typeof data === "string") return data;
  if (!data || typeof data !== "object") return "";

  const directKeys = ["reply", "response", "message", "answer", "text", "content", "result"];
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
          <code data-language={language || undefined}>{codeLines.join("\n")}</code>
        </pre>
      );
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      const HeadingTag = `h${heading[1].length + 2}`;
      blocks.push(
        <HeadingTag key={`heading-${blocks.length}`}>
          {renderInlineMarkdown(heading[2], `heading-${blocks.length}`)}
        </HeadingTag>
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
        </ListTag>
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
        {renderInlineMarkdown(paragraph.join(" "), `paragraph-${blocks.length}`)}
      </p>
    );
  }

  return <div className="ai-markdown">{blocks}</div>;
}

function App() {
  const [theme, setTheme] = useState(() => getInitialTheme());
  const [hasManualTheme, setHasManualTheme] = useState(() => Boolean(getSavedTheme()));
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const mainRef = useRef(null);
  const isDark = theme === "dark";

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (hasManualTheme) return undefined;

    const media = getSystemThemeMedia();
    if (!media) return undefined;

    const syncSystemTheme = () => {
      setTheme(getSystemTheme());
    };

    syncSystemTheme();

    if (media.addEventListener) {
      media.addEventListener("change", syncSystemTheme);
      return () => media.removeEventListener("change", syncSystemTheme);
    }

    media.addListener(syncSystemTheme);
    return () => media.removeListener(syncSystemTheme);
  }, [hasManualTheme]);

  useEffect(() => {
    const root = mainRef.current;
    if (!root) return undefined;

    const reduceMotion = prefersReducedMotion();
    const revealElements = [...root.querySelectorAll(".reveal")];

    if (reduceMotion) {
      revealElements.forEach((element) => element.classList.add("is-visible"));
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const target = entry.target;
          const delay = Number(target.getAttribute("data-delay") || 0);

          animate(target, {
            opacity: [0, 1],
            translateY: [28, 0],
            filter: ["blur(10px)", "blur(0px)"],
            duration: 780,
            delay,
            ease: "out(3)",
            onComplete: () => target.classList.add("is-visible")
          });

          const meters = target.querySelectorAll(".skill-meter-fill");
          meters.forEach((meter, index) => {
            animate(meter, {
              width: [`0%`, `${meter.getAttribute("data-level")}%`],
              duration: 960,
              delay: 180 + index * 70,
              ease: "out(3)"
            });
          });

          observer.unobserve(target);
        });
      },
      { threshold: 0.16, rootMargin: "0px 0px -8% 0px" }
    );

    revealElements.forEach((element) => observer.observe(element));

    return () => {
      observer.disconnect();
    };
  }, []);

  const scrollToSection = useCallback((id) => {
    const target = document.getElementById(id);
    if (!target) return;

    setIsMenuOpen(false);

    const navbarOffset = 100;
    const targetTop = Math.max(0, target.getBoundingClientRect().top + window.scrollY - navbarOffset);

    if (prefersReducedMotion()) {
      window.scrollTo(0, targetTop);
      return;
    }

    window.scrollTo({
      top: targetTop,
      behavior: "smooth"
    });
  }, []);

  const themeLabel = useMemo(() => (isDark ? "Aktifkan light mode" : "Aktifkan dark mode"), [isDark]);
  const toggleTheme = useCallback(() => {
    setHasManualTheme(true);
    setTheme((currentTheme) => {
      const nextTheme = currentTheme === "dark" ? "light" : "dark";
      saveTheme(nextTheme);
      applyTheme(nextTheme);
      return nextTheme;
    });
  }, []);

  return (
    <div className="min-h-screen overflow-hidden">
      <Header
        isDark={isDark}
        isMenuOpen={isMenuOpen}
        onToggleMenu={() => setIsMenuOpen((value) => !value)}
        onCloseMenu={() => setIsMenuOpen(false)}
        onNavigate={scrollToSection}
        onToggleTheme={toggleTheme}
        themeLabel={themeLabel}
      />

      <main ref={mainRef}>
        <Hero />
        <About />
        <Journey />
        <Skills />
        <AiSection />
        <Project />
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
  const textareaRef = useRef(null);
  const messagesEndRef = useRef(null);
  const animationRef = useRef(null);
  const personaRef = useRef(persona);
  const activePersona = useMemo(() => normalizePersona(persona), [persona]);
  const personaLabel = useMemo(() => getPersonaLabel(activePersona), [activePersona]);

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
      return;
    }

    animationRef.current = animate(panel, {
      scale: [1, 0.15],
      opacity: [1, 0],
      translateY: [0, 15],
      duration: 430,
      ease: "inExpo",
      onComplete: () => setIsMounted(false)
    });
  }, []);

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
      scale: [0.15, 1],
      opacity: [0, 1],
      translateY: [15, 0],
      duration: 520,
      ease: "outExpo",
      onComplete: () => {
        if (isPersonaComplete(personaRef.current)) focusTextarea();
      }
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
    focusTextarea();
  }, [focusTextarea]);

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
      setIsPersonaSetupOpen(false);
      focusTextarea();
    },
    [focusTextarea]
  );

  const selectPersonaType = useCallback(
    (type) => {
      if (!personaNeedsGender(type)) {
        applyPersona({ type, gender: "" });
        return;
      }

      setPersonaDraft((current) => ({
        type,
        gender: current.type === type ? current.gender : ""
      }));
    },
    [applyPersona]
  );

  const selectPersonaGender = useCallback(
    (gender) => {
      if (!personaNeedsGender(personaDraft.type)) return;
      applyPersona({ type: personaDraft.type, gender });
    },
    [applyPersona, personaDraft.type]
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
      content: userMessage
    };

    setMessages((current) => [...current, userEntry]);
    setInput("");
    setIsSending(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: userMessage,
          systemPrompt: buildPersonaSystemPrompt(currentPersona),
          persona: {
            ...currentPersona,
            label: getPersonaLabel(currentPersona)
          }
        })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "AI Assistant sedang tidak bisa merespons.");
      }

      const assistantText = extractAssistantText(data);

      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: assistantText || "Maaf, saya belum menerima jawaban yang bisa ditampilkan."
        }
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: `assistant-error-${Date.now()}`,
          role: "assistant",
          isError: true,
          content: error.message || "Maaf, AI Assistant sedang bermasalah. Coba lagi sebentar lagi."
        }
      ]);
    } finally {
      setIsSending(false);
    }
  }, [input, isSending, persona]);

  const handleSubmit = (event) => {
    event.preventDefault();
    sendMessage();
  };

  const handleInputKeyDown = (event) => {
    if (event.key !== "Enter" || event.shiftKey) return;

    event.preventDefault();
    sendMessage();
  };

  return (
    <>
      <button
        type="button"
        className={`chat-fab ${isMounted ? "is-hidden" : ""}`}
        onClick={isMounted ? closeChat : openChat}
        aria-label={isMounted ? "Minimize AI Assistant" : "Open AI Assistant"}
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
                aria-label="Pengaturan persona"
                title="Pengaturan persona"
              >
                <Settings2 size={17} />
              </button>
              <button
                type="button"
                className="ai-chat-icon-button ai-chat-clear-icon"
                onClick={clearChat}
                disabled={messages.length === 0 && !input}
                aria-label="Clear chat"
                title="Clear chat"
              >
                <Trash2 size={17} />
              </button>
              <button type="button" className="ai-chat-icon-button" onClick={closeChat} aria-label="Minimize chat" title="Minimize">
                <Minus size={18} />
              </button>
              <button type="button" className="ai-chat-icon-button" onClick={closeChat} aria-label="Close chat" title="Close">
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
                    <p>Mulai chat dengan AI Assistant.</p>
                  </div>
                ) : null}

                {messages.map((message) => (
                  <div key={message.id} className={`ai-chat-row ${message.role === "user" ? "is-user" : "is-ai"}`}>
                    <div className={`ai-chat-bubble ${message.isError ? "is-error" : ""}`}>
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
                    <div className="ai-chat-bubble ai-typing-bubble" aria-label="AI Assistant sedang mengetik">
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
                  <button type="submit" className="ai-chat-send" disabled={!input.trim() || isSending} aria-label="Kirim pesan">
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

function PersonaSetup({ draft, hasActivePersona, onCancel, onSelectGender, onSelectType }) {
  const selectedOption = personaOptions.find((option) => option.id === draft.type);
  const needsGender = Boolean(selectedOption?.needsGender);

  return (
    <div className="ai-persona-screen" role="dialog" aria-modal="true" aria-labelledby="ai-persona-title">
      <div className="ai-persona-panel">
        <div className="ai-persona-heading">
          <span className="ai-persona-kicker">Setup Persona</span>
          <h3 id="ai-persona-title">Pilih gaya ngobrol</h3>
          <p>Persona ini akan dipakai untuk semua pesan berikutnya sampai kamu menggantinya lagi.</p>
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
              {option.needsGender ? <small>Pilih gender</small> : <small>Langsung aktif</small>}
            </button>
          ))}
        </div>

        {needsGender ? (
          <div className="ai-persona-gender">
            <p>Pilih gender untuk persona {selectedOption.label}.</p>
            <div className="ai-persona-options is-gender" aria-label="Pilihan gender persona">
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
            <button type="button" className="ai-persona-cancel" onClick={onCancel}>
              Batal
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Header({ isDark, isMenuOpen, onToggleMenu, onCloseMenu, onNavigate, onToggleTheme, themeLabel }) {
  const themeButtonRef = useRef(null);
  const themeIconRef = useRef(null);
  const menuIconRef = useRef(null);
  const mobileNavRef = useRef(null);
  const firstThemeRender = useRef(true);
  const firstMenuRender = useRef(true);

  useEffect(() => {
    if (firstThemeRender.current) {
      firstThemeRender.current = false;
      return;
    }

    if (prefersReducedMotion()) return;

    animate(themeButtonRef.current, {
      scale: [0.92, 1],
      duration: 340,
      ease: "out(3)"
    });

    animate(themeIconRef.current, {
      opacity: [0, 1],
      rotate: [isDark ? -80 : 80, 0],
      scale: [0.65, 1],
      duration: 430,
      ease: "out(4)"
    });
  }, [isDark]);

  useEffect(() => {
    const nav = mobileNavRef.current;
    const icon = menuIconRef.current;
    if (!nav) return;

    const links = [...nav.querySelectorAll(".mobile-nav-link")];
    const reduceMotion = prefersReducedMotion();

    if (firstMenuRender.current) {
      firstMenuRender.current = false;
      nav.style.height = "0px";
      nav.style.opacity = "0";
      nav.style.transform = "translateY(-8px)";
      links.forEach((link) => {
        link.style.opacity = "0";
        link.style.transform = "translateY(8px)";
      });
      return;
    }

    if (icon && !reduceMotion) {
      animate(icon, {
        rotate: [isMenuOpen ? -90 : 90, 0],
        scale: [0.75, 1],
        opacity: [0, 1],
        duration: 330,
        ease: "out(3)"
      });
    }

    if (reduceMotion) {
      nav.style.height = isMenuOpen ? "auto" : "0px";
      nav.style.opacity = isMenuOpen ? "1" : "0";
      links.forEach((link) => {
        link.style.opacity = isMenuOpen ? "1" : "0";
      });
      return;
    }

    if (isMenuOpen) {
      nav.style.height = "0px";
      nav.style.opacity = "0";
      nav.style.transform = "translateY(-8px)";
      links.forEach((link) => {
        link.style.opacity = "0";
        link.style.transform = "translateY(8px)";
      });

      const targetHeight = nav.scrollHeight;
      createTimeline({
        defaults: { ease: "out(3)" },
        onComplete: () => {
          nav.style.height = "auto";
        }
      })
        .add(
          nav,
          {
            height: ["0px", `${targetHeight}px`],
            opacity: [0, 1],
            translateY: [-8, 0],
            duration: 420
          },
          0
        )
        .add(
          links,
          {
            opacity: [0, 1],
            translateY: [8, 0],
            duration: 360,
            delay: stagger(45)
          },
          80
        );
    } else {
      const currentHeight = nav.scrollHeight;
      nav.style.height = `${currentHeight}px`;

      createTimeline({ defaults: { ease: "inOut(3)" } })
        .add(
          links,
          {
            opacity: [1, 0],
            translateY: [0, -6],
            duration: 180,
            delay: stagger(24)
          },
          0
        )
        .add(
          nav,
          {
            height: [`${currentHeight}px`, "0px"],
            opacity: [1, 0],
            translateY: [0, -8],
            duration: 300
          },
          60
        );
    }
  }, [isMenuOpen]);

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b-2 border-[color:var(--border)] bg-[color:var(--page-bg)]">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8" aria-label="Navigasi utama">
        <button type="button" className="group flex items-center gap-3" onClick={() => onNavigate("hero")}>
          <span className="grid h-10 w-10 place-items-center rounded-lg border-2 border-[color:var(--border)] bg-[color:var(--surface-strong)] text-sm font-black tracking-normal text-[color:var(--text)] shadow-retro transition duration-300 group-hover:-translate-y-0.5 group-hover:border-[color:var(--border)]">
            KY
          </span>
          <span className="hidden text-sm font-semibold text-[color:var(--text)] sm:inline">Khazul Yussery</span>
        </button>

        <div className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className="rounded-md px-3 py-2 text-sm font-medium text-[color:var(--muted)] transition hover:bg-[color:var(--accent-soft)] hover:text-[color:var(--text)]"
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            ref={themeButtonRef}
            type="button"
            onClick={onToggleTheme}
            className="grid h-10 w-10 place-items-center rounded-lg border-2 border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--text)] transition hover:-translate-y-0.5 hover:border-[color:var(--border)] hover:bg-[color:var(--accent-soft)]"
            aria-label={themeLabel}
            title={themeLabel}
          >
            <span ref={themeIconRef} className="grid place-items-center">
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </span>
          </button>
          <button
            type="button"
            onClick={onToggleMenu}
            className="grid h-10 w-10 place-items-center rounded-lg border-2 border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--text)] transition hover:bg-[color:var(--accent-soft)] lg:hidden"
            aria-label={isMenuOpen ? "Tutup menu" : "Buka menu"}
            aria-expanded={isMenuOpen}
          >
            <span ref={menuIconRef} className="grid place-items-center">
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </span>
          </button>
        </div>
      </nav>

      <div
        ref={mobileNavRef}
        aria-hidden={!isMenuOpen}
        className={`h-0 -translate-y-2 overflow-hidden border-t-2 bg-[color:var(--page-bg)] px-4 py-0 opacity-0 lg:hidden ${
          isMenuOpen ? "pointer-events-auto border-[color:var(--border)]" : "pointer-events-none border-transparent"
        }`}
      >
        <div className="mx-auto grid max-w-6xl gap-1 py-3">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onCloseMenu();
                onNavigate(item.id);
              }}
              className="mobile-nav-link rounded-md px-3 py-3 text-left text-sm font-semibold text-[color:var(--muted)] transition hover:bg-[color:var(--accent-soft)] hover:text-[color:var(--text)]"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}

function Hero() {
  const [typedBadge, setTypedBadge] = useState(heroBadgeText);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setTypedBadge(heroBadgeText);
      return undefined;
    }

    let cursor = 0;
    let isDeleting = false;
    let timeoutId;

    const tick = () => {
      if (!isDeleting) {
        cursor = Math.min(heroBadgeText.length, cursor + 1);
        setTypedBadge(heroBadgeText.slice(0, cursor));

        if (cursor === heroBadgeText.length) {
          isDeleting = true;
          timeoutId = window.setTimeout(tick, 1100);
          return;
        }

        timeoutId = window.setTimeout(tick, 82);
        return;
      }

      cursor = Math.max(0, cursor - 1);
      setTypedBadge(heroBadgeText.slice(0, cursor));

      if (cursor === 0) {
        isDeleting = false;
        timeoutId = window.setTimeout(tick, 360);
        return;
      }

      timeoutId = window.setTimeout(tick, 48);
    };

    setTypedBadge("");
    timeoutId = window.setTimeout(tick, 280);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  return (
    <section id="hero" className="relative pt-24 sm:pt-28">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 sm:px-6 sm:pb-20 lg:grid-cols-[1.08fr_0.92fr] lg:px-8 lg:pb-24">
        <div className="reveal">
          <div className="hero-typing-badge mb-5 inline-flex items-center gap-2 rounded-md border-2 border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm font-medium text-[color:var(--muted)]">
            <Terminal size={16} className="text-[color:var(--accent)]" />
            <span className="hero-typing-text">
              <span className="sr-only">{heroBadgeText}</span>
              <span className="hero-typing-measure" aria-hidden="true">{heroBadgeText}</span>
              <span className="hero-typing-live" aria-hidden="true">
                <span>{typedBadge}</span>
                <span className="hero-typing-cursor" aria-hidden="true" />
              </span>
            </span>
          </div>
          <h1 className="max-w-3xl text-balance text-4xl font-black leading-tight tracking-normal text-[color:var(--text)] sm:text-5xl lg:text-6xl">
            Khazul Yussery
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-[color:var(--muted)] sm:text-lg">
            Lulusan TKJ yang saat ini bekerja sebagai sopir, tapi tetap serius belajar coding dan membangun project teknologi secara mandiri.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <PrimaryLink href="https://www.github.com/khazulys" icon={Code2}>
              Lihat GitHub
            </PrimaryLink>
            <SecondaryLink href="https://t.me/khazulyss" icon={Send}>
              Hubungi Telegram
            </SecondaryLink>
          </div>
        </div>

        <div className="reveal relative mx-auto w-full max-w-md lg:max-w-none" data-delay="110">
          <div className="relative overflow-hidden rounded-lg border-2 border-[color:var(--border)] bg-[color:var(--surface)] p-2 shadow-retro">
            <img
              src={profilePhoto}
              alt="Khazul Yussery"
              className="aspect-square w-full rounded-lg object-cover"
              width="1080"
              height="1080"
              loading="eager"
            />
          </div>
          <div className="surface-strong absolute -bottom-4 left-4 right-4 rounded-lg p-4 shadow-retro sm:left-auto sm:right-6 sm:w-72">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[color:var(--accent-soft)] text-[color:var(--accent)]">
                <Code2 size={20} />
              </div>
              <p className="text-sm leading-6 text-[color:var(--muted)]">
                Belajar dari project nyata: bot, automation, UI, integrasi API, dan eksperimen AI.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function About() {
  const flightStageRef = useRef(null);
  const flightSvgRef = useRef(null);
  const flightPathRef = useRef(null);
  const flightPlaneRef = useRef(null);
  const cardRefs = useRef([]);
  const checkpointRefs = useRef([]);
  const progressRef = useRef({ value: 0 });
  const targetProgressRef = useRef(0);
  const frameRef = useRef(null);
  const activeIndexRef = useRef(0);
  const pathLengthRef = useRef(1);
  const checkpointStopsRef = useRef([0, 0.34, 0.67, 1]);
  const [activeMilestone, setActiveMilestone] = useState(0);

  useEffect(() => {
    const stage = flightStageRef.current;
    const svg = flightSvgRef.current;
    const path = flightPathRef.current;
    const plane = flightPlaneRef.current;
    if (!stage || !svg || !path || !plane) return undefined;
    const supportsMotionPath = window.CSS?.supports?.("offset-path", 'path("M 0 0 L 1 1")') ?? false;

    const setFlightPosition = (progress) => {
      const clampedProgress = Math.min(1, Math.max(0, progress));
      const pathLength = pathLengthRef.current || 1;
      const currentLength = pathLength * clampedProgress;

      if (supportsMotionPath) {
        plane.style.offsetDistance = `${clampedProgress * 100}%`;
      } else {
        const point = path.getPointAtLength(currentLength);
        const before = path.getPointAtLength(Math.max(0, currentLength - 4));
        const after = path.getPointAtLength(Math.min(pathLength, currentLength + 4));
        const angle = (Math.atan2(after.y - before.y, after.x - before.x) * 180) / Math.PI;
        const planeHalfWidth = (plane.offsetWidth || 44) / 2;
        const planeHalfHeight = (plane.offsetHeight || 44) / 2;

        plane.style.transform = `translate3d(${point.x - planeHalfWidth}px, ${point.y - planeHalfHeight}px, 0) rotate(${angle}deg)`;
      }

      const nextIndex = checkpointStopsRef.current.reduce((activeIndex, checkpointProgress, index) => {
        return clampedProgress + 0.018 >= checkpointProgress ? index : activeIndex;
      }, 0);

      if (activeIndexRef.current !== nextIndex) {
        activeIndexRef.current = nextIndex;
        setActiveMilestone(nextIndex);
      }
    };

    const measureRoute = () => {
      const stageRect = stage.getBoundingClientRect();
      const routePoints = aboutBeats
        .map((_, index) => {
          const card = cardRefs.current[index];
          const checkpoint = checkpointRefs.current[index];
          if (!card || !checkpoint) return null;

          const cardRect = card.getBoundingClientRect();
          const checkpointRect = checkpoint.getBoundingClientRect();
          const cardLeft = cardRect.left - stageRect.left;
          const cardRight = cardRect.right - stageRect.left;
          const cardTop = cardRect.top - stageRect.top;
          const cardBottom = cardRect.bottom - stageRect.top;

          return {
            x: checkpointRect.left - stageRect.left + checkpointRect.width / 2,
            y: checkpointRect.top - stageRect.top + checkpointRect.height / 2,
            card: {
              top: cardTop,
              bottom: cardBottom,
              left: cardLeft,
              right: cardRight,
              centerX: cardLeft + cardRect.width / 2,
              centerY: cardTop + cardRect.height / 2
            }
          };
        })
        .filter(Boolean);

      if (routePoints.length < 2) return false;

      svg.setAttribute("viewBox", `0 0 ${Math.max(stageRect.width, 1)} ${Math.max(stageRect.height, 1)}`);
      const route = createCardRoute(routePoints);
      path.setAttribute("d", route);
      pathLengthRef.current = path.getTotalLength() || 1;
      checkpointStopsRef.current = createPathStops(path, routePoints);
      if (supportsMotionPath) {
        plane.style.offsetPath = `path("${route}")`;
        plane.style.transform = "none";
      }
      setFlightPosition(progressRef.current.value);
      return true;
    };

    const getTargetProgress = () => {
      const rect = stage.getBoundingClientRect();
      const viewportHeight = window.innerHeight || 1;
      const scrollStart = viewportHeight * 0.74;
      const travelDistance = Math.max(rect.height * 1.28, viewportHeight * 0.92, 1);
      return Math.min(1, Math.max(0, (scrollStart - rect.top) / travelDistance));
    };

    const runSmoothFlight = () => {
      const current = progressRef.current.value;
      const target = targetProgressRef.current;
      const delta = target - current;

      if (Math.abs(delta) < 0.0015) {
        progressRef.current.value = target;
        setFlightPosition(target);
        frameRef.current = null;
        return;
      }

      progressRef.current.value = current + delta * 0.16;
      setFlightPosition(progressRef.current.value);
      frameRef.current = window.requestAnimationFrame(runSmoothFlight);
    };

    const startSmoothFlight = () => {
      if (frameRef.current) return;

      frameRef.current = window.requestAnimationFrame(runSmoothFlight);
    };

    if (prefersReducedMotion()) {
      progressRef.current.value = 1;
      measureRoute();
      setFlightPosition(1);
      setActiveMilestone(checkpointRefs.current.filter(Boolean).length - 1);
      return undefined;
    }

    let ticking = false;

    const updateTargetProgress = (immediate = false) => {
      targetProgressRef.current = getTargetProgress();

      if (immediate) {
        progressRef.current.value = targetProgressRef.current;
        setFlightPosition(progressRef.current.value);
        return;
      }

      startSmoothFlight();
    };

    const requestUpdate = () => {
      if (ticking) return;

      ticking = true;
      window.requestAnimationFrame(() => {
        updateTargetProgress();
        ticking = false;
      });
    };

    const refreshRoute = () => {
      measureRoute();
      updateTargetProgress();
    };

    measureRoute();
    updateTargetProgress(true);
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", refreshRoute);
    const resizeObserver = new ResizeObserver(refreshRoute);
    resizeObserver.observe(stage);
    cardRefs.current.filter(Boolean).forEach((card) => resizeObserver.observe(card));

    return () => {
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", refreshRoute);
      resizeObserver.disconnect();
      if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return (
    <Section id="tentang" eyebrow="Tentang Saya" title="Jalan saya tidak lurus ke IT, tapi minatnya tetap hidup.">
      <div className="reveal about-cinema relative mx-auto max-w-5xl overflow-visible rounded-lg border-2 border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-retro sm:p-8 lg:p-10">
        <div className="relative z-10 grid gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-md bg-[color:var(--accent-soft)] px-3 py-2 text-sm font-bold text-[color:var(--accent)]">
              <Route size={17} />
              Personal route
            </div>
            <p className="text-base leading-8 text-[color:var(--muted)]">
              Saya lulusan SMK jurusan Teknik Komputer dan Jaringan. Setelah tamat SMK, saya tidak melanjutkan pendidikan IT dan tidak bekerja secara formal di bidang teknologi.
            </p>
            <p className="mt-4 text-base leading-8 text-[color:var(--muted)]">
              Karena keterbatasan pendidikan dan biaya, saya sempat memendam minat di dunia IT dan bekerja serabutan. Saat ini saya bekerja sebagai sopir.
            </p>
            <p className="mt-4 text-base leading-8 text-[color:var(--muted)]">
              Walaupun tidak bekerja di bidang teknologi, saya tetap punya minat dan passion besar di coding dan teknologi. Saya belajar, mencoba, gagal, memperbaiki, lalu membuat project secara mandiri.
            </p>
          </div>

          <div
            ref={flightStageRef}
            className="about-flight-stage relative mx-auto w-full max-w-3xl overflow-visible rounded-lg border-2 border-[color:var(--border)] bg-[color:var(--surface-strong)] p-5 sm:p-6 lg:max-w-none"
          >
            <svg ref={flightSvgRef} className="about-flight-svg" aria-hidden="true" focusable="false">
              <path ref={flightPathRef} className="about-flight-path" />
            </svg>
            <div ref={flightPlaneRef} className="about-plane" aria-hidden="true">
              <div className="about-plane-shell">
                <SendHorizontal size={23} strokeWidth={2.35} />
              </div>
            </div>

            <div className="about-roadmap-list relative z-10">
              {aboutBeats.map((beat, index) => {
                const Icon = beat.icon;
                return (
                  <div
                    key={beat.title}
                    ref={(element) => {
                      cardRefs.current[index] = element;
                    }}
                    className={`about-flight-card about-roadmap-card group rounded-lg border-2 border-[color:var(--border)] bg-[color:var(--page-bg)] p-4 transition hover:border-[color:var(--border)] ${
                      activeMilestone >= index ? "is-active" : ""
                    }`}
                    onMouseEnter={(event) => animateLift(event, true)}
                    onMouseLeave={(event) => animateLift(event, false)}
                    onFocus={(event) => animateLift(event, true)}
                    onBlur={(event) => animateLift(event, false)}
                    tabIndex={0}
                  >
                    <div className="about-card-header">
                      <div
                        ref={(element) => {
                          checkpointRefs.current[index] = element;
                        }}
                        className="about-card-checkpoint grid h-10 w-10 place-items-center rounded-lg bg-[color:var(--accent-soft)] text-[color:var(--accent)]"
                      >
                        <Icon size={20} />
                      </div>
                      <div className="about-card-meta">
                        <span className="text-xs font-black uppercase tracking-[0.16em] text-[color:var(--accent)]">{beat.label}</span>
                        <span className="about-card-rule" />
                        <span className="text-xs font-bold text-[color:var(--muted)]">0{index + 1}</span>
                      </div>
                    </div>
                    <h3 className="about-card-title text-base font-black text-[color:var(--text)]">{beat.title}</h3>
                    <p className="text-sm leading-7 text-[color:var(--muted)]">{beat.body}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}

function Journey() {
  return (
    <Section id="perjalanan" eyebrow="Journey" title="Perjalanan yang dibangun pelan-pelan.">
      <div className="relative grid gap-5 md:grid-cols-2">
        {journey.map((item, index) => (
          <div
            key={item.title}
            className="reveal group relative min-h-64 overflow-hidden rounded-lg border-2 border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-retro transition duration-300 hover:-translate-y-1 hover:bg-[color:var(--surface-strong)]"
            data-delay={index * 70}
          >
            <div className="absolute right-4 top-2 select-none text-7xl font-black leading-none text-[color:var(--accent-soft)] sm:text-8xl">
              0{index + 1}
            </div>
            <div className="relative z-10 flex min-h-52 flex-col justify-end">
              <span className="mb-5 h-1 w-16 bg-[color:var(--border)]" />
              <h3 className="max-w-sm text-2xl font-black leading-tight text-[color:var(--text)]">{item.title}</h3>
              <p className="mt-4 max-w-xl text-sm leading-7 text-[color:var(--muted)] sm:text-base">{item.body}</p>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

function Skills() {
  const orbitRef = useRef(null);
  const orbitLoopRef = useRef(null);
  const orbitAngleRef = useRef({ angle: 0 });

  useEffect(() => {
    const orbit = orbitRef.current;
    if (!orbit) return undefined;

    const badgeWrappers = [...orbit.querySelectorAll(".skill-orbit-badge")];
    if (badgeWrappers.length === 0) return undefined;

    const reduceMotion = prefersReducedMotion();
    let orbitPositions = getSkillOrbitPositions(orbit);
    let hasStartedOrbit = false;
    const entranceAnimations = [];

    const setBadgePosition = (badge, position, scale = 1) => {
      badge.style.transform = `translate3d(${position.x}px, ${position.y}px, 0) scale(${scale})`;
    };

    const renderOrbit = () => {
      const radians = (orbitAngleRef.current.angle * Math.PI) / 180;
      const cos = Math.cos(radians);
      const sin = Math.sin(radians);

      badgeWrappers.forEach((badge, index) => {
        const origin = orbitPositions[index];
        setBadgePosition(badge, {
          x: origin.x * cos - origin.y * sin,
          y: origin.x * sin + origin.y * cos
        });
      });
    };

    const refreshOrbitPositions = () => {
      orbitPositions = getSkillOrbitPositions(orbit);
      if (hasStartedOrbit || reduceMotion) renderOrbit();
    };

    badgeWrappers.forEach((badge, index) => {
      const target = orbitPositions[index];
      badge.style.opacity = reduceMotion ? "1" : "0";
      setBadgePosition(badge, reduceMotion ? target : { x: 0, y: 0 });
    });

    const startOrbit = () => {
      if (reduceMotion) return;
      hasStartedOrbit = true;
      orbitLoopRef.current?.pause?.();
      orbitAngleRef.current.angle = 0;
      renderOrbit();
      orbitLoopRef.current = animate(orbitAngleRef.current, {
        angle: 360,
        duration: 24000,
        ease: "linear",
        loop: true,
        onUpdate: renderOrbit
      });
    };

    if (reduceMotion) {
      renderOrbit();
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          let completed = 0;

          badgeWrappers.forEach((badge, index) => {
            const target = orbitPositions[index];
            const state = { opacity: 0, scale: 0.62, x: 0, y: 0 };

            const animation = animate(state, {
              opacity: 1,
              scale: 1,
              x: target.x,
              y: target.y,
              duration: 920,
              delay: index * 95,
              ease: "out(4)",
              onUpdate: () => {
                badge.style.opacity = String(state.opacity);
                setBadgePosition(badge, state, state.scale);
              },
              onComplete: () => {
                completed += 1;
                if (completed === badgeWrappers.length) startOrbit();
              }
            });

            entranceAnimations.push(animation);
          });

          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.28, rootMargin: "0px 0px -8% 0px" }
    );

    observer.observe(orbit);
    window.addEventListener("resize", refreshOrbitPositions);

    return () => {
      observer.disconnect();
      orbitLoopRef.current?.pause?.();
      entranceAnimations.forEach((animation) => animation.pause?.());
      window.removeEventListener("resize", refreshOrbitPositions);
    };
  }, []);

  return (
    <Section id="skill" eyebrow="Skill" title="Skill yang saya pakai untuk belajar dan membangun.">
      <div className="reveal skill-console relative overflow-visible rounded-lg border-2 border-[color:var(--border)] bg-[color:var(--surface)] p-4 shadow-retro sm:p-8">
        <div className="relative z-10 grid gap-9 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
          <div ref={orbitRef} className="skill-orbit relative mx-auto aspect-square w-full max-w-[34rem] overflow-visible">
            <div className="skill-orbit-ring skill-orbit-ring-one" />
            <div className="skill-orbit-ring skill-orbit-ring-two" />
            <div className="absolute left-1/2 top-1/2 z-20 grid h-28 w-28 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-lg border-2 border-[color:var(--border)] bg-[color:var(--page-bg)] text-center shadow-retro sm:h-32 sm:w-32">
              <div>
                <p className="text-xl font-black uppercase leading-none text-[color:var(--text)] sm:text-2xl">Learning</p>
                <p className="mt-1 text-xl font-black uppercase leading-none text-[color:var(--text)] sm:text-2xl">Stack</p>
              </div>
            </div>

            {skills.map((skill, index) => {
              const Icon = skill.icon;
              return (
                <div
                  key={skill.name}
                  className="skill-orbit-badge absolute left-1/2 top-1/2 z-30"
                >
                  <div
                    className="skill-chip-center"
                  >
                    <div
                      className="skill-chip flex min-w-28 items-center gap-2 rounded-lg border-2 border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 py-2 text-xs font-bold text-[color:var(--text)] shadow-retro"
                      tabIndex={0}
                      onMouseEnter={(event) => animateLift(event, true)}
                      onMouseLeave={(event) => animateLift(event, false)}
                      onFocus={(event) => animateLift(event, true)}
                      onBlur={(event) => animateLift(event, false)}
                    >
                      <Icon size={16} className="shrink-0 text-[color:var(--accent)]" />
                      <span>{skill.name}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid gap-4">
            {skillGroups.map((group) => (
              <div key={group} className="rounded-lg border-2 border-[color:var(--border)] bg-[color:var(--page-bg)] p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-black uppercase tracking-[0.16em] text-[color:var(--text)]">{group}</h3>
                  <span className="h-px flex-1 bg-[color:var(--border)]" />
                </div>
                <div className="grid gap-4">
                  {skills
                    .filter((skill) => skill.group === group)
                    .map((skill) => {
                      const Icon = skill.icon;
                      return (
                        <div key={skill.name} className="skill-meter group">
                          <div className="mb-2 flex items-center justify-between gap-3">
                            <span className="flex items-center gap-2 text-sm font-bold text-[color:var(--text)]">
                              <Icon size={16} className="text-[color:var(--accent)]" />
                              {skill.name}
                            </span>
                            <span className="text-xs font-semibold text-[color:var(--muted)]">{skill.note}</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-[color:var(--border)]">
                            <div
                              className="skill-meter-fill h-full rounded-full"
                              data-level={skill.level}
                              style={{ "--skill-meter-color": skill.color }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}

function AiSection() {
  return (
    <Section id="ai" eyebrow="Coding di Era AI" title="AI saya pakai sebagai alat bantu, bukan pengganti pemahaman.">
      <div className="reveal overflow-hidden rounded-lg border-2 border-[color:var(--border)] bg-[color:var(--surface)]">
        <div className="grid gap-0 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="border-b-2 border-[color:var(--border)] p-6 sm:p-8 lg:border-b-0 lg:border-r-2">
            <div className="grid h-12 w-12 place-items-center rounded-lg bg-[color:var(--accent-soft)] text-[color:var(--accent)]">
              <Code2 size={24} />
            </div>
            <h3 className="mt-6 text-2xl font-black tracking-normal text-[color:var(--text)]">Belajar lebih cepat, tetap pakai logika.</h3>
          </div>
          <div className="p-6 sm:p-8">
            <p className="text-base leading-8 text-[color:var(--muted)]">
              Saya menggunakan AI sebagai alat bantu dalam beberapa project, bukan karena tidak paham fundamental, tapi karena AI bisa mempercepat proses belajar, eksperimen, debugging, dan development.
            </p>
            <p className="mt-4 text-base leading-8 text-[color:var(--muted)]">
              Menggunakan AI bukan berarti tidak bisa coding, selama tetap paham alur, logika, struktur, dan tujuan project. Bagi saya, AI membantu membuka jalan, sementara keputusan teknis tetap harus dipahami dan diuji.
            </p>
          </div>
        </div>
      </div>
    </Section>
  );
}

function Project() {
  return (
    <Section id="project" eyebrow="Project Utama" title="Haruchan Warming">
      <div className="reveal rounded-lg border-2 border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-retro sm:p-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_0.78fr] lg:items-start">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-md bg-[color:var(--accent-soft)] px-3 py-2 text-sm font-semibold text-[color:var(--accent)]">
              <Bot size={17} />
              Telegram / WhatsApp automation
            </div>
            <p className="max-w-3xl text-base leading-8 text-[color:var(--muted)]">
              Bot Telegram/WhatsApp automation untuk warming akun, pair warming, group warming, AI persona, voice note, auto status/bio, random media, dan API key.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <PrimaryLink href="https://www.khzlai.web.id" icon={Globe2}>
                Website
              </PrimaryLink>
              <SecondaryLink href="https://t.me/Haruchan_bot" icon={Send}>
                Bot
              </SecondaryLink>
              <SecondaryLink href="https://t.me/haruchan_channel" icon={MessageCircle}>
                Channel
              </SecondaryLink>
            </div>
          </div>

          <div className="grid gap-3 border-l-2 border-[color:var(--border)] pl-5">
            {projectFeatures.map((feature) => (
              <div key={feature} className="flex items-center gap-3 py-2 text-sm font-semibold text-[color:var(--text)]">
                <span className="h-2 w-2 rounded-full bg-[color:var(--accent)]" />
                {feature}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}

function Social() {
  return (
    <Section id="social" eyebrow="Social Media" title="Tempat saya berbagi dan terhubung.">
      <div className="reveal social-hub relative overflow-hidden rounded-lg border-2 border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-retro sm:p-8">
        <div className="relative z-10 grid gap-8 lg:grid-cols-[0.62fr_1.38fr] lg:items-start">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-md border-2 border-[color:var(--border)] bg-[color:var(--accent-soft)] px-3 py-2 text-sm font-black text-[color:var(--accent)] shadow-retro-sm">
              <MessageCircle size={17} />
              Contact board
            </div>
            <p className="text-base leading-8 text-[color:var(--muted)]">
              Beberapa tempat saya berbagi, menyimpan project, dan terhubung. Link dibuat tetap langsung ke profil asli supaya mudah dicek.
            </p>
            <div className="mt-6 hidden border-2 border-[color:var(--border)] bg-[color:var(--page-bg)] p-4 shadow-retro lg:block">
              <p className="text-5xl font-black leading-none text-[color:var(--text)]">KY</p>
              <p className="mt-2 text-xs font-black uppercase tracking-[0.18em] text-[color:var(--muted)]">Khazul Yussery</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {socialLinks.map((link) => {
              const Icon = link.icon;
              return (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="social-node flex min-h-20 items-center justify-between gap-4 rounded-lg border-2 border-[color:var(--border)] bg-[color:var(--surface-strong)] p-4 text-[color:var(--text)] shadow-retro-sm"
                  onMouseEnter={(event) => animateLift(event, true)}
                  onMouseLeave={(event) => animateLift(event, false)}
                  onFocus={(event) => animateLift(event, true)}
                  onBlur={(event) => animateLift(event, false)}
                >
                  <span className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-lg bg-[color:var(--accent-soft)] text-[color:var(--accent)]">
                      <Icon size={20} />
                    </span>
                    <span className="text-sm font-bold">{link.name}</span>
                  </span>
                  <ArrowUpRight size={17} className="shrink-0 text-[color:var(--muted)]" />
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </Section>
  );
}

function Contact() {
  return (
    <section id="contact" className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="reveal mx-auto max-w-6xl overflow-hidden rounded-lg border-2 border-[color:var(--border)] bg-[color:var(--text)] text-[color:var(--page-bg)] shadow-retro ">
        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center lg:p-10">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] opacity-70">Contact</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-black leading-tight tracking-normal sm:text-4xl">
              Terbuka untuk ngobrol soal project, bot, automation, atau coding.
            </h2>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            {contactLinks.map((link) => {
              const Icon = link.icon;
              return (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border-2 border-[color:var(--page-bg)] bg-[color:var(--page-bg)] px-5 text-sm font-black text-[color:var(--text)] shadow-retro-sm transition hover:-translate-y-0.5 hover:opacity-90 "
                >
                  <Icon size={18} />
                  {link.label}
                </a>
              );
            })}
          </div>
        </div>
      </div>
      <footer className="mx-auto max-w-6xl py-8 text-center text-sm text-[color:var(--muted)]">
        <span>KY</span>
        <span className="mx-2">/</span>
        <span>Khazul Yussery</span>
      </footer>
    </section>
  );
}

function Section({ id, eyebrow, title, children }) {
  return (
    <section id={id} className="scroll-mt-24 px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="reveal mb-8 max-w-3xl">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[color:var(--accent)]">{eyebrow}</p>
          <h2 className="mt-3 text-balance text-3xl font-black leading-tight tracking-normal text-[color:var(--text)] sm:text-4xl">{title}</h2>
        </div>
        {children}
      </div>
    </section>
  );
}

function PrimaryLink({ href, icon: Icon, children }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border-2 border-[color:var(--border)] bg-[color:var(--text)] px-5 text-sm font-black text-[color:var(--page-bg)] shadow-retro transition hover:-translate-y-0.5 hover:opacity-90 "
    >
      <Icon size={18} />
      {children}
    </a>
  );
}

function SecondaryLink({ href, icon: Icon, children }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border-2 border-[color:var(--border)] bg-[color:var(--surface)] px-5 text-sm font-black text-[color:var(--text)] transition hover:-translate-y-0.5 hover:border-[color:var(--border)] hover:bg-[color:var(--accent-soft)]"
    >
      <Icon size={18} />
      {children}
    </a>
  );
}

export default App;
