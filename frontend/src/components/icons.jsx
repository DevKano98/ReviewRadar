function resolveSize(fontSize, sx) {
  if (sx?.fontSize) return sx.fontSize;
  if (fontSize === 'small') return 20;
  if (fontSize === 'inherit') return '1em';
  return 24;
}

function IconBase({
  children,
  className = '',
  fontSize,
  sx,
  viewBox = '0 0 24 24',
  fill = 'none',
  stroke = 'currentColor',
  strokeWidth = 2,
  ...props
}) {
  const size = resolveSize(fontSize, sx);

  return (
    <svg
      viewBox={viewBox}
      width={size}
      height={size}
      className={className}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function ArrowBackIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </IconBase>
  );
}

export function ShareIcon(props) {
  return (
    <IconBase {...props}>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="m8.6 13.5 6.8 4" />
      <path d="m15.4 6.5-6.8 4" />
    </IconBase>
  );
}

export function ErrorOutlineIcon(props) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v6" />
      <circle cx="12" cy="16.5" r="1" fill="currentColor" stroke="none" />
    </IconBase>
  );
}

export function SecurityIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M12 3 5 6v5c0 4.6 2.9 8.9 7 10 4.1-1.1 7-5.4 7-10V6l-7-3Z" />
      <path d="M12 8v8" />
      <path d="M9 11h6" />
    </IconBase>
  );
}

export function ContentPasteSearchIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M9 4h6" />
      <path d="M10 2h4v4h-4z" />
      <path d="M7 5H5v15h9" />
      <path d="M17 10h2v2" />
      <circle cx="17" cy="17" r="3.5" />
      <path d="m19.5 19.5 2 2" />
    </IconBase>
  );
}

export function PsychologyIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M9.5 8.5a2.5 2.5 0 1 1 3.5 2.3V12" />
      <path d="M12 16h.01" />
      <path d="M8 6a7 7 0 1 1 8 11.2V21l-4-2-4 2v-3.8A7 7 0 0 1 8 6Z" />
    </IconBase>
  );
}

export function GavelIcon(props) {
  return (
    <IconBase {...props}>
      <path d="m14 6 4 4" />
      <path d="m12 8 4 4" />
      <path d="m5 19 8-8" />
      <path d="m3 21 6-6" />
      <path d="m14 4 2-2 6 6-2 2z" />
    </IconBase>
  );
}

export function ContentPasteIcon(props) {
  return (
    <IconBase {...props}>
      <rect x="7" y="2" width="10" height="4" rx="1" />
      <path d="M9 4H6a2 2 0 0 0-2 2v14h16V6a2 2 0 0 0-2-2h-3" />
      <path d="M8 10h8" />
      <path d="M8 14h8" />
    </IconBase>
  );
}

export function SearchIcon(props) {
  return (
    <IconBase {...props}>
      <circle cx="11" cy="11" r="6" />
      <path d="m20 20-4.2-4.2" />
    </IconBase>
  );
}

export function ShoppingCartIcon(props) {
  return (
    <IconBase {...props}>
      <circle cx="9" cy="19" r="1.5" />
      <circle cx="17" cy="19" r="1.5" />
      <path d="M3 4h2l2.2 10.2A2 2 0 0 0 9.2 16H17a2 2 0 0 0 1.9-1.4L21 8H7" />
    </IconBase>
  );
}

export function LocalMallIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M6 8h12l-1 11H7L6 8Z" />
      <path d="M9 8a3 3 0 1 1 6 0" />
    </IconBase>
  );
}

export function TerminalIcon(props) {
  return (
    <IconBase {...props}>
      <path d="m4 6 5 6-5 6" />
      <path d="M12 18h8" />
    </IconBase>
  );
}

export function FilterListIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M4 7h16" />
      <path d="M7 12h10" />
      <path d="M10 17h4" />
    </IconBase>
  );
}

export function StarIcon(props) {
  return (
    <IconBase {...props} fill="currentColor" stroke="none">
      <path d="m12 2.5 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3.1-5.8 3.1 1.1-6.5L2.6 9.3l6.5-.9L12 2.5Z" />
    </IconBase>
  );
}

export function VerifiedIcon(props) {
  return (
    <IconBase {...props}>
      <path d="m9 12 2 2 4-4" />
      <path d="M12 3 9.5 5.5 6 6l-.5 3.5L3 12l2.5 2.5L6 18l3.5.5L12 21l2.5-2.5L18 18l.5-3.5L21 12l-2.5-2.5L18 6l-3.5-.5L12 3Z" />
    </IconBase>
  );
}

export function ExpandMoreIcon(props) {
  return (
    <IconBase {...props}>
      <path d="m6 9 6 6 6-6" />
    </IconBase>
  );
}

export function CheckCircleOutlineIcon(props) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12.5 2.5 2.5 4.5-5" />
    </IconBase>
  );
}

export function HighlightOffIcon(props) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m9 9 6 6" />
      <path d="m15 9-6 6" />
    </IconBase>
  );
}

export function AutoAwesomeIcon(props) {
  return (
    <IconBase {...props}>
      <path d="m12 3 1.2 3.3L16.5 7.5l-3.3 1.2L12 12l-1.2-3.3L7.5 7.5l3.3-1.2L12 3Z" />
      <path d="m18 13 .8 2.2L21 16l-2.2.8L18 19l-.8-2.2L15 16l2.2-.8L18 13Z" />
      <path d="m6 14 .9 2.3L9.2 17l-2.3.7L6 20l-.9-2.3L2.8 17l2.3-.7L6 14Z" />
    </IconBase>
  );
}
