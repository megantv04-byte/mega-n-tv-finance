import { ChevronLeft } from 'lucide-react'
import { useApp } from '../context/AppContext'

/**
 * Full-page form wrapper
 * Displays a form as a complete page instead of modal
 */
export default function FormPageWrapper({ title, subtitle, children, onBack }) {
  const { darkMode } = useApp()

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`border-b ${darkMode ? 'border-gray-800 bg-gray-800' : 'border-gray-100 bg-white'}`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className={`flex items-center justify-center w-10 h-10 rounded-lg transition-colors ${
                darkMode
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title="Kthehu prapa"
            >
              <ChevronLeft size={20} />
            </button>
            <div>
              <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {title}
              </h1>
              {subtitle && (
                <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className={`rounded-xl border ${
          darkMode
            ? 'bg-gray-800 border-gray-700'
            : 'bg-white border-gray-100'
        } p-6 sm:p-8`}>
          {children}
        </div>
      </div>
    </div>
  )
}
