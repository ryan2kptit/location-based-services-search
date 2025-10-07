import { RegisterForm } from '@/components/auth/RegisterForm';
import { Card, CardBody } from '@/components/ui/Card';
import { MapPin } from 'lucide-react';

export const Register = () => {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <MapPin className="h-10 w-10 text-primary-600" />
            <span className="text-2xl font-bold text-gray-900">LocalFind</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Create an account</h2>
          <p className="mt-2 text-gray-600">Start discovering services near you</p>
        </div>

        <Card>
          <CardBody className="p-8">
            <RegisterForm />
          </CardBody>
        </Card>
      </div>
    </div>
  );
};
