"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useTranslations } from "next-intl";
import DashboardShell from "@/components/dashboard/DashboardShell";
import EventModal from "@/components/dashboard/EventModal";
import { useMerchantNav } from "../../_components/merchantNav";

type CalendarEvent = {
  id: number;
  title: string;
  description: string | null;
  event_type: string;
  start_datetime: string;
  end_datetime: string | null;
  all_day: boolean;
  completed: boolean;
  client_id: number | null;
  invoice_id: number | null;
  client_name: string | null;
  invoice_no: string | null;
};

const EVENT_COLORS = {
  meeting: "bg-blue-500",
  deadline: "bg-red-500",
  reminder: "bg-yellow-500",
  invoice_due: "bg-orange-500",
  payment: "bg-green-500",
  other: "bg-gray-500",
};

export default function CalendarPage() {
  const t = useTranslations("dashboard.calendar");
  const nav = useMerchantNav();

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"month" | "week">("month");
  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null
  );

  const base = process.env.NEXT_PUBLIC_API_URL || "";

  // Get current month/year
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (!base) throw new Error("API URL missing");

      const res = await fetch(
        `${base}/calendar?year=${currentYear}&month=${currentMonth + 1}`,
        {
          credentials: "include",
          cache: "no-store",
        }
      );

      if (!res.ok) throw new Error("Failed to load events");

      const data = await res.json();
      setEvents(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load calendar");
    } finally {
      setLoading(false);
    }
  }, [base, currentYear, currentMonth]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Calendar grid generation
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startingDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days: (number | null)[] = [];

    // Add empty slots for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  }, [currentMonth, currentYear]);

  // Get events for specific day
  function getEventsForDay(day: number): CalendarEvent[] {
    return events.filter((event) => {
      const eventDate = new Date(event.start_datetime);
      return (
        eventDate.getDate() === day &&
        eventDate.getMonth() === currentMonth &&
        eventDate.getFullYear() === currentYear
      );
    });
  }

  function prevMonth() {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  }

  function nextMonth() {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  }

  function today() {
    setCurrentDate(new Date());
  }

  const monthNames = [
    t("january"),
    t("february"),
    t("march"),
    t("april"),
    t("may"),
    t("june"),
    t("july"),
    t("august"),
    t("september"),
    t("october"),
    t("november"),
    t("december"),
  ];

  const dayNames = [
    t("sun"),
    t("mon"),
    t("tue"),
    t("wed"),
    t("thu"),
    t("fri"),
    t("sat"),
  ];

  return (
    <DashboardShell titleKey="merchant.title" nav={nav}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <button
          onClick={() => {
            setSelectedEvent(null);
            setShowModal(true);
          }}
          className="rounded-2xl bg-brand-gradient px-4 py-2 text-sm text-black font-medium shadow-glow hover:opacity-90"
        >
          {t("addEvent")}
        </button>
      </div>

      {/* Calendar Controls */}
      <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-gray-800 p-4">
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-gray-700 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600"
          >
            ←
          </button>
          <button
            onClick={today}
            className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-gray-700 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 font-medium"
          >
            {t("today")}
          </button>
          <button
            onClick={nextMonth}
            className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-gray-700 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600"
          >
            →
          </button>
        </div>

        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {monthNames[currentMonth]} {currentYear}
        </h2>

        <div className="flex gap-2">
          <button
            onClick={() => setView("month")}
            className={`rounded-xl px-4 py-2 font-medium ${
              view === "month"
                ? "bg-blue-500 text-white"
                : "border border-black/10 dark:border-white/10 bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600"
            }`}
          >
            {t("month")}
          </button>
          <button
            onClick={() => setView("week")}
            className={`rounded-xl px-4 py-2 font-medium ${
              view === "week"
                ? "bg-blue-500 text-white"
                : "border border-black/10 dark:border-white/10 bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600"
            }`}
          >
            {t("week")}
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      {loading ? (
        <div className="mt-4 rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-gray-800 p-8 text-center">
          <div className="text-gray-500 dark:text-gray-400">{t("loading")}</div>
        </div>
      ) : error ? (
        <div className="mt-4 rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-gray-800 p-8 text-center">
          <div className="text-red-500">{error}</div>
        </div>
      ) : (
        <div className="mt-4 rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-gray-800 p-4 overflow-x-auto">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {dayNames.map((day, index) => (
              <div
                key={index}
                className="text-center font-semibold text-sm text-gray-700 dark:text-gray-300 py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day, index) => {
              const dayEvents = day ? getEventsForDay(day) : [];
              const isToday =
                day === new Date().getDate() &&
                currentMonth === new Date().getMonth() &&
                currentYear === new Date().getFullYear();

              return (
                <div
                  key={index}
                  className={`min-h-[100px] rounded-xl border p-2 ${
                    day
                      ? "border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-gray-700"
                      : "border-transparent"
                  } ${isToday ? "ring-2 ring-blue-500" : ""}`}
                >
                  {day && (
                    <>
                      <div
                        className={`text-sm font-medium mb-2 ${
                          isToday
                            ? "text-blue-600 font-bold"
                            : "text-gray-900 dark:text-gray-100"
                        }`}
                      >
                        {day}
                      </div>
                      <div className="space-y-1">
                        {dayEvents.slice(0, 3).map((event) => (
                          <div
                            key={event.id}
                            onClick={() => {
                              setSelectedEvent(event);
                              setShowModal(true);
                            }}
                            className={`text-xs px-2 py-1 rounded cursor-pointer ${
                              EVENT_COLORS[
                                event.event_type as keyof typeof EVENT_COLORS
                              ]
                            } text-white truncate hover:opacity-80`}
                          >
                            {event.title}
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 px-2">
                            +{dayEvents.length - 3} {t("more")}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Event Modal */}
      {showModal && (
        <EventModal
          event={selectedEvent}
          onClose={() => {
            setShowModal(false);
            setSelectedEvent(null);
          }}
          onSave={() => {
            loadEvents();
          }}
        />
      )}
    </DashboardShell>
  );
}
