export type Locale = "en" | "hi" | "bn" | "mr" | "te" | "ta" | "gu" | "ur" | "kn" | "or" | "ml" | "pa";

const minimal = { appName: "Sahayak", language: "Language" } as const;

const dict: Record<Locale, Record<string, string>> = {
  en: {
    appName: "Sahayak",
    reportIssue: "Report an Issue",
    issuesOpenInWard: "Open issues in your ward",
    capture: "Capture",
    describe: "Describe",
    confirm: "Confirm & Submit",
    status_submitted: "Submitted",
    status_pending_verification: "Pending Verification",
    status_under_review: "Under Review",
    status_in_progress: "In Progress",
    status_resolved: "Resolved",
    status_escalated: "Escalated",
    verifyPrompt: "Help verify: Is this issue valid?",
    yes: "Yes",
    no: "No",
    addComment: "Add a comment",
    submit: "Submit",
    admin: "Admin",
    language: "Language",
    highContrast: "High contrast",
  },
  hi: {
    appName: "सहायक",
    reportIssue: "समस्या रिपोर्ट ���रें",
    issuesOpenInWard: "आपके वार्ड में खुले मुद्दे",
    capture: "कैप्चर",
    describe: "विवरण",
    confirm: "पुष्टि करें और सबमिट करें",
    status_submitted: "सबमिट किया गया",
    status_pending_verification: "सत्यापन लंबित",
    status_under_review: "समीक्षा में",
    status_in_progress: "कार्य प्रगति पर",
    status_resolved: "सुलझा लिया",
    status_escalated: "एस्केलेटेड",
    verifyPrompt: "कृपया सत्यापित करें: क्या यह समस्या सही है?",
    yes: "हाँ",
    no: "नहीं",
    addComment: "टिप्पणी जोड़ें",
    submit: "सबमिट करें",
    admin: "प्रशासन",
    language: "भाषा",
    highContrast: "हाई कॉन्ट्रास्ट",
  },
  bn: { ...minimal },
  mr: { ...minimal },
  te: { ...minimal },
  ta: { ...minimal },
  gu: { ...minimal },
  ur: { ...minimal },
  kn: { ...minimal },
  or: { ...minimal },
  ml: { ...minimal },
  pa: { ...minimal },
};

export function getDefaultLocale(): Locale {
  const n = navigator.language.toLowerCase();
  return n.startsWith("hi") ? "hi" : "en";
}

export function t(locale: Locale, key: string) {
  return dict[locale][key] || key;
}
