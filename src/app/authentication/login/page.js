import dynamic from 'next/dynamic';

const DynamicLoginForm = dynamic(() => import('../../api/auth/login'), {
  ssr: false,
});

const LoginRoute = () => {
  return (
        </div>
        <DynamicLoginForm />
      </div>
  );
};

export default LoginRoute;
