import React from "react";
import {
  SiInstagram,
  SiFacebook,
  SiWhatsapp,
  SiTiktok,
  SiYoutube,
  SiLinkedin,
  SiX,
  SiPinterest,
  SiTelegram,
  SiTwitter,
} from "react-icons/si";
import { IconType } from "react-icons";

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

// Mapping matching Admin Page
const iconMap: Record<string, IconType> = {
  instagram: SiInstagram,
  facebook: SiFacebook,
  whatsapp: SiWhatsapp,
  wa: SiWhatsapp, // alias
  tiktok: SiTiktok,
  youtube: SiYoutube,
  linkedin: SiLinkedin,
  x: SiX,
  twitter: SiTwitter, // or SiX if preferred, but keeping distinct if library has both
  pinterest: SiPinterest,
  telegram: SiTelegram,
};

/**
 * Uses the same icon library as Admin Settings (react-icons/si).
 */
export function SocialIcon({ iconKey, className }: { iconKey: IconKey; className?: string }) {
  const k = String(iconKey || "").trim().toLowerCase();

  // Handle Twitter legacy mapping to X if desired, or keep separate. 
  // Admin uses SiX for "Twitter / X".
  let IconComp = iconMap[k];

  // Specific fallback for "twitter" -> SiTwitter or SiX? 
  // Admin page maps `x` to `SiX` with label "Twitter / X". 
  // Let's ensure consistency. If `react-icons/si` has `SiTwitter`, use it, else `SiX`.
  if (k === "twitter" && !IconComp) IconComp = SiX;

  if (!IconComp) {
    // Fallback if unknown
    return <span className={`text-xl font-bold opacity-60 ${className ?? ""}`}>?</span>;
  }

  return <IconComp className={`h-6 w-6 ${className ?? ""}`} />;
}
