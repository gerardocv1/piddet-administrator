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
export const CloseIcon = (p) => <Svg strokeWidth={2.4} {...p}><path d="M6 6l12 12M18 6L6 18" /></Svg>;
export const PhoneIcon = (p) => <Svg {...p}><rect x="6" y="2.5" width="12" height="19" rx="3" /><path d="M11 18.5h2" /></Svg>;
export const DownloadIcon = (p) => <Svg strokeWidth={2.4} {...p}><path d="M12 4v11M7 10l5 5 5-5M5 20h14" /></Svg>;
// Compartir de iOS: el cuadro con la flecha hacia arriba.
export const ShareIosIcon = (p) => <Svg {...p}><path d="M12 3v12M8 7l4-4 4 4" /><path d="M8 10H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-2" /></Svg>;
export const AddSquareIcon = (p) => <Svg {...p}><rect x="3.5" y="3.5" width="17" height="17" rx="4" /><path d="M12 8v8M8 12h8" /></Svg>;
export const DotsVerticalIcon = (p) => <Svg strokeWidth={3} {...p}><path d="M12 5h.01M12 12h.01M12 19h.01" /></Svg>;
export const LinkIcon = (p) => <Svg {...p}><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></Svg>;
export const BoltIcon = (p) => <Svg {...p}><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" /></Svg>;
export const LockIcon = (p) => <Svg {...p}><rect x="4.5" y="10.5" width="15" height="10" rx="2.5" /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" /></Svg>;
export const WifiOffIcon = (p) => <Svg {...p}><path d="M3 3l18 18M8.5 16.5a5 5 0 0 1 7 0M5 12.9a10 10 0 0 1 4.2-2.4M19 12.9a10 10 0 0 0-3-2M2 8.8a15 15 0 0 1 4.3-2.6M22 8.8A15 15 0 0 0 10.6 5M12 20h.01" /></Svg>;
export const UserIcon = (p) => <Svg {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></Svg>;
export const CameraIcon = (p) => <Svg {...p}><path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" /><circle cx="12" cy="13.5" r="3.5" /></Svg>;
export const TrashIcon = (p) => <Svg {...p}><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /></Svg>;
export const RotateIcon = (p) => <Svg {...p}><path d="M20 11a8 8 0 1 1-2.3-5.7L20 8" /><path d="M20 3v5h-5" /></Svg>;
export const MinusIcon = (p) => <Svg strokeWidth={2.6} {...p}><path d="M6 12h12" /></Svg>;
export const PlusIcon = (p) => <Svg strokeWidth={2.6} {...p}><path d="M12 6v12M6 12h12" /></Svg>;
export const PinIcon = (p) => <Svg {...p}><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></Svg>;
export const PhoneCallIcon = (p) => <Svg {...p}><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" /></Svg>;
export const NavigationIcon = (p) => <Svg {...p}><path d="M3 11l18-8-8 18-2-8-8-2z" /></Svg>;
