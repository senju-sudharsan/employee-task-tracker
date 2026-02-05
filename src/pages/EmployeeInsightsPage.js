function EmployeeInsightsPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <h1 style={{ fontSize: "28px", fontWeight: 700 }}>
        Insights
      </h1>

      <p style={{ color: "#64748B" }}>
        Your personal progress, productivity trends, and task health
        will appear here.
      </p>

      <div
        style={{
          backgroundColor: "#FFFFFF",
          border: "1px dashed #CBD5E1",
          borderRadius: "16px",
          padding: "40px",
          textAlign: "center",
          color: "#94A3B8"
        }}
      >
        Employee insights coming soon
      </div>
    </div>
  );
}

export default EmployeeInsightsPage;
