import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function DashboardPage() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      api.getDashboard()
        .then(setDashboard)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [user]);

  if (loading) return <LoadingSkeleton />;
  if (!dashboard) return <div className="page-container"><p style={{ color: 'var(--text-muted)' }}>No data available.</p></div>;

  const { profile, recent_attempts, knowledge_gaps, stats } = dashboard;
  const scoreColor = (score) => score >= 70 ? 'var(--color-primary-500)' : score >= 50 ? 'var(--color-accent-400)' : 'var(--color-critical)';

  const chartData = [...recent_attempts].reverse().map((a) => ({
    concept: a.concept_name.length > 15 ? a.concept_name.slice(0, 15) + '…' : a.concept_name,
    score: Number(a.score),
  }));

  return (
    <div className="page-container">
      {/* Header */}
      <div className="mb-8 animate-fade-in-up">
        <h1 className="text-2xl sm:text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
          Welcome back, {profile.first_name}
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {profile.degree_program} • Year {profile.study_year}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="stat-card animate-fade-in-up stagger-1">
          <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Total Attempts</p>
          <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{stats.total_attempts}</p>
        </div>
        <div className="stat-card animate-fade-in-up stagger-2">
          <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Average Score</p>
          <p className="text-3xl font-bold">
            <span style={{ color: scoreColor(stats.avg_score) }}>{Number(stats.avg_score).toFixed(1)}%</span>
          </p>
        </div>
        <div className="stat-card animate-fade-in-up stagger-3">
          <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Concepts Attempted</p>
          <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{stats.concepts_attempted}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Score Chart */}
        <div className="lg:col-span-2 glass-card p-6 animate-fade-in-up stagger-2">
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Score Timeline</h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData} margin={{ top: 15, right: 10, left: -10, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF4B2A" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#FF4B2A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="concept" tick={{ fontSize: 10, fill: '#64748B' }} angle={-25} textAnchor="end" height={60} stroke="rgba(255,255,255,0.1)" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748B' }} stroke="rgba(255,255,255,0.1)" />
                <Tooltip
                  contentStyle={{
                    background: '#1C1F26',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#F8FAFC',
                    fontSize: '0.8rem',
                  }}
                  itemStyle={{ color: '#FF4B2A' }}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#FF4B2A"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorScore)"
                  activeDot={{ r: 6, fill: '#FF4B2A', stroke: '#1C1F26', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No attempts yet.</p>
          )}
        </div>

        {/* Knowledge Gaps */}
        <div className="glass-card p-6 animate-fade-in-up stagger-3">
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Knowledge Gaps
            {knowledge_gaps.length > 0 && (
              <span className="ml-2 text-sm font-normal" style={{ color: 'var(--text-muted)' }}>({knowledge_gaps.length})</span>
            )}
          </h2>
          {knowledge_gaps.length > 0 ? (
            <div className="flex flex-col gap-3">
              {knowledge_gaps.map((gap) => (
                <div
                  key={gap.gap_id}
                  className="p-3 rounded-xl transition-all duration-200"
                  style={{
                    background: gap.severity === 'Critical' ? 'rgba(239, 68, 68, 0.06)' : 'rgba(245, 158, 11, 0.06)',
                    border: `1px solid ${gap.severity === 'Critical' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)'}`,
                  }}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{gap.concept_name}</span>
                    <span className={`badge ${gap.severity === 'Critical' ? 'badge-critical' : 'badge-warning'}`}>
                      {gap.severity}
                    </span>
                  </div>
                  <span className={`badge badge-${gap.difficulty?.toLowerCase()}`} style={{ marginTop: '0.25rem' }}>
                    {gap.difficulty}
                  </span>

                  {gap.ai_remediation && (
                    <div className="mt-4 p-3.5 rounded-xl flex gap-3 items-start animate-fade-in" style={{ background: 'rgba(99, 102, 241, 0.06)', border: '1px solid rgba(99, 102, 241, 0.15)', boxShadow: '0 2px 10px rgba(99, 102, 241, 0.05)' }}>
                      <div className="text-xl"></div>
                      <div className="text-sm" style={{ color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                        <span className="font-semibold mb-1 block" style={{ color: '#4f46e5' }}>AI Study Guide</span>
                        {gap.ai_remediation}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-3xl mb-2"></div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>No knowledge gaps detected!</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Great work so far.</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Attempts Table */}
      <div className="glass-card p-6 mt-6 animate-fade-in-up stagger-4">
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Recent Attempts</h2>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Concept</th>
                <th>Difficulty</th>
                <th>Score</th>
                <th>Time</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recent_attempts.map((a) => (
                <tr key={a.attempt_id}>
                  <td className="font-medium" style={{ color: 'var(--text-primary)' }}>{a.concept_name}</td>
                  <td><span className={`badge badge-${a.difficulty?.toLowerCase()}`}>{a.difficulty}</span></td>
                  <td><span className="font-semibold" style={{ color: scoreColor(a.score) }}>{Number(a.score).toFixed(0)}%</span></td>
                  <td>{a.time_spent_mins} min</td>
                  <td>{new Date(a.attempt_timestamp).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="page-container">
      <div className="skeleton h-10 w-64 mb-2" />
      <div className="skeleton h-4 w-40 mb-8" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 skeleton h-80 rounded-2xl" />
        <div className="skeleton h-80 rounded-2xl" />
      </div>
    </div>
  );
}
