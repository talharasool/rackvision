import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

export default function RenewalsPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4">
      <Card className="max-w-md w-full text-center py-12">
        <div className="w-16 h-16 rounded-full bg-cyan-600/20 flex items-center justify-center mx-auto mb-6">
          <RefreshCw size={32} className="text-cyan-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">Renewals</h1>
        <p className="text-slate-400 mb-8">
          Renewal inspections coming soon. This feature is currently under development.
        </p>
        <Button onClick={() => navigate('/')} icon={ArrowLeft} variant="secondary">
          Back to Home
        </Button>
      </Card>
    </div>
  );
}
