/**
 * Loading spinner component.
 */
export default function LoadingSpinner({ size = 'md' }) {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex items-center justify-center p-12">
      <div className={`${sizeClasses[size]} border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin`}></div>
    </div>
  );
}
