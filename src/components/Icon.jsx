const paths = {
  device: <><rect x="3" y="4" width="18" height="13" rx="2" /><path d="M8 21h8M12 17v4" /></>,
  profile: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></>,
  video: <><rect x="3" y="6" width="12" height="12" rx="2" /><path d="m15 10 6-3v10l-6-3" /></>,
  network: <><rect x="9" y="3" width="6" height="5" rx="1" /><rect x="3" y="16" width="6" height="5" rx="1" /><rect x="15" y="16" width="6" height="5" rx="1" /><path d="M12 8v4M6 16v-4h12v4" /></>,
  ndi: <><path d="M4 8v8M8 5v14M12 9v6M16 3v18M20 7v10" /></>,
  system: <><circle cx="12" cy="12" r="3" /><path d="m10 3-1 3-3 1-3-1-1 4 3 2-1 3-2 2 3 3 3-2 3 1 2 3 4-1v-3l2-2 3-1-1-4-3-1-1-3 1-3-4-1-2 3z" transform="translate(1 -1) scale(.9)" /></>,
  help: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 2-2.5 2-2.5 4M12 17h.01" /></>,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  plus: <path d="M12 5v14M5 12h14" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 6v6l4 3" /></>,
  chevron: <path d="m7 10 5 5 5-5" />,
  search: <><circle cx="10" cy="10" r="6" /><path d="m15 15 5 5" /></>,
  camera: <><rect x="5" y="4" width="14" height="12" rx="4" /><circle cx="12" cy="10" r="3" /><path d="M9 16v3M15 16v3M5 20h14" /></>,
}

export default function Icon({ name, size = 20, ...props }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name]}</svg>
}
