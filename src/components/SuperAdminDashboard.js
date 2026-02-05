import React from 'react';
import { useNavigate } from "react-router-dom";
import { isTaskOverdue } from "../utils/taskTime";




function SuperAdminDashboard({ tasks = [] }) {
  const navigate = useNavigate();
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === "Done").length;
  const pendingTasks = tasks.filter(t => t.status === "To Do").length;
  const overdueTasks = tasks.filter(isTaskOverdue).length;


  return (
    <div style={styles.container}>
      <div style={styles.backgroundGradient} />
      
      <div style={styles.content}>
        <div style={styles.headerSection}>
          <div style={styles.headerContent}>
            <div style={styles.headerBadge}>
              <PulsingDot />
              <span style={styles.badgeText}>LIVE SYSTEM</span>
            </div>
            <h1 style={styles.pageTitle}>System Overview</h1>
            <p style={styles.pageSubtitle}>
              Real-time insights across all organizations and workflows
            </p>
          </div>
        </div>

        <div style={styles.kpiGrid}>
          <KpiCard
            label="Total Tasks"
            value={totalTasks}
            accent="#38BDF8"
            icon="📊"
            index={0}
            onClick={() => navigate("/tasks?filter=all")}
          />

          <KpiCard
            label="In Progress"
            value={pendingTasks}
            accent="#FACC15"
            icon="⚡"
            index={1}
            onClick={() => navigate("/tasks?filter=pending")}
          />

          <KpiCard
            label="Completed"
            value={completedTasks}
            accent="#22C55E"
            icon="✓"
            index={2}
            onClick={() => navigate("/tasks?filter=completed")}
          />

          <KpiCard
            label="Overdue Tasks"
            value={overdueTasks}
            accent="#EF4444"
            icon="⏰"
            index={3}
            onClick={() => navigate("/tasks?filter=overdue")}
          />

        </div>

        <div style={styles.insightsCard}>
          <div style={styles.insightsHeader}>
            <div>
              <h3 style={styles.sectionTitle}>System Intelligence</h3>
              <p style={styles.sectionHint}>
                Advanced analytics and performance metrics visualization
              </p>
            </div>
            <div style={styles.insightsBadge}>Coming Soon</div>
          </div>

          <div style={styles.insightsGrid}>
            <InsightBlock
              icon="📈"
              label="Performance Trends"
              type="chart"
            />
            <InsightBlock
              icon="🎯"
              label="Task Distribution"
              type="donut"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, accent, icon, index, onClick }) {

  const [isHovered, setIsHovered] = React.useState(false);
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), index * 100);
    return () => clearTimeout(timer);
  }, [index]);

  return (
    <div 
      onClick={onClick}

      style={{
        ...styles.kpiCard,
        opacity: isVisible ? 1 : 0,
        transform: isVisible 
          ? (isHovered ? 'translateY(-6px)' : 'translateY(0)')
          : 'translateY(20px)',
        transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
        boxShadow: isHovered 
          ? '0 16px 32px -8px ' + accent + '30, 0 0 0 2px ' + accent + '20'
          : '0 2px 8px rgba(0, 0, 0, 0.06)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      
    >
      <div style={{
        ...styles.cardGradient,
        background: 'linear-gradient(135deg, ' + accent + '08 0%, transparent 100%)'
      }} />
      
      <div style={styles.cardContent}>
        <div style={styles.cardHeader}>
          <span style={styles.cardIcon}>{icon}</span>
          <p style={styles.kpiLabel}>{label}</p>
        </div>
        
        <h2 style={styles.kpiValue}>{value}</h2>
        
        <div style={styles.cardFooter}>
          <div style={{ 
            ...styles.kpiAccent, 
            backgroundColor: accent,
            width: isHovered ? '100%' : '60%',
            transition: 'width 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }} />
          <div style={{
            ...styles.trendIndicator,
            color: accent,
            opacity: isHovered ? 1 : 0,
            transform: isHovered ? 'translateX(0)' : 'translateX(-8px)',
            transition: 'all 0.3s ease',
          }}>
            →
          </div>
        </div>
      </div>
    </div>
  );
}

function InsightBlock({ icon, label, type }) {
  return (
    <div style={styles.insightBlock}>
      <div style={styles.blockHeader}>
        <div style={styles.blockIcon}>{icon}</div>
        <div style={styles.blockLabel}>{label}</div>
      </div>
      
      {type === 'chart' ? (
        <ChartPlaceholder />
      ) : (
        <DonutPlaceholder />
      )}
    </div>
  );
}

function ChartPlaceholder() {
  const [animatedBars, setAnimatedBars] = React.useState([]);

  React.useEffect(() => {
    const bars = [
      { height: '45%', delay: 0 },
      { height: '65%', delay: 100 },
      { height: '85%', delay: 200 },
      { height: '70%', delay: 300 },
      { height: '90%', delay: 400 },
    ];

    const timers = bars.map((bar, idx) => 
      setTimeout(() => {
        setAnimatedBars(prev => [...prev, idx]);
      }, bar.delay + 300)
    );

    return () => timers.forEach(clearTimeout);
  }, []);

  const bars = [
    { height: '45%' },
    { height: '65%' },
    { height: '85%' },
    { height: '70%' },
    { height: '90%' },
  ];

  return (
    <div style={styles.chartPlaceholder}>
      {bars.map((bar, idx) => (
        <div
          key={idx}
          style={{
            ...styles.chartBar,
            height: animatedBars.includes(idx) ? bar.height : '0%',
            opacity: animatedBars.includes(idx) ? 0.7 : 0,
            transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        />
      ))}
    </div>
  );
}

function DonutPlaceholder() {
  const [rotation, setRotation] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setRotation(prev => (prev + 3) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={styles.donutPlaceholder}>
      <div style={{
        ...styles.donutRing,
        transform: 'rotate(' + rotation + 'deg)',
      }} />
      <div style={styles.donutCenter}>
        <div style={styles.donutValue}>78%</div>
        <div style={styles.donutLabel}>Efficiency</div>
      </div>
    </div>
  );
}

function PulsingDot() {
  const [opacity, setOpacity] = React.useState(1);
  const [scale, setScale] = React.useState(1);

  React.useEffect(() => {
    let frame = 0;
    const interval = setInterval(() => {
      frame += 1;
      const pulse = Math.sin(frame * 0.1);
      setOpacity(0.5 + pulse * 0.5);
      setScale(0.9 + pulse * 0.1);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <span style={{
      ...styles.badgePulseBase,
      opacity: opacity,
      transform: 'scale(' + scale + ')',
    }} />
  );
}

const styles = {
  container: {
    position: 'relative',
    width: '100%',
  },

  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '400px',
    background: 'radial-gradient(ellipse 80% 60% at 50% 0%, #F5E6D3 0%, transparent 100%)',
    pointerEvents: 'none',
    zIndex: 0,
  },

  content: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '40px',
    padding: '0',
  },

  headerSection: {
    paddingBottom: '8px',
  },

  headerContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },

  headerBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    backgroundColor: '#38BDF8',
    borderRadius: '24px',
    width: 'fit-content',
  },

  badgePulseBase: {
    display: 'inline-block',
    width: '8px',
    height: '8px',
    backgroundColor: '#FFFFFF',
    borderRadius: '50%',
    transition: 'all 0.1s ease',
  },

  badgeText: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#FFFFFF',
    letterSpacing: '0.1em',
  },

  pageTitle: {
    fontSize: '48px',
    fontWeight: 800,
    background: 'linear-gradient(135deg, #2C1810 0%, #8B4513 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    letterSpacing: '-0.03em',
    lineHeight: '1.1',
    fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif',
  },

  pageSubtitle: {
    fontSize: '16px',
    color: '#78716C',
    lineHeight: '1.6',
    maxWidth: '600px',
    fontWeight: 500,
  },

  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '20px',
  },

  kpiCard: {
    position: 'relative',
    backgroundColor: '#FFFFFF',
    borderRadius: '20px',
    overflow: 'hidden',
    minHeight: '180px',
    cursor: 'pointer',
    border: '1px solid rgba(0, 0, 0, 0.06)',
  },

  cardGradient: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
  },

  cardContent: {
    position: 'relative',
    padding: '28px',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    gap: '20px',
  },

  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },

  cardIcon: {
    fontSize: '24px',
    lineHeight: 1,
  },

  kpiLabel: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#57534E',
    letterSpacing: '0.03em',
    textTransform: 'uppercase',
    margin: 0,
  },

  kpiValue: {
    fontSize: '48px',
    fontWeight: 800,
    color: '#1C1917',
    letterSpacing: '-0.04em',
    lineHeight: '1',
    fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif',
    margin: 0,
  },

  cardFooter: {
    marginTop: 'auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  kpiAccent: {
    height: '5px',
    borderRadius: '999px',
  },

  trendIndicator: {
    fontSize: '18px',
    fontWeight: 700,
  },

  insightsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '24px',
    padding: '32px',
    border: '1px solid rgba(0, 0, 0, 0.06)',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
  },

  insightsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '28px',
    flexWrap: 'wrap',
    gap: '16px',
  },

  sectionTitle: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#1C1917',
    letterSpacing: '-0.02em',
    marginBottom: '6px',
    margin: 0,
  },

  sectionHint: {
    fontSize: '14px',
    color: '#78716C',
    lineHeight: '1.6',
    margin: 0,
  },

  insightsBadge: {
    padding: '6px 16px',
    backgroundColor: '#F5E6D3',
    color: '#8B4513',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 600,
    letterSpacing: '0.02em',
  },

  insightsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '24px',
  },

  insightBlock: {
    backgroundColor: '#FAFAF9',
    borderRadius: '16px',
    padding: '24px',
    border: '1px dashed #D6D3D1',
  },

  blockHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '20px',
  },

  blockIcon: {
    fontSize: '22px',
  },

  blockLabel: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#57534E',
  },

  chartPlaceholder: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    gap: '10px',
    height: '140px',
    padding: '12px',
  },

  chartBar: {
    flex: 1,
    backgroundColor: '#38BDF8',
    borderRadius: '6px 6px 0 0',
    minHeight: '4px',
  },

  donutPlaceholder: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '140px',
    position: 'relative',
  },

  donutRing: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    border: '14px solid #E7E5E4',
    borderTopColor: '#F5E6D3',
    borderRightColor: '#38BDF8',
    borderBottomColor: '#FACC15',
    transition: 'transform 0.05s linear',
  },

  donutCenter: {
    position: 'absolute',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
  },

  donutValue: {
    fontSize: '28px',
    fontWeight: 800,
    color: '#1C1917',
    letterSpacing: '-0.02em',
  },

  donutLabel: {
    fontSize: '11px',
    color: '#78716C',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
};

export default SuperAdminDashboard;
