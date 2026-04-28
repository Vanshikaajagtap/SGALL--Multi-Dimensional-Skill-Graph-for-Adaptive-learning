import { useState, useEffect } from 'react';
import { api } from '../api/client';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
} from 'recharts';

const COLORS = ['#ef4444', '#f59e0b', '#6366f1', '#10b981', '#a855f7', '#ec4899', '#14b8a6'];

export default function AnalyticsPage() {
  const [overview, setOverview] = useState(null);
  const [gaps, setGaps] = useState([]);
  const [severity, setSeverity] = useState([]);
  const [performance, setPerformance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getOverview(),
      api.getGapAggregation(),
      api.getSeverityDistribution(),
      api.getStudentPerformance(),
    ])
      .then(([ov, ga, sv, pf]) => {
        setOverview(ov);
        setGaps(ga);
        setSeverity(sv);
        setPerformance(pf);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSkeleton />;

  const pieData = severity.map((s) => ({
    name: s.severity,
    value: Number(s.count),
    fill: s.severity === 'Critical' ? '#ef4444' : '#f59e0b',
  }));

  const gapBarData = gaps.map((g) => ({
    concept: g.concept_name.length > 20 ? g.concept_name.slice(0, 20) + '…' : g.concept_name,
    students: Number(g.student_count),
    severity: g.severity,
  }));

  const perfData = performance.map((p) => ({
    name: p.student_name?.length > 12 ? p.student_name.slice(0, 12) + '…' : (p.student_name || 'Unknown'),
    avg_score: Number(p.avg_score) || 0,
    gaps: Number(p.gap_count) || 0,
  }));

  return (
    <div className="page-container">
      {/* Header */}
      <div className="mb-8 animate-fade-in-up">
        <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
          System Analytics
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Aggregated insights across all students and concepts
        </p>
      </div>

      {/* Overview Stats */}
      {overview && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <StatCard label="Students" value={overview.total_students} color="#6366f1" delay="1" />
          <StatCard label="Concepts" value={overview.total_concepts} color="#8b5cf6" delay="2" />
          <StatCard label="Attempts" value={overview.total_attempts} color="#10b981" delay="3" />
          <StatCard label="Total Gaps" value={overview.total_gaps} color="#f59e0b" delay="4" />
          <StatCard label="Critical" value={overview.critical_gaps} color="#ef4444" delay="5" />
          <StatCard label="Warnings" value={overview.warning_gaps} color="#f59e0b" delay="6" />
        </div>
      )}

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Gap Frequency */}
        <div className="lg:col-span-2 glass-card p-6 animate-fade-in-up stagger-2">
          <h2 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
            Most Frequent Knowledge Gaps
          </h2>
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Concepts with the most student gaps</p>
          {gapBarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={gapBarData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <YAxis type="category" dataKey="concept" width={160} tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    backdropFilter: 'blur(12px)',
                    color: 'var(--text-primary)',
                    fontSize: '0.8rem',
                  }}
                />
                <Bar dataKey="students" radius={[0, 6, 6, 0]} maxBarSize={28}>
                  {gapBarData.map((entry, i) => (
                    <Cell key={i} fill={entry.severity === 'Critical' ? '#ef4444' : '#f59e0b'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm py-8 text-center" style={{ color: 'var(--text-muted)' }}>No gap data available.</p>
          )}
        </div>

        {/* Severity Pie */}
        <div className="glass-card p-6 animate-fade-in-up stagger-3">
          <h2 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
            Gap Severity
          </h2>
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Distribution of gap types</p>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={false}
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    color: 'var(--text-primary)',
                    fontSize: '0.8rem',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm py-8 text-center" style={{ color: 'var(--text-muted)' }}>No severity data.</p>
          )}
        </div>
      </div>

      {/* Student Performance */}
      <div className="glass-card p-6 animate-fade-in-up stagger-4">
        <h2 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
          Student Performance Overview
        </h2>
        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Average score vs knowledge gap count per student</p>

        {perfData.length > 0 ? (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={perfData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} angle={-15} textAnchor="end" height={50} />
              <YAxis yAxisId="left" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} domain={[0, 100]} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  backdropFilter: 'blur(12px)',
                  color: 'var(--text-primary)',
                  fontSize: '0.8rem',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '0.75rem', color: 'var(--text-muted)' }} />
              <Bar yAxisId="left" dataKey="avg_score" name="Avg Score (%)" fill="#f38600ff" radius={[6, 6, 0, 0]} maxBarSize={36} />
              <Bar yAxisId="right" dataKey="gaps" name="Gap Count" fill="#ce1818ff" radius={[6, 6, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm py-8 text-center" style={{ color: 'var(--text-muted)' }}>No performance data.</p>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color, delay }) {
  return (
    <div className={`stat-card animate-fade-in-up stagger-${delay}`}>
      <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
        {label}
      </p>
      <p className="text-2xl sm:text-3xl font-bold" style={{ color }}>{value}</p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="page-container">
      <div className="skeleton h-10 w-48 mb-2" />
      <div className="skeleton h-4 w-64 mb-8" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 skeleton h-80 rounded-2xl" />
        <div className="skeleton h-80 rounded-2xl" />
      </div>
      <div className="skeleton h-80 rounded-2xl" />
    </div>
  );
}
