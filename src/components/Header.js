function Header({ role }) {
  const roleLabel =
    role === "super_admin"
      ? "Super Admin"
      : role === "admin"
      ? "Admin"
      : role === "employee"
      ? "Employee"
      : "User";

  return (
    <header
      style={{
        height: "64px",
        backgroundColor: "#ffffff",
        borderBottom: "1px solid #e5e7eb",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        position: "sticky",
        top: 0,
        zIndex: 10
      }}
    >
      {/* SEARCH */}
      <input
        type="text"
        placeholder="Search tasks, employees..."
        style={{
          width: "320px",
          padding: "8px 12px",
          borderRadius: "8px",
          border: "1px solid #e5e7eb",
          outline: "none",
          fontSize: "14px"
        }}
      />

      {/* USER INFO */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px"
        }}
      >
        <span
          style={{
            fontSize: "14px",
            color: "#475569"
          }}
        >
          {roleLabel}
        </span>

        {/* Avatar */}
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            backgroundColor: "#e0f2fe",
            color: "#0284c7",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "600"
          }}
        >
          {roleLabel.charAt(0)}
        </div>
      </div>
    </header>
  );
}

export default Header;

