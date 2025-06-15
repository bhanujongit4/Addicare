import dynamic from 'next/dynamic';

const DynamicLoginForm = dynamic(() => import('../../api/auth/login'), {
  ssr: false,
});

const LoginRoute = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white text-black p-4">
      <div className="w-full max-w-md">
        
        <DynamicLoginForm />
      </div>
    </div>
  );
};

export default LoginRoute;
