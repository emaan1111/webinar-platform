export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
      <div className="text-center">
        <div className="relative inline-block">
          {/* Checkmark with animation */}
          <div className="relative">
            <svg 
              className="w-16 h-16 text-green-600 animate-pulse" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
            
            {/* Spinning outer ring */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-20 w-20 border-t-2 border-b-2 border-green-600"></div>
            </div>
          </div>
        </div>
        
        <h2 className="text-2xl font-semibold text-gray-800 mb-2 mt-6">
          Loading Confirmation...
        </h2>
        <p className="text-gray-600 text-sm">
          Preparing your webinar details
        </p>
        
        {/* Animated dots */}
        <div className="flex justify-center space-x-2 mt-4">
          <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  )
}
