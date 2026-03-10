"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const NOVELS = [
  {
    title: "Sweet Sixteen",
    author: "Bolaji Abdullahi",
    cover: "📘",
    color: "#1e3a5f",
    year: "2013",
    summary: "A coming-of-age story about Ada, a 16-year-old girl whose father writes her letters full of life lessons and wisdom as she transitions into adulthood in Nigeria.",
    themes: ["Growing up", "Father-daughter relationship", "Nigerian culture", "Moral values", "Identity"],
    characters: [
      { name: "Ada", role: "Main character — a 16-year-old girl receiving wisdom from her father" },
      { name: "Ada's Father", role: "A wise Nigerian father who guides his daughter through letters" },
      { name: "Ada's Mother", role: "Supportive mother figure in the family" },
    ],
    chapters: [
      { number: 1, title: "The Letters Begin", summary: "Ada's father begins writing her letters about life as she turns 16." },
      { number: 2, title: "On Friendship", summary: "Father's advice on choosing good friends and avoiding bad influence." },
      { number: 3, title: "On Honesty", summary: "The importance of truth and integrity in life." },
      { number: 4, title: "On Education", summary: "Why education is the key to success in Nigeria." },
      { number: 5, title: "On Love", summary: "Understanding love, relationships and respect." },
    ],
    jamb_tips: [
      "Know the relationship between Ada and her father",
      "Understand the major themes — growing up and moral values",
      "Be able to discuss the role of letters in the novel",
      "Know how Nigerian culture is portrayed",
      "Understand Ada's character development throughout the book",
    ],
  },
  {
    title: "The Lion and the Jewel",
    author: "Wole Soyinka",
    cover: "📗",
    color: "#14532d",
    year: "1963",
    summary: "A play set in the Yoruba village of Ilujinle. It tells the story of Sidi, the village belle, who is pursued by both the young schoolteacher Lakunle and the old village chief Baroka.",
    themes: ["Tradition vs Modernity", "Love and marriage", "Power and manipulation", "Pride and vanity", "African culture"],
    characters: [
      { name: "Sidi", role: "The village belle — beautiful and proud, torn between tradition and modernity" },
      { name: "Baroka", role: "The old village chief (Bale) — cunning and powerful, represents tradition" },
      { name: "Lakunle", role: "Young schoolteacher — represents western education and modernity" },
    ],
    chapters: [
      { number: 1, title: "Morning (Act 1)", summary: "Sidi discovers her photo in a magazine and becomes vain. Lakunle proposes but refuses to pay bride price." },
      { number: 2, title: "Noon (Act 2)", summary: "Baroka tricks Sidi into coming to his palace by pretending to be impotent." },
      { number: 3, title: "Night (Act 3)", summary: "Sidi is seduced by Baroka. She chooses to marry him over Lakunle." },
    ],
    jamb_tips: [
      "Know the three main characters and what they represent",
      "Understand the theme of tradition vs modernity",
      "Know why Sidi chose Baroka over Lakunle",
      "Understand Baroka's trick/manipulation",
      "Know the significance of the magazine photographs",
      "Be able to explain what the 'jewel' symbolizes",
    ],
  },
  {
    title: "Things Fall Apart",
    author: "Chinua Achebe",
    cover: "📙",
    color: "#3b1f1f",
    year: "1958",
    summary: "The story of Okonkwo, a proud Igbo warrior in Nigeria, and how his life and community are disrupted by the arrival of European missionaries and colonial government.",
    themes: ["Tradition vs Change", "Masculinity and pride", "Colonial impact", "Fate and free will", "Culture clash"],
    characters: [
      { name: "Okonkwo", role: "Main character — proud, strong Igbo warrior driven by fear of weakness" },
      { name: "Nwoye", role: "Okonkwo's son who converts to Christianity — represents change" },
      { name: "Ezinma", role: "Okonkwo's favorite daughter — strong and intelligent" },
      { name: "Mr. Brown", role: "Understanding missionary who respects Igbo culture" },
      { name: "Reverend Smith", role: "Aggressive missionary who disrespects Igbo culture" },
    ],
    chapters: [
      { number: 1, title: "Part 1 (Ch 1-13)", summary: "Okonkwo's rise in Umuofia. His fear of failure. Ikemefuna's death. Okonkwo accidentally kills a clansman." },
      { number: 2, title: "Part 2 (Ch 14-19)", summary: "Okonkwo's exile to Mbanta. Missionaries arrive. Nwoye converts to Christianity." },
      { number: 3, title: "Part 3 (Ch 20-25)", summary: "Okonkwo returns. Clash with colonial government. Okonkwo kills a messenger and commits suicide." },
    ],
    jamb_tips: [
      "Know Okonkwo's fatal flaw — excessive pride and fear of weakness",
      "Understand why things 'fall apart' — both for Okonkwo and Igbo society",
      "Know the role of chi (personal god) in Igbo belief",
      "Understand the significance of the title from W.B Yeats poem",
      "Know why Nwoye converts to Christianity",
      "Be able to discuss colonialism's impact in the novel",
    ],
  },
  {
    title: "Weep Not Child",
    author: "Ngugi wa Thiong'o",
    cover: "📕",
    color: "#2a1a2e",
    year: "1964",
    summary: "Set in Kenya during the Mau Mau uprising against British colonial rule. It follows Njoroge, a young boy who believes education will save his people, and how the violence of colonialism destroys his dreams.",
    themes: ["Education and hope", "Colonialism", "Land and identity", "Family and sacrifice", "Loss of innocence"],
    characters: [
      { name: "Njoroge", role: "Main character — optimistic young boy who believes in education" },
      { name: "Ngotho", role: "Njoroge's father — proud man humiliated by land loss" },
      { name: "Mwihaki", role: "Njoroge's love interest — daughter of a collaborator" },
      { name: "Jacobo", role: "African collaborator with the British" },
    ],
    chapters: [
      { number: 1, title: "Part 1 — The Waning Light", summary: "Njoroge starts school with great hope. Family struggles under colonialism." },
      { number: 2, title: "Part 2 — Darkness Falls", summary: "Mau Mau rebellion intensifies. Father tortured. Njoroge's hopes shattered." },
      { number: 3, title: "Conclusion", summary: "Njoroge attempts suicide but is saved. Faces a hopeless future." },
    ],
    jamb_tips: [
      "Know the significance of the title — who weeps and why",
      "Understand how colonialism destroyed African families and land",
      "Know Njoroge's character — his hope and eventual disillusionment",
      "Understand the role of education as a theme",
      "Know the historical context — Mau Mau uprising in Kenya",
      "Be able to discuss the land as a symbol of identity",
    ],
  },
];

