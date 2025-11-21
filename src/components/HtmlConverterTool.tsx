"use client"

import { useState } from "react"
import { processExternalHtml } from "@/lib/externalHtmlProcessor"

export default function HtmlConverterTool() {
  const [input, setInput] = useState("")
  const [output, setOutput] = useState("")
  const [copied, setCopied] = useState(false)

  const handleConvert = () => {
    const processed = processExternalHtml(input)
    setOutput(processed)
    setCopied(false)
  }

  const handleCopy = async () => {
    if (!output) return
    await navigator.clipboard.writeText(output)
    setCopied(true)
  }

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-xl shadow-lg border border-gray-200">
      <h2 className="text-2xl font-bold mb-4">HTML Registration Converter</h2>
      <p className="mb-2 text-gray-600">Paste your external HTML below. Click <b>Convert</b> to auto-convert it for webinar registration. Copy the result and use it in your registration page template.</p>
      <textarea
        className="w-full border rounded-lg p-3 font-mono text-sm mb-4"
        rows={10}
        placeholder="Paste your HTML here..."
        value={input}
        onChange={e => setInput(e.target.value)}
      />
      <div className="flex gap-3 mb-4">
        <button
          className="bg-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-purple-700 transition"
          onClick={handleConvert}
        >
          Convert
        </button>
        <button
          className={`bg-gray-100 text-gray-700 px-6 py-2 rounded-lg font-semibold border hover:bg-gray-200 transition ${!output && 'opacity-50 cursor-not-allowed'}`}
          onClick={handleCopy}
          disabled={!output}
        >
          {copied ? "Copied!" : "Copy Output"}
        </button>
      </div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Converted HTML:</label>
      <textarea
        className="w-full border rounded-lg p-3 font-mono text-sm"
        rows={10}
        value={output}
        readOnly
      />
    </div>
  )
}
