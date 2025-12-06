import React from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, ResponsiveContainer, XAxis, Tooltip, Cell } from 'recharts';
import { MessageCircle, Users, Flame, Calendar } from 'lucide-react';

interface DashboardProps {
  stats: {
    totalMessages: number;
    topPeers: { name: string; count: number; id: string }[];
    activityByMonth: { month: string; count: number }[];
    topEmojis: { emoji: string; count: number }[];
  };
  user: { firstName: string };
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export const Dashboard: React.FC<DashboardProps> = ({ stats, user }) => {
  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="p-4 space-y-4 pb-10"
    >
      <motion.h1 variants={item} className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
        {user.firstName}'s Year
      </motion.h1>

      <div className="grid grid-cols-2 gap-4">
        {/* Total Messages - Large Card */}
        <motion.div variants={item} className="col-span-2 bg-white/5 rounded-2xl p-6 border border-white/10 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <MessageCircle className="w-5 h-5" />
              <span>Total Messages</span>
            </div>
            <div className="text-5xl font-bold tracking-tighter">
              {stats.totalMessages.toLocaleString()}
            </div>
            <div className="text-sm text-gray-400 mt-2">messages sent this year</div>
          </div>
        </motion.div>

        {/* Top Emojis */}
        <motion.div variants={item} className="col-span-1 bg-white/5 rounded-2xl p-4 border border-white/10">
           <div className="flex items-center gap-2 text-gray-400 mb-3">
              <Flame className="w-4 h-4" />
              <span>Vibe Check</span>
            </div>
            <div className="space-y-2">
              {stats.topEmojis.map((e, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-2xl">{e.emoji}</span>
                  <span className="text-xs text-gray-500">{e.count}x</span>
                </div>
              ))}
            </div>
        </motion.div>

        {/* Quick Stat */}
        <motion.div variants={item} className="col-span-1 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl p-4 border border-white/10 flex flex-col justify-between">
           <div className="text-white/80 text-sm">Most Active Month</div>
           <div className="text-2xl font-bold">
             {stats.activityByMonth.sort((a,b) => b.count - a.count)[0]?.month || '-'}
           </div>
        </motion.div>

        {/* Activity Chart */}
        <motion.div variants={item} className="col-span-2 bg-white/5 rounded-2xl p-4 border border-white/10 h-64">
          <div className="flex items-center gap-2 text-gray-400 mb-4">
              <Calendar className="w-5 h-5" />
              <span>Activity</span>
            </div>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={stats.activityByMonth}>
              <Tooltip 
                contentStyle={{ backgroundColor: '#333', border: 'none', borderRadius: '8px' }}
                itemStyle={{ color: '#fff' }}
                cursor={{ fill: 'rgba(255,255,255,0.1)' }}
              />
              <XAxis dataKey="month" hide />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {stats.activityByMonth.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#3b82f6' : '#8b5cf6'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Top Peers */}
        <motion.div variants={item} className="col-span-2 bg-white/5 rounded-2xl p-6 border border-white/10">
           <div className="flex items-center gap-2 text-gray-400 mb-4">
              <Users className="w-5 h-5" />
              <span>Top Friends</span>
            </div>
            <div className="space-y-4">
              {stats.topPeers.map((peer, i) => (
                <div key={peer.id} className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 to-orange-500 flex items-center justify-center text-black font-bold text-xs">
                       {i + 1}
                     </div>
                     <span className="font-medium truncate max-w-[150px]">{peer.name}</span>
                   </div>
                   <div className="text-sm font-mono text-gray-400">{peer.count} msgs</div>
                </div>
              ))}
            </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

