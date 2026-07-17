import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Hotel, ArrowLeft, Search } from 'lucide-react';

export default function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-neutral-100 flex items-center justify-center px-4">
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
        className="text-center max-w-lg">
        <div className="w-20 h-20 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center mx-auto mb-6">
          <Hotel className="w-10 h-10 text-amber-500" />
        </div>
        <p className="text-8xl font-serif font-bold text-neutral-200 select-none leading-none mb-4">404</p>
        <h1 className="text-2xl font-bold text-neutral-900 mb-2">Page Not Found</h1>
        <p className="text-neutral-500 mb-8 leading-relaxed">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/" className="btn-gold flex items-center justify-center gap-2 py-3 px-6">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
          <Link to="/hotels" className="btn-outline flex items-center justify-center gap-2 py-3 px-6">
            <Search className="w-4 h-4" /> Explore Hotels
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
