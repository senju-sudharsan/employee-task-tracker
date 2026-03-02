import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { softDeleteUser } from "../services/userService";

/* ─────────────────────────────────────────────────────────────
   CSS — injected once
───────────────────────────────────────────────────────────── */
if (typeof document !== "undefined") {
  const ID = "__dz-styles__";
  if (!document.getElementById(ID)) {
    const s = document.createElement("style");
    s.id = ID;
    s.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');
      *, *::before, *::after { box-sizing: border-box; }

      @keyframes dz-page-in  { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:none} }
      @keyframes dz-card-in  { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:none} }
      @keyframes dz-msg-in   { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:none} }
      @keyframes dz-spin { to { transform:rotate(360deg); } }
      @keyframes dz-warn-glow {
        0%,100% { box-shadow: 0 4px 20px rgba(122,0,25,.10); }
        50%      { box-shadow: 0 4px 28px rgba(122,0,25,.22); }
      }
      @keyframes dz-row-in {
        from { opacity:0; transform:translateX(-10px); }
        to   { opacity:1; transform:none; }
      }

      /*
        .dz-page — transparent, no padding, no background.
        Layout.jsx owns the background (#FAF6EE) and padding (36px 40px).
        This wrapper just triggers the fade-in animation.
      */
      .dz-page {
        font-family: 'Poppins', -apple-system, BlinkMacSystemFont, sans-serif;
        width: 100%;
        animation: dz-page-in .65s cubic-bezier(.4,0,.2,1) both;
      }

      .dz-inner {
        width: 100%;
        max-width: 1320px;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        gap: 20px;
        padding-bottom: 56px;
      }

      .dz-card {
        background: rgba(255,255,255,.92);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border-radius: 20px;
        border: 1.5px solid rgba(226,210,200,.55);
        box-shadow: 0 4px 24px rgba(0,0,0,.05), inset 0 1px 0 rgba(255,255,255,.8);
        padding: 32px 36px;
        transition: box-shadow .3s;
      }
      .dz-card:hover { box-shadow: 0 8px 32px rgba(0,0,0,.08), inset 0 1px 0 rgba(255,255,255,.8); }

      .dz-card-danger {
        border-color: rgba(122,0,25,.18);
        box-shadow:
          0 4px 24px rgba(122,0,25,.08),
          0 0 0 1px rgba(122,0,25,.06),
          inset 0 1px 0 rgba(255,255,255,.8);
        animation: dz-warn-glow 4s ease-in-out infinite;
      }
      .dz-card-danger:hover {
        box-shadow:
          0 10px 36px rgba(122,0,25,.13),
          0 0 0 1px rgba(122,0,25,.10),
          inset 0 1px 0 rgba(255,255,255,.8);
      }

      .dz-select {
        width: 100%;
        padding: 13px 44px 13px 16px;
        font-family: 'Poppins', sans-serif;
        font-size: 14px;
        font-weight: 500;
        color: #2D1B0E;
        background: #fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%238B6B4A' stroke-width='2.5' stroke-linecap='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E") no-repeat right 14px center;
        background-size: 16px;
        border: 1.5px solid rgba(139,107,74,.22);
        border-radius: 12px;
        outline: none;
        appearance: none;
        -webkit-appearance: none;
        cursor: pointer;
        transition: border-color .25s, box-shadow .25s;
      }
      .dz-select:hover  { border-color: rgba(139,107,74,.45); }
      .dz-select:focus  {
        border-color: rgba(122,0,25,.45);
        box-shadow: 0 0 0 3px rgba(122,0,25,.10);
      }
      .dz-select-danger:focus {
        border-color: rgba(122,0,25,.50);
        box-shadow: 0 0 0 4px rgba(122,0,25,.12);
      }

      .dz-checkbox-wrap {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 16px 18px;
        border-radius: 12px;
        background: rgba(122,0,25,.04);
        border: 1.5px solid rgba(122,0,25,.12);
        cursor: pointer;
        transition: background .2s, border-color .2s;
        user-select: none;
      }
      .dz-checkbox-wrap:hover {
        background: rgba(122,0,25,.07);
        border-color: rgba(122,0,25,.22);
      }
      .dz-checkbox-wrap input[type="checkbox"] {
        position: absolute; opacity: 0; width: 0; height: 0; pointer-events: none;
      }
      .dz-checkbox-box {
        width: 20px; height: 20px;
        border-radius: 6px;
        border: 2px solid rgba(122,0,25,.35);
        display: flex; align-items: center; justify-content: center;
        flex-shrink: 0; margin-top: 1px;
        transition: all .2s cubic-bezier(.4,0,.2,1);
        background: transparent;
      }
      .dz-checkbox-box.checked {
        background: linear-gradient(135deg, #9B0022, #7A0019);
        border-color: #7A0019;
        box-shadow: 0 3px 10px rgba(122,0,25,.35);
      }
      .dz-checkbox-text {
        font-size: 13.5px; font-weight: 500; color: #5A2525;
        line-height: 1.5; padding-top: 1px;
      }

      .dz-btn-delete {
        width: 100%; padding: 15px 24px;
        font-family: 'Poppins', sans-serif;
        font-size: 14.5px; font-weight: 700; color: #fff;
        background: linear-gradient(135deg, #9B0022 0%, #7A0019 100%);
        border: none; border-radius: 13px; cursor: pointer;
        display: flex; align-items: center; justify-content: center; gap: 10px;
        letter-spacing: .3px;
        box-shadow: 0 6px 20px rgba(122,0,25,.32), inset 0 1px 0 rgba(255,255,255,.2);
        transition: transform .26s cubic-bezier(.4,0,.2,1), box-shadow .26s;
        position: relative; overflow: hidden;
      }
      .dz-btn-delete::before {
        content: '';
        position: absolute; top:0; left:-80%;
        width: 40%; height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,.18), transparent);
        transition: left .55s;
      }
      .dz-btn-delete:hover:not(:disabled)::before { left: 140%; }
      .dz-btn-delete:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 10px 28px rgba(122,0,25,.42), inset 0 1px 0 rgba(255,255,255,.25);
      }
      .dz-btn-delete:active:not(:disabled) { transform: translateY(0); }
      .dz-btn-delete:disabled {
        background: linear-gradient(135deg, #C8A0A0 0%, #B08080 100%);
        box-shadow: none; cursor: not-allowed; opacity: .65;
      }

      .dz-btn-restore {
        padding: 8px 18px;
        font-family: 'Poppins', sans-serif;
        font-size: 12.5px; font-weight: 700; color: #fff;
        background: linear-gradient(135deg, #22A35A, #196E3C);
        border: none; border-radius: 9px; cursor: pointer;
        display: flex; align-items: center; gap: 6px;
        box-shadow: 0 4px 12px rgba(25,110,60,.28);
        transition: transform .22s, box-shadow .22s;
        flex-shrink: 0; letter-spacing: .2px;
      }
      .dz-btn-restore:hover {
        transform: translateY(-2px);
        box-shadow: 0 7px 18px rgba(25,110,60,.38);
      }
      .dz-btn-restore:active { transform: translateY(0); }

      .dz-msg-success {
        display: flex; align-items: center; gap: 10px;
        padding: 14px 18px; border-radius: 12px;
        background: linear-gradient(135deg, #F0FFF6, #E6FFEE);
        border: 1.5px solid rgba(34,163,90,.25);
        color: #196E3C;
        font-size: 13.5px; font-weight: 600;
        animation: dz-msg-in .35s cubic-bezier(.4,0,.2,1);
      }
      .dz-msg-error {
        display: flex; align-items: center; gap: 10px;
        padding: 14px 18px; border-radius: 12px;
        background: linear-gradient(135deg, #FFF5F5, #FEE8E8);
        border: 1.5px solid rgba(122,0,25,.20);
        color: #7A0019;
        font-size: 13.5px; font-weight: 600;
        animation: dz-msg-in .35s cubic-bezier(.4,0,.2,1);
      }

      .dz-user-row {
        display: flex; align-items: center; justify-content: space-between;
        padding: 14px 18px; border-radius: 12px;
        border: 1.5px solid #F3EDE8; background: #FEFCFA;
        transition: border-color .2s, background .2s, transform .2s;
        animation: dz-row-in .35s cubic-bezier(.4,0,.2,1) backwards;
      }
      .dz-user-row:hover {
        border-color: rgba(34,163,90,.22);
        background: #F5FFFA;
        transform: translateX(3px);
      }

      .dz-spinner {
        width: 18px; height: 18px;
        border: 2.5px solid rgba(255,255,255,.35);
        border-top-color: #fff;
        border-radius: 50%;
        animation: dz-spin .7s linear infinite;
      }

      .dz-s1 { animation: dz-card-in .6s cubic-bezier(.4,0,.2,1) .05s both; }
      .dz-s2 { animation: dz-card-in .6s cubic-bezier(.4,0,.2,1) .15s both; }
      .dz-s3 { animation: dz-card-in .6s cubic-bezier(.4,0,.2,1) .25s both; }
      .dz-s4 { animation: dz-card-in .6s cubic-bezier(.4,0,.2,1) .35s both; }
    `;
    document.head.appendChild(s);
  }
}

/* ─────────────────────────────────────────────────────────────
   Main Component
───────────────────────────────────────────────────────────── */
function DangerZonePage({ currentUser }) {
  const [organizations,  setOrganizations]  = useState([]);
  const [selectedOrg,    setSelectedOrg]    = useState("");
  const [users,          setUsers]          = useState([]);
  const [deletedUsers,   setDeletedUsers]   = useState([]);
  const [selectedUser,   setSelectedUser]   = useState("");
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [message,        setMessage]        = useState("");
  const [loading,        setLoading]        = useState(false);

  const isSuperAdmin = currentUser?.role === "super_admin";
  const isAdmin      = currentUser?.role === "admin";
  const hasAccess    = isSuperAdmin || isAdmin;

  const fetchOrganizations = async () => {
    if (!isSuperAdmin) return;
    const snap = await getDocs(collection(db, "organizations"));
    const orgs = [];
    snap.forEach((docSnap) => orgs.push({ id: docSnap.id, ...docSnap.data() }));
    setOrganizations(orgs);
  };

  const fetchUsers = async (orgId) => {
    if (!orgId) return;
    const q    = query(collection(db, "users"), where("organizationId", "==", orgId));
    const snap = await getDocs(q);
    const active = []; const deleted = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.role === "super_admin") return;
      if (data.status === "Deleted") {
        deleted.push(data);
      } else {
        if (isAdmin && data.role === "admin") return;
        if (data.uid === currentUser.uid)     return;
        active.push(data);
      }
    });
    setUsers(active);
    setDeletedUsers(deleted);
  };

  useEffect(() => {
    if (!hasAccess) return;
    if (isSuperAdmin) fetchOrganizations();
    if (isAdmin) { setSelectedOrg(currentUser.organizationId); fetchUsers(currentUser.organizationId); }
  }, [currentUser]);

  useEffect(() => {
    if (isSuperAdmin && selectedOrg) fetchUsers(selectedOrg);
  }, [selectedOrg]);

  const handleDelete = async () => {
    if (!selectedUser) return;
    try {
      setLoading(true); setMessage("");
      await softDeleteUser({ targetUserId: selectedUser, currentUser: auth.currentUser });
      await addDoc(collection(db, "auditLogs"), {
        action: "USER_DELETED", targetUserId: selectedUser,
        deletedBy: currentUser.uid, organizationId: selectedOrg,
        timestamp: serverTimestamp(),
      });
      setMessage("success:User deleted successfully.");
      setSelectedUser(""); setConfirmChecked(false);
      fetchUsers(selectedOrg);
    } catch (err) {
      setMessage("error:" + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (uid) => {
    try {
      await updateDoc(doc(db, "users", uid), { status: "Active" });
      await addDoc(collection(db, "auditLogs"), {
        action: "USER_RESTORED", targetUserId: uid,
        restoredBy: currentUser.uid, organizationId: selectedOrg,
        timestamp: serverTimestamp(),
      });
      setMessage("success:User restored successfully.");
      fetchUsers(selectedOrg);
    } catch {
      setMessage("error:Failed to restore user.");
    }
  };

  if (!hasAccess) {
    return (
      <div className="dz-page">
        <div className="dz-inner" style={{ alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
          <div className="dz-card" style={{ textAlign: "center", padding: "60px 48px", maxWidth: 480 }}>
            <div style={{ fontSize: 48, marginBottom: 20 }}>🔒</div>
            <h2 style={{ ...T.h2, color: "#7A0019", marginBottom: 8 }}>Access Denied</h2>
            <p style={{ ...T.body, color: "#8B6B4A" }}>You don't have permission to view this page.</p>
          </div>
        </div>
      </div>
    );
  }

  const msgIsSuccess = message.startsWith("success:");
  const msgIsError   = message.startsWith("error:");
  const msgText      = message.replace(/^(success|error):/, "");
  const selectedUserObj = users.find((u) => u.uid === selectedUser);

  return (
    <div className="dz-page">
    <div className="dz-inner">

      {/* PAGE HEADER */}
      <div className="dz-s1" style={sx.pageHeader}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={sx.headerIconWrap}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
              stroke="#7A0019" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div>
            <h1 style={T.h1}>Danger Zone</h1>
            <p style={{ ...T.small, color: "#8B6B4A", marginTop: 3 }}>
              Security & User Control · WorkflowHub Admin
            </p>
          </div>
        </div>
        <div style={{
          ...sx.roleChip,
          background: isSuperAdmin
            ? "linear-gradient(135deg,#7A0019,#9B0022)"
            : "linear-gradient(135deg,#C65A00,#A34500)",
        }}>
          <span style={sx.roleDot} />
          {isSuperAdmin ? "Super Admin" : "Admin"}
        </div>
      </div>

      {/* WARNING BANNER */}
      <div className="dz-card dz-s1" style={sx.warnBanner}>
        <div style={sx.warnIconBox}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
            stroke="#7A0019" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <div>
          <p style={{ ...T.label, color: "#7A0019", marginBottom: 3 }}>Critical Warning</p>
          <p style={{ ...T.body, color: "#5A2020", margin: 0 }}>
            Actions performed on this page are <strong>irreversible</strong>. All operations are
            audit-logged and traceable. Proceed only with explicit authorization.
          </p>
        </div>
      </div>

      {/* ORG SELECTOR */}
      {isSuperAdmin && (
        <div className="dz-card dz-s2">
          <SectionHeader
            icon={<><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></>}
            title="Organization Scope"
            subtitle="Select the organization to manage"
          />
          <div style={{ marginTop: 20 }}>
            <label style={sx.fieldLabel}>Organization</label>
            <select
              className="dz-select"
              value={selectedOrg}
              onChange={(e) => setSelectedOrg(e.target.value)}
            >
              <option value="">Select an organization…</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>{org.name}</option>
              ))}
            </select>
          </div>
          {selectedOrg && (
            <div style={sx.orgSelectedBadge}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="#196E3C" strokeWidth="2.5" strokeLinecap="round">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              <span>Organization selected — {users.length} eligible user{users.length !== 1 ? "s" : ""} available</span>
            </div>
          )}
        </div>
      )}

      {/* DELETE SECTION */}
      {selectedOrg && (
        <div className="dz-card dz-card-danger dz-s3">
          <SectionHeader
            icon={<><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></>}
            title="Delete User"
            subtitle="Permanently revoke platform access"
            danger
          />
          <div style={{ marginTop: 24 }}>
            <label style={sx.fieldLabel}>Select User</label>
            {users.length === 0 ? (
              <div style={sx.emptyState}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                  stroke="#C4A68A" strokeWidth="2" strokeLinecap="round">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                </svg>
                <span>No eligible users in this organization.</span>
              </div>
            ) : (
              <select
                className="dz-select dz-select-danger"
                value={selectedUser}
                onChange={(e) => { setSelectedUser(e.target.value); setConfirmChecked(false); }}
              >
                <option value="">Select a user to delete…</option>
                {users.map((u) => (
                  <option key={u.uid} value={u.uid}>
                    {u.name} · {u.email} ({u.role})
                  </option>
                ))}
              </select>
            )}
          </div>

          {selectedUserObj && (
            <div style={sx.userPreview}>
              <div style={sx.userAvatar}>
                {(selectedUserObj.name || "?")[0].toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ ...T.body, fontWeight: 600, color: "#2D1B0E", margin: 0 }}>
                  {selectedUserObj.name}
                </p>
                <p style={{ ...T.small, color: "#8B6B4A", margin: "2px 0 0" }}>
                  {selectedUserObj.email} · <span style={{ textTransform: "capitalize" }}>{selectedUserObj.role}</span>
                </p>
              </div>
              <div style={sx.userRoleTag}>{selectedUserObj.role}</div>
            </div>
          )}

          {selectedUser && (
            <div style={{ marginTop: 20 }}>
              <label className="dz-checkbox-wrap" htmlFor="dz-confirm-checkbox">
                <input
                  id="dz-confirm-checkbox"
                  type="checkbox"
                  checked={confirmChecked}
                  onChange={(e) => setConfirmChecked(e.target.checked)}
                />
                <div className={`dz-checkbox-box ${confirmChecked ? "checked" : ""}`}>
                  {confirmChecked && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                      stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </div>
                <span className="dz-checkbox-text">
                  I understand that this action will be <strong>recorded in the audit log</strong> and
                  the user can be restored from the Deleted Users section if needed.
                </span>
              </label>
            </div>
          )}

          <div style={{ marginTop: 20 }}>
            <button
              className="dz-btn-delete"
              onClick={handleDelete}
              disabled={!confirmChecked || !selectedUser || loading}
            >
              {loading ? (
                <><div className="dz-spinner" />Deleting user…</>
              ) : (
                <>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                    <path d="M10 11v6"/><path d="M14 11v6"/>
                    <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                  </svg>
                  Delete User
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* RESTORE SECTION */}
      {selectedOrg && (
        <div className="dz-card dz-s4">
          <SectionHeader
            icon={<><path d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8"/><path d="M3 3v5h5"/></>}
            title="Deleted Users"
            subtitle="Restore previously deactivated accounts"
          />
          <div style={{ marginTop: 24 }}>
            {deletedUsers.length === 0 ? (
              <div style={sx.emptyState}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                  stroke="#22A35A" strokeWidth="2" strokeLinecap="round">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                <span>No deleted users — all accounts are active.</span>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {deletedUsers.map((u, i) => (
                  <div key={u.uid} className="dz-user-row" style={{ animationDelay: `${i * .06}s` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <div style={sx.deletedAvatar}>
                        {(u.name || "?")[0].toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ ...T.body, fontWeight: 600, color: "#2D1B0E", margin: 0 }}>{u.name}</p>
                        <p style={{ ...T.small, color: "#8B6B4A", margin: "2px 0 0" }}>{u.email}</p>
                      </div>
                    </div>
                    <button className="dz-btn-restore" onClick={() => handleRestore(u.uid)}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8"/>
                        <path d="M3 3v5h5"/>
                      </svg>
                      Restore
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          {deletedUsers.length > 0 && (
            <div style={sx.deletedCountNote}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                stroke="#8B6B4A" strokeWidth="2.2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {deletedUsers.length} deleted account{deletedUsers.length !== 1 ? "s" : ""} in this organization
            </div>
          )}
        </div>
      )}

      {/* FEEDBACK MESSAGE */}
      {message && (
        <div className={msgIsSuccess ? "dz-msg-success" : "dz-msg-error"}>
          {msgIsSuccess ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          )}
          <span>{msgText || message}</span>
        </div>
      )}

    </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   SectionHeader
───────────────────────────────────────────────────────────── */
function SectionHeader({ icon, title, subtitle, danger = false }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: danger
          ? "linear-gradient(135deg,rgba(122,0,25,.10),rgba(122,0,25,.06))"
          : "linear-gradient(135deg,rgba(139,107,74,.10),rgba(139,107,74,.06))",
        border: `1.5px solid ${danger ? "rgba(122,0,25,.16)" : "rgba(139,107,74,.14)"}`,
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
          stroke={danger ? "#7A0019" : "#8B6B4A"}
          strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          {icon}
        </svg>
      </div>
      <div>
        <h3 style={{ ...T.h3, color: danger ? "#7A0019" : "#2D1B0E", margin: 0, marginBottom: 3 }}>
          {title}
        </h3>
        <p style={{ ...T.small, color: "#8B6B4A", margin: 0 }}>{subtitle}</p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Typography tokens
───────────────────────────────────────────────────────────── */
const T = {
  h1: {
    fontFamily: "'Poppins', sans-serif",
    fontSize: 28, fontWeight: 800, color: "#2D1B0E",
    margin: 0, letterSpacing: "-0.8px", lineHeight: 1.1,
  },
  h2: {
    fontFamily: "'Poppins', sans-serif",
    fontSize: 22, fontWeight: 700, color: "#2D1B0E",
    margin: 0, letterSpacing: "-0.4px",
  },
  h3: {
    fontFamily: "'Poppins', sans-serif",
    fontSize: 16, fontWeight: 700, letterSpacing: "-0.2px",
  },
  body: {
    fontFamily: "'Poppins', sans-serif",
    fontSize: 14, fontWeight: 400, lineHeight: 1.55,
  },
  small: {
    fontFamily: "'Poppins', sans-serif",
    fontSize: 12.5, fontWeight: 500, lineHeight: 1.5,
  },
  label: {
    fontFamily: "'Poppins', sans-serif",
    fontSize: 11, fontWeight: 700,
    textTransform: "uppercase", letterSpacing: "0.8px",
  },
};

/* ─────────────────────────────────────────────────────────────
   Layout style tokens
───────────────────────────────────────────────────────────── */
const sx = {
  pageHeader: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    flexWrap: "wrap", gap: 16,
  },
  headerIconWrap: {
    width: 52, height: 52, borderRadius: 14, flexShrink: 0,
    background: "linear-gradient(135deg,rgba(122,0,25,.10),rgba(122,0,25,.05))",
    border: "1.5px solid rgba(122,0,25,.18)",
    display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: "0 4px 14px rgba(122,0,25,.12)",
  },
  roleChip: {
    display: "flex", alignItems: "center", gap: 8,
    padding: "8px 16px", borderRadius: 100,
    fontSize: 12, fontWeight: 700, color: "#fff",
    letterSpacing: "0.3px", fontFamily: "'Poppins', sans-serif",
    boxShadow: "0 4px 12px rgba(122,0,25,.28)",
  },
  roleDot: {
    display: "inline-block", width: 7, height: 7, borderRadius: "50%",
    background: "rgba(255,255,255,.7)",
  },
  warnBanner: {
    display: "flex", alignItems: "flex-start", gap: 16,
    background: "linear-gradient(135deg,rgba(122,0,25,.05),rgba(122,0,25,.03))",
    border: "1.5px solid rgba(122,0,25,.18)",
    boxShadow: "0 4px 20px rgba(122,0,25,.09)",
    padding: "20px 24px",
  },
  warnIconBox: {
    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
    background: "rgba(122,0,25,.08)",
    border: "1.5px solid rgba(122,0,25,.15)",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  fieldLabel: {
    display: "block",
    fontFamily: "'Poppins', sans-serif",
    fontSize: 11, fontWeight: 700,
    textTransform: "uppercase", letterSpacing: "0.8px",
    color: "#5A4233", marginBottom: 10,
  },
  orgSelectedBadge: {
    display: "inline-flex", alignItems: "center", gap: 7,
    marginTop: 12, padding: "7px 14px", borderRadius: 100,
    background: "rgba(34,163,90,.08)",
    border: "1px solid rgba(34,163,90,.22)",
    fontSize: 12.5, fontWeight: 600, color: "#196E3C",
    fontFamily: "'Poppins', sans-serif",
  },
  userPreview: {
    display: "flex", alignItems: "center", gap: 14,
    padding: "14px 18px", marginTop: 16, borderRadius: 13,
    background: "rgba(122,0,25,.04)",
    border: "1.5px solid rgba(122,0,25,.12)",
  },
  userAvatar: {
    width: 42, height: 42, borderRadius: "50%", flexShrink: 0,
    background: "linear-gradient(135deg,#9B0022,#7A0019)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 17, fontWeight: 700, color: "#fff",
    boxShadow: "0 4px 12px rgba(122,0,25,.30)",
    fontFamily: "'Poppins', sans-serif",
  },
  userRoleTag: {
    padding: "4px 12px", borderRadius: 100,
    background: "rgba(122,0,25,.10)",
    border: "1px solid rgba(122,0,25,.18)",
    fontSize: 11, fontWeight: 700, color: "#7A0019",
    textTransform: "capitalize", letterSpacing: "0.4px",
    fontFamily: "'Poppins', sans-serif", flexShrink: 0,
  },
  deletedAvatar: {
    width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
    background: "linear-gradient(135deg,#D4B8B8,#C4A0A0)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 15, fontWeight: 700, color: "#fff",
    fontFamily: "'Poppins', sans-serif",
  },
  emptyState: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "16px 18px", borderRadius: 12,
    background: "#FAFAF8", border: "1.5px solid #EDE8E3",
    fontSize: 13.5, fontWeight: 500, color: "#8B6B4A",
    fontFamily: "'Poppins', sans-serif",
  },
  deletedCountNote: {
    display: "flex", alignItems: "center", gap: 6,
    marginTop: 16, fontSize: 12, fontWeight: 500, color: "#8B6B4A",
    fontFamily: "'Poppins', sans-serif",
  },
};

export default DangerZonePage;