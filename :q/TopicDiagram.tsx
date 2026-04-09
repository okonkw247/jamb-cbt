"use client";

type Props = { subject: string; topic: string; };

export default function TopicDiagram({ subject, topic }: Props) {
  const key = `${subject}:${topic}`.toLowerCase();

  // BIOLOGY - Photosynthesis
  if (key.includes("photosynthesis")) return (
    <svg viewBox="0 0 320 200" className="w-full rounded-2xl" style={{ background: "#0f1f10" }}>
      {/* Leaf shape */}
      <ellipse cx="160" cy="100" rx="120" ry="70" fill="#14532d" stroke="#4ade80" strokeWidth="2" />
      {/* Midrib */}
      <line x1="60" y1="100" x2="260" y2="100" stroke="#86efac" strokeWidth="2" />
      {/* Veins */}
      <line x1="120" y1="100" x2="100" y2="70" stroke="#86efac" strokeWidth="1" />
      <line x1="150" y1="100" x2="130" y2="65" stroke="#86efac" strokeWidth="1" />
      <line x1="180" y1="100" x2="170" y2="62" stroke="#86efac" strokeWidth="1" />
      <line x1="120" y1="100" x2="105" y2="130" stroke="#86efac" strokeWidth="1" />
      <line x1="150" y1="100" x2="138" y2="135" stroke="#86efac" strokeWidth="1" />
      {/* Sun */}
      <circle cx="40" cy="30" r="18" fill="#fbbf24" />
      <line x1="40" y1="8" x2="40" y2="2" stroke="#fbbf24" strokeWidth="2" />
      <line x1="58" y1="14" x2="63" y2="9" stroke="#fbbf24" strokeWidth="2" />
      <line x1="62" y1="30" x2="68" y2="30" stroke="#fbbf24" strokeWidth="2" />
      {/* Arrow: sunlight to leaf */}
      <line x1="58" y1="40" x2="90" y2="75" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="4" />
      <polygon points="90,75 82,68 96,68" fill="#fbbf24" />
      {/* CO2 arrow in */}
      <text x="5" y="115" fontSize="9" fill="#93c5fd">CO₂</text>
      <line x1="35" y1="112" x2="58" y2="105" stroke="#93c5fd" strokeWidth="1.5" />
      <polygon points="58,105 50,100 50,110" fill="#93c5fd" />
      {/* Water arrow in */}
      <text x="5" y="145" fontSize="9" fill="#38bdf8">H₂O</text>
      <line x1="35" y1="142" x2="58" y2="118" stroke="#38bdf8" strokeWidth="1.5" />
      <polygon points="58,118 50,113 50,123" fill="#38bdf8" />
      {/* O2 arrow out */}
      <text x="270" y="85" fontSize="9" fill="#a3e635">O₂</text>
      <line x1="260" y1="90" x2="268" y2="87" stroke="#a3e635" strokeWidth="1.5" />
      <polygon points="270,84 264,90 274,90" fill="#a3e635" />
      {/* Glucose arrow out */}
      <text x="255" y="115" fontSize="8" fill="#fb923c">Glucose</text>
      <line x1="258" y1="110" x2="268" y2="107" stroke="#fb923c" strokeWidth="1.5" />
      {/* Labels */}
      <text x="130" y="97" fontSize="9" fill="#4ade80" fontWeight="bold">Chloroplast</text>
      <text x="100" y="170" fontSize="8" fill="#d1d5db">6CO₂ + 6H₂O + Light → C₆H₁₂O₆ + 6O₂</text>
    </svg>
  );

  // PHYSICS - Forces
  if (key.includes("force")) return (
    <svg viewBox="0 0 320 200" className="w-full rounded-2xl" style={{ background: "#0f172a" }}>
      {/* Box */}
      <rect x="110" y="80" width="100" height="60" fill="#1e3a5f" stroke="#60a5fa" strokeWidth="2" rx="4" />
      <text x="150" y="115" fontSize="11" fill="#93c5fd" textAnchor="middle">Object</text>
      <text x="150" y="128" fontSize="9" fill="#6b7280" textAnchor="middle">mass = m</text>
      {/* Applied Force - right */}
      <line x1="210" y1="110" x2="270" y2="110" stroke="#4ade80" strokeWidth="3" />
      <polygon points="270,110 258,104 258,116" fill="#4ade80" />
      <text x="235" y="100" fontSize="9" fill="#4ade80">Applied Force</text>
      {/* Friction - left */}
      <line x1="110" y1="110" x2="50" y2="110" stroke="#f87171" strokeWidth="3" />
      <polygon points="50,110 62,104 62,116" fill="#f87171" />
      <text x="52" y="100" fontSize="9" fill="#f87171">Friction</text>
      {/* Weight - down */}
      <line x1="160" y1="140" x2="160" y2="185" stroke="#fbbf24" strokeWidth="3" />
      <polygon points="160,185 154,173 166,173" fill="#fbbf24" />
      <text x="168" y="170" fontSize="9" fill="#fbbf24">Weight (mg)</text>
      {/* Normal - up */}
      <line x1="160" y1="80" x2="160" y2="35" stroke="#a78bfa" strokeWidth="3" />
      <polygon points="160,35 154,47 166,47" fill="#a78bfa" />
      <text x="168" y="55" fontSize="9" fill="#a78bfa">Normal (N)</text>
      {/* Formula */}
      <text x="160" y="20" fontSize="10" fill="#e2e8f0" textAnchor="middle" fontWeight="bold">F = ma (Newton's 2nd Law)</text>
      {/* Surface */}
      <line x1="80" y1="140" x2="240" y2="140" stroke="#374151" strokeWidth="2" strokeDasharray="5" />
      <text x="160" y="195" fontSize="8" fill="#6b7280" textAnchor="middle">Net Force = Applied Force - Friction</text>
    </svg>
  );

  // BIOLOGY - Cell
  if (key.includes("cell")) return (
    <svg viewBox="0 0 320 200" className="w-full rounded-2xl" style={{ background: "#0f1f10" }}>
      {/* Cell membrane */}
      <ellipse cx="160" cy="100" rx="140" ry="85" fill="#1a2e1a" stroke="#4ade80" strokeWidth="2" />
      {/* Nucleus */}
      <ellipse cx="145" cy="95" rx="40" ry="30" fill="#1e3a5f" stroke="#60a5fa" strokeWidth="2" />
      <text x="145" y="98" fontSize="8" fill="#93c5fd" textAnchor="middle">Nucleus</text>
      {/* Nucleolus */}
      <circle cx="145" cy="92" r="8" fill="#1e40af" />
      <text x="145" y="114" fontSize="7" fill="#93c5fd" textAnchor="middle">Nucleolus</text>
      {/* Mitochondria */}
      <ellipse cx="230" cy="80" rx="22" ry="12" fill="#451a03" stroke="#fb923c" strokeWidth="1.5" />
      <text x="230" y="83" fontSize="7" fill="#fb923c" textAnchor="middle">Mitochondria</text>
      {/* Vacuole */}
      <circle cx="200" cy="130" r="18" fill="#1e3a3a" stroke="#22d3ee" strokeWidth="1.5" />
      <text x="200" y="133" fontSize="7" fill="#22d3ee" textAnchor="middle">Vacuole</text>
      {/* Chloroplast */}
      <ellipse cx="80" cy="75" rx="20" ry="11" fill="#14532d" stroke="#86efac" strokeWidth="1.5" />
      <text x="80" y="78" fontSize="7" fill="#86efac" textAnchor="middle">Chloroplast</text>
      {/* Ribosome */}
      <circle cx="100" cy="130" r="5" fill="#7c3aed" />
      <text x="100" y="145" fontSize="7" fill="#a78bfa" textAnchor="middle">Ribosome</text>
      {/* Cell wall */}
      <ellipse cx="160" cy="100" rx="148" ry="90" fill="none" stroke="#86efac" strokeWidth="1" strokeDasharray="5" />
      <text x="280" y="50" fontSize="7" fill="#86efac">Cell Wall</text>
      <text x="160" y="190" fontSize="8" fill="#6b7280" textAnchor="middle">Plant Cell Structure</text>
    </svg>
  );

  // CHEMISTRY - Atomic Structure
  if (key.includes("atom")) return (
    <svg viewBox="0 0 320 200" className="w-full rounded-2xl" style={{ background: "#0f0f1a" }}>
      {/* Nucleus */}
      <circle cx="160" cy="100" r="20" fill="#450a0a" stroke="#f87171" strokeWidth="2" />
      <text x="160" y="97" fontSize="8" fill="#fca5a5" textAnchor="middle">Protons</text>
      <text x="160" y="107" fontSize="8" fill="#fca5a5" textAnchor="middle">Neutrons</text>
      {/* Orbits */}
      <ellipse cx="160" cy="100" rx="55" ry="30" fill="none" stroke="#374151" strokeWidth="1" />
      <ellipse cx="160" cy="100" rx="90" ry="50" fill="none" stroke="#374151" strokeWidth="1" />
      <ellipse cx="160" cy="100" rx="125" ry="68" fill="none" stroke="#374151" strokeWidth="1" />
      {/* Electrons - orbit 1 */}
      <circle cx="215" cy="100" r="5" fill="#60a5fa" />
      <circle cx="105" cy="100" r="5" fill="#60a5fa" />
      {/* Electrons - orbit 2 */}
      <circle cx="250" cy="100" r="5" fill="#a78bfa" />
      <circle cx="70" cy="100" r="5" fill="#a78bfa" />
      <circle cx="160" cy="50" r="5" fill="#a78bfa" />
      <circle cx="160" cy="150" r="5" fill="#a78bfa" />
      {/* Electrons - orbit 3 */}
      <circle cx="285" cy="100" r="5" fill="#34d399" />
      <circle cx="35" cy="100" r="5" fill="#34d399" />
      <circle cx="160" cy="32" r="5" fill="#34d399" />
      <circle cx="160" cy="168" r="5" fill="#34d399" />
      {/* Labels */}
      <text x="220" y="90" fontSize="8" fill="#93c5fd">e⁻</text>
      <text x="255" y="90" fontSize="8" fill="#c4b5fd">e⁻</text>
      <text x="30" y="175" fontSize="8" fill="#d1d5db">Electrons orbit the nucleus in shells</text>
      <text x="160" y="192" fontSize="8" fill="#6b7280" textAnchor="middle">Atomic Structure (Bohr Model)</text>
    </svg>
  );

  // PHYSICS - Motion
  if (key.includes("motion")) return (
    <svg viewBox="0 0 320 200" className="w-full rounded-2xl" style={{ background: "#0f172a" }}>
      {/* Velocity-time graph */}
      <line x1="40" y1="20" x2="40" y2="160" stroke="#e2e8f0" strokeWidth="2" />
      <line x1="40" y1="160" x2="300" y2="160" stroke="#e2e8f0" strokeWidth="2" />
      {/* Axis labels */}
      <text x="20" y="90" fontSize="9" fill="#9ca3af" transform="rotate(-90,20,90)">Velocity</text>
      <text x="160" y="178" fontSize="9" fill="#9ca3af" textAnchor="middle">Time</text>
      {/* Uniform acceleration line */}
      <line x1="40" y1="150" x2="150" y2="60" stroke="#4ade80" strokeWidth="2.5" />
      {/* Uniform velocity */}
      <line x1="150" y1="60" x2="220" y2="60" stroke="#60a5fa" strokeWidth="2.5" />
      {/* Deceleration */}
      <line x1="220" y1="60" x2="290" y2="150" stroke="#f87171" strokeWidth="2.5" />
      {/* Labels */}
      <text x="75" y="120" fontSize="8" fill="#4ade80">Acceleration</text>
      <text x="155" y="50" fontSize="8" fill="#60a5fa">Constant v</text>
      <text x="240" y="100" fontSize="8" fill="#f87171">Deceleration</text>
      {/* Formulas */}
      <text x="160" y="15" fontSize="9" fill="#e2e8f0" textAnchor="middle" fontWeight="bold">v = u + at | s = ut + ½at²</text>
      <text x="160" y="192" fontSize="8" fill="#6b7280" textAnchor="middle">Velocity-Time Graph</text>
    </svg>
  );

  // DEFAULT - generic diagram
  return (
    <svg viewBox="0 0 320 160" className="w-full rounded-2xl" style={{ background: "#13171f" }}>
      <text x="160" y="70" fontSize="14" fill="#4ade80" textAnchor="middle" fontWeight="bold">{topic}</text>
      <text x="160" y="90" fontSize="10" fill="#6b7280" textAnchor="middle">{subject}</text>
      <text x="160" y="115" fontSize="9" fill="#374151" textAnchor="middle">Visual diagram for this topic</text>
      <rect x="40" y="40" width="240" height="80" fill="none" stroke="#1e2533" strokeWidth="2" rx="12" />
    </svg>
  );
}
