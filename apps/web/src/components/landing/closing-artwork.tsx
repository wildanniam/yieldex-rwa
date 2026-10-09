import { useId } from 'react';

/** Decorative, original vector scenes. Numerical meaning remains in adjacent HTML. */
export function OutcomeArtwork() {
  const id = useId();
  return (
    <svg viewBox="0 0 420 270" fill="none" aria-hidden="true">
      <defs>
        <linearGradient
          id={`${id}-glass`}
          x1="104"
          y1="32"
          x2="296"
          y2="225"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#688679" stopOpacity=".5" />
          <stop offset=".42" stopColor="#132923" />
          <stop offset="1" stopColor="#071611" />
        </linearGradient>
        <linearGradient
          id={`${id}-rim`}
          x1="104"
          y1="38"
          x2="294"
          y2="224"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#d7ecdb" stopOpacity=".65" />
          <stop offset=".5" stopColor="#93b8a1" stopOpacity=".12" />
          <stop offset="1" stopColor="#769a85" stopOpacity=".5" />
        </linearGradient>
        <radialGradient id={`${id}-light`}>
          <stop stopColor="#abd1b4" stopOpacity=".17" />
          <stop offset="1" stopColor="#abd1b4" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="211" cy="157" rx="163" ry="111" fill={`url(#${id}-light)`} />
      <ellipse cx="213" cy="231" rx="103" ry="14" fill="#000" opacity=".3" />
      <path
        d="M30 170h66m229-67h65M49 179h47m229-67h49"
        stroke="#91b9a0"
        strokeOpacity=".15"
      />
      <g transform="rotate(-9 210 130)">
        <rect
          x="120"
          y="46"
          width="186"
          height="178"
          rx="18"
          fill="#091a14"
          stroke="#5b8068"
          strokeOpacity=".2"
        />
        <rect
          x="110"
          y="37"
          width="186"
          height="178"
          rx="18"
          fill={`url(#${id}-glass)`}
          stroke={`url(#${id}-rim)`}
        />
        <path d="M128 64h150M128 181h150" stroke="#a9c6b3" strokeOpacity=".2" />
        <circle cx="130" cy="52" r="2" fill="#acd0b3" />
        <path d="M139 52h30m85 0h21" stroke="#b2d5bd" strokeOpacity=".5" />
        <circle
          cx="203"
          cy="123"
          r="43"
          stroke="#b6cdbd"
          strokeOpacity=".16"
          strokeWidth="9"
        />
        <circle
          cx="203"
          cy="123"
          r="43"
          stroke="#bdcdb4"
          strokeWidth="2"
          strokeDasharray="1 9"
        />
        <circle cx="203" cy="80" r="4" fill="#e0e9cc" />
        <text
          x="203"
          y="141"
          textAnchor="middle"
          fontSize="52"
          fontWeight="300"
          fill="#d9e2cd"
        >
          0
        </text>
        <path
          d="M135 198h46m53 0h38"
          stroke="#a4c0ac"
          strokeOpacity=".4"
          strokeLinecap="round"
        />
      </g>
      <g transform="rotate(6 293 180)">
        <rect
          x="260"
          y="155"
          width="107"
          height="51"
          rx="10"
          fill="#16271f"
          stroke="#aac3a6"
          strokeOpacity=".4"
        />
        <path
          d="M275 171h24m-24 7h15"
          stroke="#bdd0b4"
          strokeOpacity=".5"
          strokeLinecap="round"
        />
        <path
          d="M316 181h25"
          stroke="#d2d5b3"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M275 194h23" stroke="#bdd0b4" strokeOpacity=".3" />
      </g>
    </svg>
  );
}

