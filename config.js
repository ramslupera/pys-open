// ============================================================
//  PYS OPEN — SITE CONFIGURATION
//  Fill in SUPABASE_URL and SUPABASE_ANON_KEY after you create
//  your Supabase project (see README.md, Step 1).
//  While these are empty the site runs in DEMO MODE: scores are
//  saved only in the browser you are using.
// ============================================================
window.PYS_CONFIG = {
  SUPABASE_URL: "https://pcevgjyeftlxznghdtdy.supabase.co",        // e.g. "https://abcdxyz.supabase.co"
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjZXZnanllZnRseHpuZ2hkdGR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTU0MzI2MDQsImV4cCI6MjExMTAwODYwNH0.uVzXHZiyFloNEd4NyWdXIk1RVVnvDk_HbZrBliy5fY0",   // the "anon public" key (safe to publish)

  EVENT: {
    name: "PYS Open",
    subtitle: "Pickleball Tournament",
    date: "2026-11-28",               // YYYY-MM-DD (Asia/Manila)
    dateLabel: "Saturday · November 28, 2026",
    callTime: "7:00 AM",
    hours: "8:00 AM – 3:00 PM",
    venue: "Pickleball Reserve",
    city: "Mabalacat City",
    presentedBy: "PYS Builders & PYS Realty",
    coPresentedBy: "Ayala Land Premium Broker Network & Bayani Gourmet Cuisine Inc.",
    matchControl: "Match Control",
    timezone: "Asia/Manila"
  }
};
