import React from "react";

// Home loading animation (≥5s):
// 1) Full-screen leadership image fades out over ~2.5s to white
// 2) One circular ring forms sequentially: saffron → green → white (each 1s)
// 3) Inner white disc fades in; Ashok Chakra emerges centered
// 4) "SAHAYAK" appears below in bold caps
export function LogoLoader({ size = 320 }: { size?: number }) {

  const saffron = "#ff9933";
  const green = "#138808";
  const chakraBlue = "#0a3b8f";

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-white">
      {/* Tricolor sequential circle */}
      <svg viewBox="0 0 240 260" width={size} height={size} className="relative">
        <g transform="translate(120 120)">
          {/* Use pathLength to make thirds easy: 300 units total */}
          <circle r="86" fill="none" stroke={saffron} strokeWidth="12" pathLength={300} className="arc arc-1" transform="rotate(-90)" />
          <circle r="86" fill="none" stroke={green} strokeWidth="12" pathLength={300} className="arc arc-2" transform="rotate(30)" />
          <circle r="86" fill="none" stroke="#ffffff" strokeWidth="12" pathLength={300} className="arc arc-3" transform="rotate(150)" />

          {/* 3) Inner white disc + chakra */}
          <g className="chakra-wrap">
            <circle r="54" fill="#ffffff" className="inner-disc" />
            <g className="chakra" transform="translate(0 0)">
              <circle r="18" fill="none" stroke={chakraBlue} strokeWidth="3" />
              <circle r="2.5" fill={chakraBlue} />
              {Array.from({ length: 24 }).map((_, i) => (
                <line key={i} x1="0" y1="3" x2="0" y2="16" stroke={chakraBlue} strokeWidth="2" transform={`rotate(${(360 / 24) * i})`} />
              ))}
            </g>
          </g>
        </g>
      </svg>

      {/* 4) Brand text */}
      <div className="anim-text relative -mt-6 text-4xl font-extrabold tracking-wide text-black">SAHAYAK</div>

      <style>{`
        /* Timings (s):
           0.0–2.5 image fade-out to white
           1.2–3.6 arcs draw (0.8s each sequential, overlapped with fade)
           3.6–4.8 inner disc + chakra appear
           4.9–6.0 text appears */

        /* Arcs: use pathLength=300 so 100 units = third of circumference */
        .arc { stroke-dasharray: 100 200; stroke-dashoffset: 100; }
        .arc-1 { animation: dashDraw .8s cubic-bezier(.22,1,.36,1) 1.2s forwards; }
        .arc-2 { animation: dashDraw .8s cubic-bezier(.22,1,.36,1) 2.0s forwards; stroke-dashoffset: 100; }
        .arc-3 { animation: dashDraw .8s cubic-bezier(.22,1,.36,1) 2.8s forwards; stroke-dashoffset: 100; }

        @keyframes dashDraw { from { stroke-dashoffset: 100; } to { stroke-dashoffset: 0; } }

        /* Inner disc + chakra */
        @keyframes discIn { from { opacity:0; transform: scale(.9); } to { opacity:1; transform: scale(1); } }
        @keyframes chakraIn { from { opacity:0; transform: scale(.9) rotate(0deg); } to { opacity:1; transform: scale(1) rotate(360deg); } }
        .chakra-wrap { opacity: 0; animation: discIn 1s ease 3.6s forwards; transform-origin: center; }
        .chakra { opacity: 0; animation: chakraIn 1.2s ease 3.6s forwards; transform-origin: center; }

        /* Text */
        @keyframes textIn { from { opacity:0; transform: translateY(10px); } to { opacity:1; transform: translateY(0); } }
        .anim-text { opacity: 0; animation: textIn 1.1s ease 4.9s forwards; }
      `}</style>
    </div>
  );
}
