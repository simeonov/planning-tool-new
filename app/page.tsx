import dynamic from 'next/dynamic';

const DynamicPlanningBoard = dynamic(() => import('@/components/PlanningBoard'), { ssr: false });
const DynamicUserAuth = dynamic(() => import('@/components/UserAuth'), { ssr: false });

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <DynamicHomeContent />
    </div>
  );
}

const DynamicHomeContent = dynamic(() => import('@/components/HomeContent'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center min-h-screen">Loading...</div>,
});
