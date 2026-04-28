import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

// Node positions for the DAG (manually arranged for clarity)
const NODE_POSITIONS = {
  101: { x: 0, y: 0 },       // Linear Algebra
  102: { x: 220, y: 0 },     // Calculus
  103: { x: 440, y: 0 },     // Python Programming
  104: { x: 660, y: 0 },     // Probability & Statistics
  105: { x: 880, y: 0 },     // Discrete Mathematics
  106: { x: 660, y: 180 },   // Data Structures
  107: { x: 0, y: 180 },     // Data Preprocessing
  108: { x: 880, y: 180 },   // SQL & Databases
  109: { x: 330, y: 360 },   // Machine Learning Fundamentals
  110: { x: 110, y: 540 },   // Neural Networks
  111: { x: 330, y: 700 },   // Deep Learning
  112: { x: 110, y: 860 },   // Computer Vision
  113: { x: 550, y: 860 },   // Natural Language Processing
  114: { x: 660, y: 540 },   // Reinforcement Learning
};

const DIFFICULTY_COLORS = {
  Beginner: { bg: '#10b981', border: '#059669', text: '#ecfdf5' },
  Intermediate: { bg: '#6366f1', border: '#4f46e5', text: '#eef2ff' },
  Advanced: { bg: '#a855f7', border: '#9333ea', text: '#faf5ff' },
};

const CRITICAL_COLOR = '#ef4444';
const CRITICAL_PATH_COLOR = '#f97316';

