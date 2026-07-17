import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CustomerNavbar } from './CustomerNavbar';

export const CustomerLayout = () => (
  <div className="min-h-screen bg-white">
    <CustomerNavbar />
    <main className="pt-16">
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ duration:0.25 }}>
        <Outlet />
      </motion.div>
    </main>
  </div>
);
