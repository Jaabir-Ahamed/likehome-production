import { Link } from 'react-router';
import { Home, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';

export function NotFoundPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-[#2563eb]">404</h1>
          <h2 className="text-3xl font-bold text-[#1f2937] mt-4 mb-2">
            Page Not Found
          </h2>
          <p className="text-lg text-[#717182] max-w-md mx-auto">
            Sorry, we couldn't find the page you're looking for. It might have been moved or deleted.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/" className="inline-block">
            <Button className="bg-[#2563eb] hover:bg-[#1e40af] text-white">
              <Home className="w-5 h-5 mr-2" />
              Go Home
            </Button>
          </Link>
          <Button 
            variant="outline" 
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
}