function PageSection({ title, children }) {
  return (
    <section
      style={{
        backgroundColor: "white",
        padding: "24px",
        borderRadius: "8px",
        marginBottom: "24px",
        boxShadow: "0 2px 6px rgba(0,0,0,0.05)"
      }}
    >
      {title && (
        <h3 style={{ marginTop: 0, marginBottom: "16px" }}>
          {title}
        </h3>
      )}
      {children}
    </section>
  );
}

export default PageSection;
