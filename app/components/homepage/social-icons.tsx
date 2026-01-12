import React from "react";

type IconKey =
  | "instagram"
  | "whatsapp"
  | "tiktok"
  | "facebook"
  | "youtube"
  | "x"
  | "twitter"
  | "pinterest"
  | "telegram"
  | "linkedin"
  | string;

function Svg({ children }: { children: React.ReactNode }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      role="img"
    >
      {children}
    </svg>
  );
}

/**
 * Simple inline icons (no dependency).
 * Preview & homepage only show the icon, no text.
 */
export function SocialIcon({ iconKey }: { iconKey: IconKey }) {
  const k = String(iconKey || "").trim().toLowerCase();

  switch (k) {
    case "instagram":
      return (
        <Svg>
          <rect x="4" y="4" width="16" height="16" rx="5" stroke="currentColor" strokeWidth="2" />
          <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="2" />
          <circle cx="17.2" cy="6.8" r="1" fill="currentColor" />
        </Svg>
      );
    case "wa":
    case "whatsapp":
      return (
        <Svg>
          <path
            d="M12 4a8 8 0 0 0-6.9 12.1L4 20l4-1.1A8 8 0 1 0 12 4Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M9.2 10.2c.3-1 .6-1.1 1-1.1h.7c.2 0 .4.1.5.3l.7 1.7c.1.2 0 .5-.2.6l-.6.6c.6 1 1.5 1.8 2.5 2.4l.6-.6c.2-.2.4-.3.7-.2l1.6.7c.2.1.3.3.3.5v.7c0 .5-.2.8-.9 1-.9.3-2.5-.3-3.8-1.3-1.6-1.1-2.7-2.6-3.1-3.7-.2-.6-.2-1.2 0-1.6Z"
            fill="currentColor"
          />
        </Svg>
      );
    case "tiktok":
      return (
        <Svg>
          <path
            d="M14 4v9.5a3.5 3.5 0 1 1-3-3.46V7.8a7 7 0 1 0 5 6.7V8.2c1.1 1 2.5 1.6 4 1.8V7.4c-1.7-.3-3.1-1.4-4-3.4Z"
            fill="currentColor"
          />
        </Svg>
      );
    case "facebook":
      return (
        <Svg>
          <path
            d="M14 8h2V5h-2c-2.2 0-4 1.8-4 4v2H8v3h2v5h3v-5h2.2l.8-3H13V9c0-.6.4-1 1-1Z"
            fill="currentColor"
          />
        </Svg>
      );
    case "youtube":
      return (
        <Svg>
          <path
            d="M21 12s0-3.3-.4-4.8a2.5 2.5 0 0 0-1.7-1.7C17.4 5 12 5 12 5s-5.4 0-6.9.5a2.5 2.5 0 0 0-1.7 1.7C3 8.7 3 12 3 12s0 3.3.4 4.8a2.5 2.5 0 0 0 1.7 1.7C6.6 19 12 19 12 19s5.4 0 6.9-.5a2.5 2.5 0 0 0 1.7-1.7c.4-1.5.4-4.8.4-4.8Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path d="M11 10l4 2-4 2v-4Z" fill="currentColor" />
        </Svg>
      );
    case "x":
    case "twitter":
      return (
        <Svg>
          <path
            d="M18 6 6 18M6 6l12 12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </Svg>
      );
    case "pinterest":
      return (
        <Svg>
          <path
            d="M12 4a8 8 0 0 0-2.8 15.5c-.1-.7-.2-1.8 0-2.6l1.3-5.4s-.3-.7-.3-1.7c0-1.6.9-2.8 2.1-2.8 1 0 1.4.7 1.4 1.6 0 1-.6 2.5-.9 3.9-.3 1.2.6 2.1 1.8 2.1 2.1 0 3.7-2.2 3.7-5.4 0-2.8-2-4.8-4.9-4.8-3.3 0-5.3 2.5-5.3 5.1 0 1 .4 2.1.9 2.7.1.1.1.2.1.3l-.3 1.1c0 .2-.2.3-.4.2-1.4-.6-2.3-2.6-2.3-4.2 0-3.4 2.4-6.5 7.1-6.5 3.7 0 6.6 2.7 6.6 6.3 0 3.7-2.3 6.8-5.6 6.8-1.1 0-2.1-.6-2.4-1.3l-.7 2.6c-.3.9-1 2-1.5 2.7A8 8 0 1 0 12 4Z"
            fill="currentColor"
          />
        </Svg>
      );
    default:
      // Fallback: generic circle icon
      return (
        <Svg>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
          <circle cx="12" cy="12" r="2" fill="currentColor" />
        </Svg>
      );
  }
}
