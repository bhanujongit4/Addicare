import dynamic from 'next/dynamic';


const DynamicUnifiedStoryAndPlanContent = dynamic(() => import('./UnifiedStoryAndPlanContent'), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900"></div>
    </div>
  ),
});

export default function UnifiedStoryAndPlanPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <DynamicUnifiedStoryAndPlanContent />
      </main>
    </div>
  );
}
