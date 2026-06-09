import { X } from 'lucide-react'
import { useApp } from '../context/AppContext'

/**
 * Full-page form wrapper (like Zoho)
 * Displays form as full page with header, sidebar remains visible
 */
export default function FormPageWrapper({ title, subtitle, children, onBack }) {
  const { darkMode } = useApp()

  return (
    <div className={`h-full w-full flex flex-col relative ${
      darkMode ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      {/* Close button - Top right corner */}
      <button
        onClick={onBack}
        className={`absolute top-6 right-6 z-50 flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${
          darkMode
            ? 'text-gray-400 hover:bg-gray-700'
            : 'text-gray-400 hover:bg-gray-100'
        }`}
        title="Kthehu"
      >
        <X size={18} />
      </button>

      {/* Content - Full page */}
      <div className={`flex-1 overflow-y-auto p-6 pt-12 ${
        darkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className={`max-w-4xl ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl border ${
          darkMode ? 'border-gray-700' : 'border-gray-100'
        } shadow-sm p-6`}>
          {children}
        </div>
      </div>
    </div>
  )
}
