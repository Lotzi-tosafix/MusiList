"use client";

import { AlertCircle } from "lucide-react";
import Link from "next/link";

export default function CreatePlaylistPage() {
  return (
    <div className="max-w-3xl mx-auto pt-10 px-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
        <div className="flex flex-col items-center justify-center text-center space-y-4 py-10">
          <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-amber-600 dark:text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            יצירת פלייליסטים מושבתת כרגע
          </h1>
          <p className="text-slate-600 dark:text-slate-400 max-w-md">
            אפשרות זו הושבתה זמנית. כרגע ניתן להאזין ולצפות רק בתוכן שעולה על ידי צוות הניהול.
            אנו עובדים על שיפורים ונחזיר אפשרות זו בהמשך.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-violet-600 hover:bg-violet-700 transition-colors"
          >
            חזרה לדף הבית
          </Link>
        </div>
      </div>
    </div>
  );
}