export function YieldexSculpture() {
  const id = useId();
  return (
    <svg viewBox="0 0 460 400" fill="none" aria-hidden="true">
      <defs>
        <linearGradient
          id={`${id}-face`}
          x1="159"
          y1="79"
          x2="288"
          y2="252"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#e1f4c7" />
          <stop offset=".3" stopColor="#a9d392" />
          <stop offset=".57" stopColor="#71b67c" />
          <stop offset="1" stopColor="#28634a" />
        </linearGradient>
        <linearGradient
          id={`${id}-side`}
          x1="219"
          y1="120"
          x2="291"
          y2="261"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#94c19c" />
          <stop offset=".45" stopColor="#294f3b" />
          <stop offset="1" stopColor="#0b251d" />
        </linearGradient>
        <linearGradient
          id={`${id}-top`}
          x1="204"
          y1="86"
          x2="316"
          y2="152"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#d2edba" />
          <stop offset=".5" stopColor="#75a980" />
          <stop offset="1" stopColor="#356748" />
        </linearGradient>
        <linearGradient
          id={`${id}-base`}
          x1="123"
          y1="259"
          x2="338"
          y2="315"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#8bad9166" />
          <stop offset=".5" stopColor="#264636" />
          <stop offset="1" stopColor="#0c211b" />
        </linearGradient>
        <radialGradient id={`${id}-halo`}>
          <stop stopColor="#9bd7a1" stopOpacity=".2" />
          <stop offset="1" stopColor="#6cbb94" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="234" cy="219" rx="202" ry="157" fill={`url(#${id}-halo)`} />
      <ellipse
        cx="233"
        cy="282"
        rx="180"
        ry="64"
        transform="rotate(-12 233 282)"
        stroke="#aed0b4"
        strokeOpacity=".13"
      />
      <ellipse
        cx="233"
        cy="282"
        rx="155"
        ry="48"
        transform="rotate(-12 233 282)"
        stroke="#aed0b4"
        strokeOpacity=".08"
        strokeDasharray="2 7"
      />
      <path d="m72 302 161-30 168-52" stroke="#a4d3b3" strokeOpacity=".3" />
      <circle cx="72" cy="302" r="3" fill="#abcbb0" />
      <circle cx="401" cy="220" r="3" fill="#abcbb0" />
      <ellipse cx="233" cy="297" rx="89" ry="21" fill="#020906" opacity=".6" />
      <path
        d="m132 263 95-39 108 37v15l-95 43-108-40Z"
        fill="#10251b"
        stroke="#85ae9133"
      />
      <path
        d="m132 263 95-39 108 37-95 43Z"
        fill={`url(#${id}-base)`}
        stroke="#bfdfbb55"
      />
      <path
        d="m143 264 84-34 96 32-84 36Z"
        stroke="#c6e7c1"
        strokeOpacity=".18"
      />
      <path d="m132 271 108 39 95-42" stroke="#9ecbab" strokeOpacity=".25" />
      <g data-sculpture-float="true">
        <path d="m152 89 63-9 80 151-62 12Z" fill={`url(#${id}-face)`} />
        <path d="m215 80 13 8 80 151-13-8Z" fill="#b4d4a2" />
        <path d="m233 243 62-12 13 8-62 13Z" fill="#447c58" />
        <path d="m152 89 13 9 81 154-13-9Z" fill={`url(#${id}-side)`} />
        <path d="m215 80 81-10-43 90-31-57Z" fill={`url(#${id}-top)`} />
        <path d="m296 70 12 8-43 90-12-8Z" fill="#234932" />
        <path d="m176 155 31 59-28 42-60-3Z" fill={`url(#${id}-face)`} />
        <path d="m119 253 60 3 12 8-60-3Z" fill="#568469" />
        <path d="m207 214 12 8-28 42-12-8Z" fill={`url(#${id}-side)`} />
        <path
          d="m153 89 61-8 81-10M154 91l79 151M176 155l30 59"
          stroke="#ecffe0"
          strokeOpacity=".45"
        />
        <path
          d="m186 94 31 55"
          stroke="#efffe2"
          strokeOpacity=".25"
          strokeWidth="9"
        />
      </g>
    </svg>
  );
}
