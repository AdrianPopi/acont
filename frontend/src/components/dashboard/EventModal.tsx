"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

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

interface EventModalProps {
  event: CalendarEvent | null;
  onClose: () => void;
  onSave: () => void;
}

export default function EventModal({
  event,
  onClose,
  onSave,
}: EventModalProps) {
  const t = useTranslations("dashboard.calendar");
  const base = process.env.NEXT_PUBLIC_API_URL || "";

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventType, setEventType] = useState("other");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("10:00");
  const [allDay, setAllDay] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setDescription(event.description || "");
      setEventType(event.event_type);

      const start = new Date(event.start_datetime);
      setStartDate(start.toISOString().split("T")[0]);
      setStartTime(start.toTimeString().slice(0, 5));

      if (event.end_datetime) {
        const end = new Date(event.end_datetime);
        setEndDate(end.toISOString().split("T")[0]);
        setEndTime(end.toTimeString().slice(0, 5));
      }

      setAllDay(event.all_day);
      setCompleted(event.completed);
    } else {
      // New event - set today's date
      const today = new Date().toISOString().split("T")[0];
      setStartDate(today);
      setEndDate(today);
    }
  }, [event]);

  async function handleSave() {
    if (!title.trim()) {
      setError(t("errorTitleRequired"));
      return;
    }

    setSaving(true);
    setError("");

    try {
      const startDateTime = allDay
        ? `${startDate}T00:00:00`
        : `${startDate}T${startTime}:00`;

      const endDateTime = endDate
        ? allDay
          ? `${endDate}T23:59:59`
          : `${endDate}T${endTime}:00`
        : null;

      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        event_type: eventType,
        start_datetime: startDateTime,
        end_datetime: endDateTime,
        all_day: allDay,
        completed: completed,
        client_id: null,
        invoice_id: null,
      };

      const url = event ? `${base}/calendar/${event.id}` : `${base}/calendar/`;

      const method = event ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to save event");
      }

      onSave();
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save event");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!event) return;
    if (!confirm(t("confirmDelete"))) return;

    setSaving(true);
    try {
      const res = await fetch(`${base}/calendar/${event.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to delete event");

      onSave();
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to delete event");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {event ? t("editEvent") : t("addEvent")}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              {t("eventTitle")} *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("eventTitle")}
              className="w-full rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-gray-800 px-4 py-2 text-gray-900 dark:text-white placeholder:text-gray-400"
              maxLength={200}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              {t("eventDescription")}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("eventDescription")}
              rows={3}
              className="w-full rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-gray-800 px-4 py-2 text-gray-900 dark:text-white placeholder:text-gray-400"
            />
          </div>

          {/* Event Type */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              {t("eventType")}
            </label>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="w-full rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-gray-800 px-4 py-2 text-gray-900 dark:text-white"
            >
              <option value="meeting">{t("typeMeeting")}</option>
              <option value="deadline">{t("typeDeadline")}</option>
              <option value="reminder">{t("typeReminder")}</option>
              <option value="invoice_due">{t("typeInvoiceDue")}</option>
              <option value="payment">{t("typePayment")}</option>
              <option value="other">{t("typeOther")}</option>
            </select>
          </div>

          {/* Start Date/Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                {t("startDate")} *
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-gray-800 px-4 py-2 text-gray-900 dark:text-white"
              />
            </div>
            {!allDay && (
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  {t("startTime")}
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-gray-800 px-4 py-2 text-gray-900 dark:text-white"
                />
              </div>
            )}
          </div>

          {/* End Date/Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                {t("endDate")}
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-gray-800 px-4 py-2 text-gray-900 dark:text-white"
              />
            </div>
            {!allDay && endDate && (
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  {t("endTime")}
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-gray-800 px-4 py-2 text-gray-900 dark:text-white"
                />
              </div>
            )}
          </div>

          {/* Checkboxes */}
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={allDay}
                onChange={(e) => setAllDay(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {t("allDay")}
              </span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={completed}
                onChange={(e) => setCompleted(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {t("completed")}
              </span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <div>
            {event && (
              <button
                onClick={handleDelete}
                disabled={saving}
                className="rounded-xl px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium disabled:opacity-50"
              >
                {t("delete")}
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border border-gray-300 dark:border-white/10 px-4 py-2 hover:bg-gray-100 dark:hover:bg-white/5 text-gray-700 dark:text-white disabled:opacity-50"
            >
              {t("cancel")}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-xl bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 font-medium disabled:opacity-50"
            >
              {saving ? t("saving") : t("save")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
