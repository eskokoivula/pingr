export function SuccessScreen() {
  return (
    <div className="fixed inset-0 z-[60] bg-pingr-bg flex items-center justify-center">
      <div className="text-center animate-scaleIn">
        <div className="w-[72px] h-[72px] rounded-full bg-pingr-success/20 flex items-center justify-center mx-auto mb-4">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <p className="text-[18px] font-bold text-pingr-text">Contact saved!</p>
      </div>
    </div>
  )
}
