export default function GlobalLoading() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="relative">
        {/* Background ring */}
        <div className="h-14 w-14 rounded-full border-4 border-muted" />
        {/* Spinning gradient ring (using mask for a smooth arc) */}
        <div className="absolute inset-0 h-14 w-14 rounded-full border-4 border-transparent border-t-primary animate-spin" 
             style={{ 
               borderImage: 'linear-gradient(to right, #60a5fa, #a78bfa) 1',
               WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
               WebkitMaskComposite: 'exclude',
             }} 
        />
      </div>
    </div>
  );
}