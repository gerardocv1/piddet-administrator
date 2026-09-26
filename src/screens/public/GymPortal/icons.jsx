import React from 'react';

// Iconos de trazo del portal del afiliado (los mismos del diseño aprobado). Heredan el color del
// texto (`currentColor`) salvo que la hoja de estilos del contenedor diga otra cosa.
const Svg = ({ size = 20, strokeWidth = 2.2, className, children }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    {children}
  </svg>
);

export const DumbbellIcon = (p) => <Svg strokeWidth={2.6} {...p}><path d="M6 8v8M3 10v4M18 8v8M21 10v4M6 12h12" /></Svg>;
export const ChevronDownIcon = (p) => <Svg strokeWidth={2.4} {...p}><path d="M6 9l6 6 6-6" /></Svg>;
export const ArrowRightIcon = (p) => <Svg strokeWidth={2.6} {...p}><path d="M5 12h14M13 6l6 6-6 6" /></Svg>;
export const LogoutIcon = (p) => <Svg {...p}><path d="M10 17l5-5-5-5M15 12H3M21 3v18" /></Svg>;
export const CheckIcon = (p) => <Svg strokeWidth={3} {...p}><path d="M5 12l5 5L20 7" /></Svg>;
export const AlertIcon = (p) => <Svg strokeWidth={3} {...p}><path d="M12 7v6M12 17h.01" /></Svg>;
export const CardIcon = (p) => <Svg {...p}><rect x="3" y="5" width="18" height="14" rx="3" /><path d="M3 10h18M7 15h4" /></Svg>;
export const TrendIcon = (p) => <Svg {...p}><path d="M3 17l6-6 4 4 8-8" /><path d="M14 7h7v7" /></Svg>;
export const CashIcon = (p) => <Svg {...p}><rect x="3" y="6" width="18" height="12" rx="2" /><circle cx="12" cy="12" r="2.5" /></Svg>;
export const ClockIcon = (p) => <Svg strokeWidth={1.8} {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Svg>;
export const ChatIcon = (p) => <Svg {...p}><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-5A8 8 0 1 1 21 12z" /></Svg>;
export const CalendarIcon = (p) => <Svg strokeWidth={2.4} {...p}><rect x="3" y="4" width="18" height="17" rx="3" /><path d="M3 9h18M8 2v4M16 2v4" /></Svg>;
