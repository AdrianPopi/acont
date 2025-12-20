"use client";

import ReactMarkdown from "react-markdown";

export default function MarkdownViewer({ md }: { md: string }) {
  return <ReactMarkdown>{md}</ReactMarkdown>;
}