export default function JAMBNovel() {
  const router = useRouter();
  const [selected, setSelected] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("summary");

  const tabs = ["summary", "characters", "chapters", "themes", "jamb tips"];

  return (
    <div className="min-h-screen font-sans max-w-md mx-auto pb-10" style={{ background: "#0e1117" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-8 pb-4" style={{ borderBottom: "1px solid #1e2533" }}>
        <button onClick={() => selected ? setSelected(null) : router.push("/")}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white flex-shrink-0" style={{ background: "#1e2533" }}>←</button>
        <div>
          <h1 className="text-white font-bold text-base">📚 JAMB Novels</h1>
          <p className="text-xs" style={{ color: "#6b7280" }}>{selected ? selected.title : "Set books for Literature"}</p>
        </div>
      </div>

      {/* Novel List */}
      {!selected && (
        <div className="px-4 pt-4">
          <div className="rounded-2xl p-4 mb-5" style={{ background: "#13171f", border: "1px solid #1e2533" }}>
            <p className="text-white font-bold text-sm mb-1">📚 JAMB Set Books</p>
            <p className="text-xs leading-relaxed" style={{ color: "#9ca3af" }}>These are the novels you must read for Literature in English. Tap any book to read summaries, characters, themes and JAMB exam tips.</p>
          </div>
          <div className="flex flex-col gap-3">
            {NOVELS.map((novel) => (
              <button key={novel.title} onClick={() => { setSelected(novel); setActiveTab("summary"); }}
                className="rounded-2xl p-4 text-left w-full active:opacity-70 flex items-center gap-4"
                style={{ background: "#13171f", border: "1px solid #1e2533" }}>
                <div className="w-14 h-20 rounded-xl flex items-center justify-center text-4xl flex-shrink-0" style={{ background: novel.color }}>
                  {novel.cover}
                </div>
                <div className="flex-1">
                  <p className="text-white font-bold text-sm">{novel.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: "#9ca3af" }}>{novel.author}</p>
                  <p className="text-xs mt-1" style={{ color: "#6b7280" }}>{novel.year} • {novel.themes.length} themes</p>
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {novel.themes.slice(0, 2).map((t) => (
                      <span key={t} className="text-xs px-2 py-0.5 rounded-lg" style={{ background: "#1e2533", color: "#9ca3af" }}>{t}</span>
                    ))}
                  </div>
                </div>
                <span style={{ color: "#374151" }}>›</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Novel Detail */}
      {selected && (
        <div>
          {/* Book hero */}
          <div className="px-4 pt-4 pb-4" style={{ background: selected.color }}>
            <div className="flex items-center gap-4">
              <div className="text-6xl">{selected.cover}</div>
              <div>
                <p className="text-white font-bold text-xl">{selected.title}</p>
                <p className="text-white text-opacity-80 text-sm">{selected.author}</p>
                <p className="text-white text-opacity-60 text-xs mt-1">{selected.year}</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto px-4 py-3" style={{ scrollbarWidth: "none", borderBottom: "1px solid #1e2533" }}>
            {tabs.map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all"
                style={{ background: activeTab === tab ? "#16a34a" : "#1e2533", color: activeTab === tab ? "#fff" : "#9ca3af" }}>
                {tab}
              </button>
            ))}
          </div>

          <div className="px-4 pt-4">
            {/* Summary */}
            {activeTab === "summary" && (
              <div>
                <div className="rounded-2xl p-4 mb-4" style={{ background: "#13171f", border: "1px solid #1e2533" }}>
                  <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#6b7280" }}>Plot Summary</p>
                  <p className="text-white text-sm leading-relaxed">{selected.summary}</p>
                </div>
                <div className="rounded-2xl p-4" style={{ background: "#13171f", border: "1px solid #1e2533" }}>
                  <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "#6b7280" }}>Main Themes</p>
                  <div className="flex flex-wrap gap-2">
                    {selected.themes.map((t: string) => (
                      <span key={t} className="text-xs px-3 py-1.5 rounded-xl font-medium" style={{ background: selected.color, color: "#fff" }}>{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Characters */}
            {activeTab === "characters" && (
              <div className="flex flex-col gap-3">
                {selected.characters.map((c: any) => (
                  <div key={c.name} className="rounded-2xl p-4" style={{ background: "#13171f", border: "1px solid #1e2533" }}>
                    <p className="text-white font-bold text-sm mb-1">{c.name}</p>
                    <p className="text-xs leading-relaxed" style={{ color: "#9ca3af" }}>{c.role}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Chapters */}
            {activeTab === "chapters" && (
              <div className="flex flex-col gap-3">
                {selected.chapters.map((c: any) => (
                  <div key={c.number} className="rounded-2xl p-4 flex gap-3" style={{ background: "#13171f", border: "1px solid #1e2533" }}>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm" style={{ background: selected.color, color: "#fff" }}>{c.number}</div>
                    <div>
                      <p className="text-white font-bold text-sm">{c.title}</p>
                      <p className="text-xs mt-1 leading-relaxed" style={{ color: "#9ca3af" }}>{c.summary}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Themes */}
            {activeTab === "themes" && (
              <div className="flex flex-col gap-3">
                {selected.themes.map((theme: string) => (
                  <div key={theme} className="rounded-2xl p-4" style={{ background: "#13171f", border: "1px solid #1e2533" }}>
                    <p className="text-white font-bold text-sm mb-1">📌 {theme}</p>
                    <p className="text-xs leading-relaxed" style={{ color: "#9ca3af" }}>
                      This is a major theme in {selected.title}. JAMB frequently asks questions about how this theme is developed throughout the novel.
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* JAMB Tips */}
            {activeTab === "jamb tips" && (
              <div>
                <div className="rounded-2xl p-4 mb-3" style={{ background: "#1a2a0a", border: "1px solid #365314" }}>
                  <p className="font-bold text-sm mb-1" style={{ color: "#84cc16" }}>💡 JAMB Exam Tips for {selected.title}</p>
                  <p className="text-xs" style={{ color: "#a3e635" }}>These are the most commonly tested areas for this novel!</p>
                </div>
                <div className="flex flex-col gap-2">
                  {selected.jamb_tips.map((tip: string, i: number) => (
                    <div key={i} className="rounded-2xl p-4 flex gap-3" style={{ background: "#13171f", border: "1px solid #1e2533" }}>
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold" style={{ background: "#14532d", color: "#4ade80" }}>{i + 1}</div>
                      <p className="text-white text-sm leading-relaxed">{tip}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