export default function GraphPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [graphData, setGraphData] = useState(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [rootCauseInfo, setRootCauseInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  // Build React Flow nodes and edges (hoisted for useEffect dependency)
  const buildGraph = useCallback((data, criticalPathIds = [], gapConceptIds = []) => {
    const flowNodes = data.nodes.map((n) => {
      const colors = DIFFICULTY_COLORS[n.difficulty] || DIFFICULTY_COLORS.Beginner;
      const isOnCriticalPath = criticalPathIds.includes(n.concept_id);
      const hasGap = gapConceptIds.includes(n.concept_id);

      return {
        id: String(n.concept_id),
        position: NODE_POSITIONS[n.concept_id] || { x: Math.random() * 800, y: Math.random() * 600 },
        data: {
          label: (
            <div style={{ textAlign: 'center', padding: '4px 0' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '3px' }}>
                {n.concept_name}
              </div>
              <div style={{
                fontSize: '0.6rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                opacity: 0.85,
              }}>
                {n.difficulty}
              </div>
            </div>
          ),
        },
        style: {
          background: isOnCriticalPath
            ? `linear-gradient(135deg, ${CRITICAL_COLOR}, #dc2626)`
            : hasGap
              ? `linear-gradient(135deg, ${CRITICAL_PATH_COLOR}, #ea580c)`
              : `linear-gradient(135deg, ${colors.bg}, ${colors.border})`,
          color: 'white',
          border: isOnCriticalPath ? `2px solid ${CRITICAL_COLOR}` : `2px solid ${colors.border}`,
          borderRadius: '14px',
          padding: '12px 16px',
          fontSize: '13px',
          boxShadow: isOnCriticalPath
            ? `0 0 20px rgba(239, 68, 68, 0.5)`
            : `0 4px 12px rgba(0,0,0,0.15)`,
          minWidth: '140px',
          transition: 'all 0.3s ease',
          ...(isOnCriticalPath && { animation: 'pulse-glow 2s infinite' }),
        },
      };
    });

    const flowEdges = data.edges.map((e) => {
      const isOnPath = criticalPathIds.includes(e.parent_id) && criticalPathIds.includes(e.child_id);
      return {
        id: `${e.parent_id}-${e.child_id}`,
        source: String(e.parent_id),
        target: String(e.child_id),
        animated: isOnPath,
        style: {
          stroke: isOnPath ? CRITICAL_COLOR : 'var(--text-muted)',
          strokeWidth: isOnPath ? 3 : 1.5,
          opacity: isOnPath ? 1 : 0.5,
        },
        markerEnd: { type: 'arrowclosed', color: isOnPath ? CRITICAL_COLOR : 'var(--text-muted)' },
      };
    });

    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [setNodes, setEdges]);

  // Fetch graph data and students
  useEffect(() => {
    if (isAdmin) {
      Promise.all([api.getConcepts(), api.getStudents()])
        .then(([graph, studs]) => {
          setGraphData(graph);
          setStudents(studs);
          buildGraph(graph, [], []);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    } else if (user?.student_id) {
      setSelectedStudent(String(user.student_id));
      Promise.all([api.getConcepts(), api.getDashboard()])
        .then(([graph, dashData]) => {
          setGraphData(graph);
          const gapConceptIds = dashData.knowledge_gaps.map((g) => g.concept_id);
          buildGraph(graph, [], gapConceptIds);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isAdmin, user?.student_id, buildGraph]);



  // On node click — run root-cause analysis
  const onNodeClick = useCallback(async (event, node) => {
    if (!selectedStudent) return;

    setAnalyzing(true);
    setRootCauseInfo(null);

    try {
      const data = await api.getRootCause(parseInt(selectedStudent), parseInt(node.id));
      setRootCauseInfo(data);

      // Get gaps for this student
      const dashData = await api.getDashboard(isAdmin ? parseInt(selectedStudent) : undefined);
      const gapConceptIds = dashData.knowledge_gaps.map((g) => g.concept_id);

      // Rebuild graph with critical path highlighted
      if (graphData) {
        buildGraph(graphData, data.critical_path_ids, gapConceptIds);
      }
    } catch (err) {
      console.error('Root-cause analysis failed:', err);
    } finally {
      setAnalyzing(false);
    }
  }, [selectedStudent, graphData, buildGraph]);

  // Reset graph when student changes
  const handleStudentChange = useCallback(async (e) => {
    const studentId = e.target.value;
    setSelectedStudent(studentId);
    setRootCauseInfo(null);

    if (!graphData) return;

    if (studentId) {
      try {
        const dashData = await api.getDashboard(parseInt(studentId));
        const gapConceptIds = dashData.knowledge_gaps.map((g) => g.concept_id);
        buildGraph(graphData, [], gapConceptIds);
      } catch {
        buildGraph(graphData, [], []);
      }
    } else {
      buildGraph(graphData, [], []);
    }
  }, [graphData, buildGraph]);

  if (loading) {
    return (
      <div className="page-container">
        <div className="skeleton h-10 w-48 mb-6" />
        <div className="skeleton w-full rounded-2xl" style={{ height: '70vh' }} />
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 animate-fade-in-up">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
            DAG Explorer
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Click a concept node to trace root-cause prerequisites
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-3">
            <select
              id="student-selector"
              value={selectedStudent}
              onChange={handleStudentChange}
              className="select-field"
              style={{ minWidth: '220px' }}
            >
              <option value="">Select student to overlay…</option>
              {students.map((s) => (
                <option key={s.student_id} value={s.student_id}>
                  {s.first_name} {s.last_name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Graph + Sidebar */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* React Flow Graph */}
        <div
          className="xl:col-span-3 glass-card overflow-hidden animate-fade-in-up stagger-1"
          style={{ height: '70vh', minHeight: '500px' }}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.3}
            maxZoom={2}
            attributionPosition="bottom-left"
          >
            <Background color="var(--text-muted)" gap={20} size={1} style={{ opacity: 0.15 }} />
            <Controls
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
              }}
            />
            <MiniMap
              nodeStrokeWidth={3}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
              }}
            />
          </ReactFlow>
        </div>

        {/* Info Panel */}
        <div className="xl:col-span-1 flex flex-col gap-4 animate-fade-in-up stagger-2">
          {/* Legend */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Legend</h3>
            <div className="flex flex-col gap-2">
              {Object.entries(DIFFICULTY_COLORS).map(([level, colors]) => (
                <div key={level} className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-md" style={{ background: colors.bg }} />
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{level}</span>
                </div>
              ))}
              <div className="flex items-center gap-2 mt-1 pt-1" style={{ borderTop: '1px solid var(--border-color)' }}>
                <div className="w-4 h-4 rounded-md" style={{ background: CRITICAL_PATH_COLOR }} />
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Has Gap</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-md" style={{ background: CRITICAL_COLOR }} />
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Root Cause Path</span>
              </div>
            </div>
          </div>

          {/* Root Cause Analysis Result */}
          {analyzing && (
            <div className="glass-card p-5">
              <div className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" style={{ color: '#6366f1' }} viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Analyzing…</span>
              </div>
            </div>
          )}

          {rootCauseInfo && !analyzing && (
            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                Root-Cause Analysis
              </h3>

              {rootCauseInfo.root_cause ? (
                <div>
                  <div
                    className="p-3 rounded-xl mb-3"
                    style={{
                      background: 'rgba(239, 68, 68, 0.06)',
                      border: '1px solid rgba(239, 68, 68, 0.15)',
                    }}
                  >
                    <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#ef4444' }}>
                      Root Cause
                    </p>
                    <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                      {rootCauseInfo.root_cause.concept_name}
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                      Best score: {rootCauseInfo.root_cause.best_score !== null
                        ? `${Number(rootCauseInfo.root_cause.best_score).toFixed(0)}%`
                        : 'Not attempted'}
                    </p>
                  </div>

                  <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                    Critical Path ({rootCauseInfo.critical_path_ids.length} nodes)
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {rootCauseInfo.full_chain
                      .filter((n) => rootCauseInfo.critical_path_ids.includes(n.concept_id))
                      .map((n, i) => (
                        <div key={n.concept_id} className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ background: CRITICAL_COLOR }}
                          />
                          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                            {n.concept_name}
                            <span style={{ color: 'var(--text-muted)' }}>
                              {' '}— {n.best_score !== null ? `${Number(n.best_score).toFixed(0)}%` : 'N/A'}
                            </span>
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="text-2xl mb-1"></div>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>All prerequisites mastered!</p>
                </div>
              )}
            </div>
          )}

          {isAdmin && !selectedStudent && !rootCauseInfo && !analyzing && (
            <div className="glass-card p-5">
              <div className="text-center py-6">
                <div className="text-3xl mb-2"></div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Select a student first
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  Then click any concept node to run root-cause analysis
                </p>
              </div>
            </div>
          )}

          {!isAdmin && !rootCauseInfo && !analyzing && (
            <div className="glass-card p-5">
              <div className="text-center py-6">
                <div className="text-3xl mb-2"></div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Select a Concept
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  Click any node to run a root-cause analysis on your performance
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
