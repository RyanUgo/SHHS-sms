import React, { useState, useEffect, useCallback } from "react";

// ─── SUPABASE CONFIG ──────────────────────────────────────────────────────────
const SUPABASE_URL = "https://stolatcjrhkriunpvoky.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0b2xhdGNqcmhrcml1bnB2b2t5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0MTQ5NTIsImV4cCI6MjA5NDk5MDk1Mn0.GyMH-MA_wNnKXEc0uLOqXYseoVuteUAjdwBf5pJnS48";

async function sb(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      Prefer: options.prefer || "return=representation",
      ...options.headers,
    },
    ...options,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : [];
}

const db = {
  select: (table, query = "") => sb(`${table}?${query}`),
  insert: (table, data) => sb(table, { method: "POST", body: JSON.stringify(data) }),
  update: (table, match, data) => sb(`${table}?${match}`, { method: "PATCH", body: JSON.stringify(data) }),
  upsert: (table, data) => sb(table, { method: "POST", body: JSON.stringify(data), prefer: "resolution=merge-duplicates,return=representation", headers: { Prefer: "resolution=merge-duplicates,return=representation" } }),
  delete: (table, match) => sb(`${table}?${match}`, { method: "DELETE" }),
};

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const SCHOOL_NAME = "Sated Haven High School";
const SCHOOL_SHORT = "SHHS";

const GRADE_SCALE = [
  { min: 91, max: 100, grade: "A+", gpa: 5.0, remark: "Distinction" },
  { min: 80, max: 90,  grade: "A",  gpa: 5.0, remark: "Excellent" },
  { min: 70, max: 79,  grade: "B",  gpa: 4.0, remark: "Very Good" },
  { min: 60, max: 69,  grade: "C",  gpa: 3.0, remark: "Good" },
  { min: 50, max: 59,  grade: "D",  gpa: 2.0, remark: "Average" },
  { min: 40, max: 49,  grade: "E",  gpa: 1.0, remark: "Fair" },
  { min: 0,  max: 39,  grade: "F",  gpa: 0.0, remark: "Poor" },
];

const COMMENT_DB = [
  { min: 4.5, max: 5.0, form: "Excellent work. You performed exceptionally well.", head: "An Excellent result. Keep maintaining this high standard." },
  { min: 4.0, max: 4.49, form: "Very good performance. Keep it up.", head: "A very good result. Continue with this positive progress." },
  { min: 3.0, max: 3.99, form: "Satisfactory effort. Continued consistency will help you progress.", head: "A good result. Steady commitment will strengthen future performance." },
  { min: 2.0, max: 2.99, form: "Progress is visible; continue working steadily.", head: "A fair result. Continued effort will be beneficial." },
  { min: 1.0, max: 1.99, form: "More consistent effort in your academics will help you do better.", head: "A modest result. Greater focus will support better improvement." },
  { min: 0.0, max: 0.99, form: "Needs improvement. A more focused approach is advised.", head: "Needs significant improvement. Increased effort is advised." },
];

const JSS_SUBJECTS = [
  "CRK","CCA","English (Grammar/Speech Work)","English (Literature)",
  "English (Vocabulary)","English (Comprehension/Creative Writing)",
  "Mathematics (Algebra)","Mathematics (Geometry)","Agric Science",
  "ICT","Basic Tech","Basic Science","National Value","History",
  "Home Economics","PHE","Business Studies","French"
];
const SS_SCIENCE_SUBJECTS = [
  "English Language","Mathematics","Physics","Chemistry","Biology",
  "Further Mathematics","Technical Drawing","Agricultural Science",
  "Computer Science","Economics","Geography","CRK","French","PHE"
];
const SS_ART_SUBJECTS = [
  "English Language","Mathematics","Literature in English","Government",
  "Economics","CRK","History","Geography","French","Yoruba",
  "Fine Arts","Music","Commerce","Accounting","PHE"
];
const CLASS_SUBJECTS = {
  JSS1: JSS_SUBJECTS, JSS2: JSS_SUBJECTS, JSS3: JSS_SUBJECTS,
  "SS1 Science": SS_SCIENCE_SUBJECTS, "SS1 Art": SS_ART_SUBJECTS,
  "SS2 Science": SS_SCIENCE_SUBJECTS, "SS2 Art": SS_ART_SUBJECTS,
};
const ALL_CLASSES = ["JSS1","JSS2","JSS3","SS1 Science","SS1 Art","SS2 Science","SS2 Art"];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function getGradeInfo(score) {
  return GRADE_SCALE.find(g => score >= g.min && score <= g.max) || GRADE_SCALE[GRADE_SCALE.length - 1];
}
function getComment(gpa) {
  return COMMENT_DB.find(c => gpa >= c.min && gpa <= c.max) || COMMENT_DB[COMMENT_DB.length - 1];
}
function calcTotal(cat1, cat2, exam, ba) {
  return (Number(cat1)||0)+(Number(cat2)||0)+(Number(exam)||0)+(Number(ba)||0);
}
function calcGPA(scoreRows) {
  if (!scoreRows.length) return "0.00";
  return (scoreRows.reduce((s, r) => s + getGradeInfo(r.total).gpa, 0) / scoreRows.length).toFixed(2);
}
function gradeColor(grade) {
  return { "A+":"#059669",A:"#10b981",B:"#3b82f6",C:"#6366f1",D:"#f59e0b",E:"#f97316",F:"#ef4444" }[grade] || "#64748b";
}
const labelStyle = { fontSize:12, fontWeight:"bold", color:"#64748b", textTransform:"uppercase", letterSpacing:0.5 };
const selectStyle = { padding:"8px 12px", border:"1px solid #e2e8f0", borderRadius:8, fontSize:14, background:"white", cursor:"pointer" };
const tdStyle = { padding:"10px 16px", fontSize:14, color:"#374151" };
const thStyle = { padding:"12px 16px", textAlign:"left", fontSize:12, fontWeight:"bold", color:"#64748b", textTransform:"uppercase", letterSpacing:0.5 };

// ─── COMPONENTS ───────────────────────────────────────────────────────────────
function Input({ label, value, onChange, type="text", placeholder, disabled }) {
  return (
    <div>
      {label && <label style={labelStyle}>{label}</label>}
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} disabled={disabled}
        style={{ width:"100%", padding:"10px 12px", border:"1px solid #e2e8f0", borderRadius:8, fontSize:14, marginTop:label?4:0, boxSizing:"border-box", background:disabled?"#f8fafc":"white", color:disabled?"#94a3b8":"#1e293b" }} />
    </div>
  );
}
function GoldButton({ onClick, children, style, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ background:disabled?"#e2e8f0":"linear-gradient(135deg,#c9a84c,#e8c96e)", color:disabled?"#94a3b8":"#1a2d40", border:"none", padding:"10px 20px", borderRadius:8, cursor:disabled?"not-allowed":"pointer", fontWeight:"bold", fontSize:14, ...style }}>
      {children}
    </button>
  );
}
function IconBtn({ onClick, children, danger, title }) {
  return <button onClick={onClick} title={title} style={{ background:danger?"#fee2e2":"#f1f5f9", border:"none", padding:"4px 8px", borderRadius:6, cursor:"pointer", fontSize:14 }}>{children}</button>;
}
function InfoRow({ label, value }) {
  return (
    <div style={{ padding:"8px 0", borderBottom:"1px solid #f1f5f9", display:"flex", justifyContent:"space-between", gap:8 }}>
      <span style={{ fontSize:13, color:"#64748b" }}>{label}</span>
      <span style={{ fontSize:13, color:"#1e293b", fontWeight:"500", textAlign:"right" }}>{value||"—"}</span>
    </div>
  );
}
function ClassBadge({ cls }) {
  const bg = { JSS1:"#dbeafe",JSS2:"#dcfce7",JSS3:"#fef3c7","SS1 Science":"#ede9fe","SS1 Art":"#fce7f3","SS2 Science":"#e0f2fe","SS2 Art":"#fff7ed" };
  const tx = { JSS1:"#1d4ed8",JSS2:"#166534",JSS3:"#92400e","SS1 Science":"#6d28d9","SS1 Art":"#9d174d","SS2 Science":"#0369a1","SS2 Art":"#c2410c" };
  return <span style={{ background:bg[cls]||"#f1f5f9", color:tx[cls]||"#374151", padding:"2px 8px", borderRadius:20, fontSize:12, fontWeight:"500" }}>{cls}</span>;
}
function GradeBadge({ grade, small }) {
  const c = gradeColor(grade);
  return <span style={{ background:`${c}20`, color:c, padding:small?"1px 6px":"2px 8px", borderRadius:20, fontSize:small?11:12, fontWeight:"bold" }}>{grade}</span>;
}
function Spinner() {
  return <div style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:60 }}><div style={{ width:36, height:36, border:"3px solid #e2e8f0", borderTop:"3px solid #c9a84c", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} /><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>;
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [notify, setNotify] = useState(null);
  const [data, setData] = useState({ students:[], staff:[], terms:[], scores:[], attendance:[] });
  const [loading, setLoading] = useState(false);

  const toast = (msg, type="success") => { setNotify({msg,type}); setTimeout(()=>setNotify(null),3500); };

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [students, staff, terms, scores, attendance] = await Promise.all([
        db.select("students","order=id"),
        db.select("staff","order=name"),
        db.select("terms","order=session,term"),
        db.select("scores","order=student_id"),
        db.select("attendance","order=student_id"),
      ]);
      setData({ students, staff, terms, scores, attendance });
    } catch(e) { toast("Failed to load data: "+e.message,"error"); }
    setLoading(false);
  }, []);

  useEffect(() => { if (user) loadAll(); }, [user]);

  const activeTerm = data.terms.find(t=>t.active) || data.terms[data.terms.length-1];

  if (!user) return <LoginPage staff={data.staff} students={data.students} loadStaff={async()=>{ const s=await db.select("staff"); const st=await db.select("students"); setData(d=>({...d,staff:s,students:st})); }} onLogin={(u)=>{ setUser(u); }} />;

  if (user.role==="parent") return <ParentPortal user={user} data={data} onLogout={()=>setUser(null)} toast={toast} notify={notify} />;

  return (
    <AdminTeacherLayout user={user} page={page} setPage={setPage} data={data} setData={setData}
      activeTerm={activeTerm} toast={toast} notify={notify} reload={loadAll} loading={loading}
      onLogout={()=>setUser(null)} />
  );
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function LoginPage({ staff, students, loadStaff, onLogin }) {
  const [tab, setTab] = useState("staff");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [studentId, setStudentId] = useState("");
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadStaff(); }, []);

  const handleStaff = async () => {
    setLoading(true); setErr("");
    try {
      const rows = await db.select("staff", `username=eq.${username}&password=eq.${password}`);
      if (rows.length) onLogin(rows[0]);
      else setErr("Invalid username or password.");
    } catch(e) { setErr("Connection error. Please try again."); }
    setLoading(false);
  };

  const handleParent = async () => {
    setLoading(true); setErr("");
    try {
      const rows = await db.select("students", `id=eq.${studentId.toUpperCase()}&parent_pin=eq.${pin}`);
      if (rows.length) onLogin({ role:"parent", studentId:rows[0].id, name:`Parent of ${rows[0].name}` });
      else setErr("Invalid Student ID or PIN.");
    } catch(e) { setErr("Connection error. Please try again."); }
    setLoading(false);
  };

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#0f1923 0%,#1a2d40 50%,#0f1923 100%)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Trebuchet MS',sans-serif", padding:20 }}>
      <div style={{ width:"100%", maxWidth:420 }}>
        <div style={{ textAlign:"center", marginBottom:40 }}>
          <div style={{ width:72, height:72, borderRadius:"50%", background:"linear-gradient(135deg,#c9a84c,#e8c96e)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px", boxShadow:"0 8px 32px rgba(201,168,76,0.4)", fontSize:32 }}>🎓</div>
          <h1 style={{ color:"#e8c96e", fontSize:24, margin:0, letterSpacing:1 }}>{SCHOOL_NAME}</h1>
          <p style={{ color:"#8a9bb0", margin:"4px 0 0", fontSize:13 }}>School Management System</p>
        </div>
        <div style={{ background:"rgba(255,255,255,0.05)", borderRadius:16, border:"1px solid rgba(201,168,76,0.2)", overflow:"hidden", backdropFilter:"blur(10px)" }}>
          <div style={{ display:"flex", borderBottom:"1px solid rgba(201,168,76,0.15)" }}>
            {[["staff","Staff Login"],["parent","Parent Portal"]].map(([t,l])=>(
              <button key={t} onClick={()=>{setTab(t);setErr("");}} style={{ flex:1, padding:16, background:tab===t?"rgba(201,168,76,0.15)":"transparent", color:tab===t?"#e8c96e":"#8a9bb0", border:"none", cursor:"pointer", fontSize:14, borderBottom:tab===t?"2px solid #c9a84c":"2px solid transparent" }}>{l}</button>
            ))}
          </div>
          <div style={{ padding:32 }}>
            {err && <div style={{ background:"rgba(220,50,50,0.15)", border:"1px solid rgba(220,50,50,0.3)", borderRadius:8, padding:"10px 14px", color:"#ff8080", fontSize:13, marginBottom:20 }}>{err}</div>}
            {tab==="staff" ? (
              <>
                <Input label="Username" value={username} onChange={setUsername} placeholder="e.g. adeola.o" />
                <div style={{ marginTop:12 }}><Input label="Password" value={password} onChange={setPassword} type="password" placeholder="••••••••" /></div>
                <GoldButton onClick={handleStaff} style={{ marginTop:16, width:"100%" }} disabled={loading}>{loading?"Signing in...":"Sign In"}</GoldButton>
              </>
            ) : (
              <>
                <Input label="Student ID" value={studentId} onChange={setStudentId} placeholder="e.g. SH11" />
                <div style={{ marginTop:12 }}><Input label="Parent PIN" value={pin} onChange={setPin} type="password" placeholder="4-digit PIN" /></div>
                <GoldButton onClick={handleParent} style={{ marginTop:16, width:"100%" }} disabled={loading}>{loading?"Checking...":"Access Portal"}</GoldButton>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── LAYOUT ───────────────────────────────────────────────────────────────────
function AdminTeacherLayout({ user, page, setPage, data, setData, activeTerm, toast, notify, reload, loading, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isAdmin = user.role==="admin";
  const navItems = [
    { id:"dashboard", label:"Dashboard", icon:"M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" },
    { id:"students", label:"Students", icon:"M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8z" },
    { id:"scores", label:"Enter Scores", icon:"M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
    { id:"reports", label:"Report Cards", icon:"M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8" },
    { id:"attendance", label:"Attendance", icon:"M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 12l2 2 4-4" },
    ...(isAdmin?[
      { id:"staff", label:"Staff", icon:"M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" },
      { id:"terms", label:"Terms & Sessions", icon:"M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" },
    ]:[]),
  ];

  const props = { user, data, setData, activeTerm, toast, isAdmin, reload };
  const pages = { dashboard:<Dashboard {...props}/>, students:<StudentsPage {...props}/>, scores:<ScoresPage {...props}/>, reports:<ReportsPage {...props}/>, attendance:<AttendancePage {...props}/>, staff:<StaffPage {...props}/>, terms:<TermsPage {...props}/> };

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:"#f0f4f8", fontFamily:"'Trebuchet MS',sans-serif" }}>
      <div style={{ width:sidebarOpen?240:64, background:"linear-gradient(180deg,#0f1923 0%,#1a2d40 100%)", transition:"width 0.3s", flexShrink:0, display:"flex", flexDirection:"column", position:"fixed", top:0, left:0, height:"100vh", zIndex:100, overflow:"hidden" }}>
        <div style={{ padding:"20px 16px", borderBottom:"1px solid rgba(201,168,76,0.15)", display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:36, height:36, borderRadius:"50%", background:"linear-gradient(135deg,#c9a84c,#e8c96e)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:18 }}>🎓</div>
          {sidebarOpen && <div><div style={{ color:"#e8c96e", fontWeight:"bold", fontSize:13 }}>{SCHOOL_SHORT}</div><div style={{ color:"#566a7f", fontSize:11 }}>SMS</div></div>}
        </div>
        <nav style={{ flex:1, padding:"12px 8px", overflowY:"auto" }}>
          {navItems.map(item=>(
            <button key={item.id} onClick={()=>setPage(item.id)} style={{ width:"100%", display:"flex", alignItems:"center", gap:12, padding:"10px 12px", borderRadius:8, border:"none", cursor:"pointer", marginBottom:2, background:page===item.id?"rgba(201,168,76,0.15)":"transparent", color:page===item.id?"#e8c96e":"#8a9bb0", textAlign:"left", whiteSpace:"nowrap" }}>
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0 }}><path d={item.icon}/></svg>
              {sidebarOpen && <span style={{ fontSize:13 }}>{item.label}</span>}
            </button>
          ))}
        </nav>
        <div style={{ padding:"12px 8px", borderTop:"1px solid rgba(201,168,76,0.15)" }}>
          {sidebarOpen && <div style={{ padding:"8px 12px", marginBottom:8 }}><div style={{ color:"#e8c96e", fontSize:12, fontWeight:"bold" }}>{user.name}</div><div style={{ color:"#566a7f", fontSize:11, textTransform:"capitalize" }}>{user.role}</div></div>}
          <button onClick={onLogout} style={{ width:"100%", display:"flex", alignItems:"center", gap:12, padding:"10px 12px", borderRadius:8, border:"none", cursor:"pointer", background:"rgba(220,50,50,0.1)", color:"#ff8080" }}>
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
            {sidebarOpen && <span style={{ fontSize:13 }}>Logout</span>}
          </button>
        </div>
      </div>

      <div style={{ flex:1, marginLeft:sidebarOpen?240:64, transition:"margin-left 0.3s", minHeight:"100vh", display:"flex", flexDirection:"column" }}>
        <header style={{ background:"white", padding:"0 24px", height:60, display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:"1px solid #e2e8f0", position:"sticky", top:0, zIndex:50 }}>
          <div style={{ display:"flex", alignItems:"center", gap:16 }}>
            <button onClick={()=>setSidebarOpen(!sidebarOpen)} style={{ background:"none", border:"none", cursor:"pointer", color:"#64748b", padding:4 }}>
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
            </button>
            <h2 style={{ margin:0, fontSize:16, color:"#1e293b", fontWeight:"bold" }}>{navItems.find(n=>n.id===page)?.label||"Dashboard"}</h2>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <button onClick={reload} style={{ background:"none", border:"1px solid #e2e8f0", borderRadius:8, padding:"6px 12px", cursor:"pointer", fontSize:12, color:"#64748b" }}>↻ Refresh</button>
            <span style={{ background:"#f0f9ff", color:"#0369a1", padding:"4px 10px", borderRadius:20, fontSize:12, border:"1px solid #bae6fd" }}>{activeTerm?.label}</span>
          </div>
        </header>
        <main style={{ flex:1, padding:24, overflowY:"auto" }}>
          {loading ? <Spinner /> : (pages[page]||<Dashboard {...props}/>)}
        </main>
      </div>

      {notify && <div style={{ position:"fixed", bottom:24, right:24, background:notify.type==="success"?"#065f46":"#7f1d1d", color:"white", padding:"12px 20px", borderRadius:10, fontSize:14, zIndex:9999, boxShadow:"0 8px 24px rgba(0,0,0,0.3)" }}>{notify.msg}</div>}
      <style>{`@keyframes slideIn{from{transform:translateX(100px);opacity:0}to{transform:translateX(0);opacity:1}}`}</style>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ data, activeTerm }) {
  const { students, staff, scores, terms } = data;
  const classCounts = ALL_CLASSES.map(c=>({ class:c, count:students.filter(s=>s.class===c).length })).filter(x=>x.count>0);
  const termScores = scores.filter(s=>s.term_id===activeTerm?.id);
  const uniqueStudentsWithScores = [...new Set(termScores.map(s=>s.student_id))].length;

  const cards = [
    { label:"Total Students", value:students.length, icon:"👨‍🎓", color:"#3b82f6" },
    { label:"Teaching Staff", value:staff.filter(s=>s.role==="teacher").length, icon:"👨‍🏫", color:"#8b5cf6" },
    { label:"Active Classes", value:classCounts.length, icon:"🏫", color:"#10b981" },
    { label:"Results Entered", value:uniqueStudentsWithScores, icon:"📊", color:"#f59e0b" },
  ];

  return (
    <div>
      <div style={{ marginBottom:24 }}>
        <h3 style={{ margin:0, color:"#1e293b", fontSize:22 }}>Welcome back! 👋</h3>
        <p style={{ color:"#64748b", margin:"4px 0 0", fontSize:14 }}>Here's an overview of {SCHOOL_NAME}</p>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:16, marginBottom:24 }}>
        {cards.map(c=>(
          <div key={c.label} style={{ background:"white", borderRadius:12, padding:20, border:"1px solid #e2e8f0", display:"flex", alignItems:"center", gap:16 }}>
            <div style={{ width:48, height:48, borderRadius:12, background:`${c.color}15`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22 }}>{c.icon}</div>
            <div><div style={{ fontSize:28, fontWeight:"bold", color:c.color }}>{c.value}</div><div style={{ fontSize:13, color:"#64748b" }}>{c.label}</div></div>
          </div>
        ))}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <div style={{ background:"white", borderRadius:12, padding:20, border:"1px solid #e2e8f0" }}>
          <h4 style={{ margin:"0 0 16px", color:"#1e293b" }}>Students by Class</h4>
          {classCounts.map(c=>(
            <div key={c.class} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:"1px solid #f1f5f9" }}>
              <span style={{ fontSize:14, color:"#374151" }}>{c.class}</span>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ width:80, height:6, borderRadius:3, background:"#f1f5f9", overflow:"hidden" }}>
                  <div style={{ width:`${(c.count/students.length)*100}%`, height:"100%", background:"#3b82f6", borderRadius:3 }}/>
                </div>
                <span style={{ fontSize:13, fontWeight:"bold", color:"#3b82f6", minWidth:20 }}>{c.count}</span>
              </div>
            </div>
          ))}
        </div>
        <div style={{ background:"white", borderRadius:12, padding:20, border:"1px solid #e2e8f0" }}>
          <h4 style={{ margin:"0 0 16px", color:"#1e293b" }}>Current Term</h4>
          <InfoRow label="Term" value={activeTerm?.label} />
          <InfoRow label="Session" value={activeTerm?.session} />
          <InfoRow label="Status" value={<span style={{ color:"#10b981", fontWeight:"bold" }}>Active</span>} />
          <InfoRow label="Total Students" value={students.length} />
          <InfoRow label="Scores Entered For" value={`${uniqueStudentsWithScores} students`} />
        </div>
      </div>
    </div>
  );
}

// ─── STUDENTS PAGE ────────────────────────────────────────────────────────────
function StudentsPage({ data, setData, toast, isAdmin, reload }) {
  const { students } = data;
  const [filter, setFilter] = useState("");
  const [classFilter, setClassFilter] = useState("All");
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ id:"", name:"", class:"JSS1", dob:"", parent_pin:"" });
  const [saving, setSaving] = useState(false);

  const filtered = students.filter(s=>
    (classFilter==="All"||s.class===classFilter) &&
    (s.name.toLowerCase().includes(filter.toLowerCase())||s.id.toLowerCase().includes(filter.toLowerCase()))
  );

  const handleSave = async () => {
    if (!form.id||!form.name) return toast("ID and name are required.","error");
    setSaving(true);
    try {
      if (editing) {
        await db.update("students",`id=eq.${form.id}`,{ name:form.name, class:form.class, dob:form.dob, parent_pin:form.parent_pin });
        toast("Student updated!");
      } else {
        await db.insert("students", form);
        toast("Student added!");
      }
      await reload();
      setShowAdd(false); setEditing(null); setForm({ id:"", name:"", class:"JSS1", dob:"", parent_pin:"" });
    } catch(e) { toast("Error: "+e.message,"error"); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this student?")) return;
    try { await db.delete("students",`id=eq.${id}`); await reload(); toast("Student deleted."); }
    catch(e) { toast("Error: "+e.message,"error"); }
  };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div style={{ display:"flex", gap:12 }}>
          <input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Search students..." style={{ padding:"8px 14px", border:"1px solid #e2e8f0", borderRadius:8, fontSize:14, minWidth:220 }} />
          <select value={classFilter} onChange={e=>setClassFilter(e.target.value)} style={selectStyle}>
            <option>All</option>
            {ALL_CLASSES.map(c=><option key={c}>{c}</option>)}
          </select>
        </div>
        {isAdmin && <GoldButton onClick={()=>{ setShowAdd(true); setEditing(null); setForm({ id:"", name:"", class:"JSS1", dob:"", parent_pin:"" }); }}>+ Add Student</GoldButton>}
      </div>

      {(showAdd||editing) && (
        <div style={{ background:"white", borderRadius:12, padding:24, border:"1px solid #e2e8f0", marginBottom:20 }}>
          <h4 style={{ margin:"0 0 20px" }}>{editing?"Edit Student":"Add New Student"}</h4>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
            <Input label="Student ID" value={form.id} onChange={v=>setForm({...form,id:v})} placeholder="e.g. SH40" disabled={!!editing} />
            <Input label="Full Name" value={form.name} onChange={v=>setForm({...form,name:v})} />
            <div><label style={labelStyle}>Class</label><select value={form.class} onChange={e=>setForm({...form,class:e.target.value})} style={{ ...selectStyle, width:"100%", marginTop:4 }}>{ALL_CLASSES.map(c=><option key={c}>{c}</option>)}</select></div>
            <Input label="Date of Birth" value={form.dob} onChange={v=>setForm({...form,dob:v})} type="date" />
            <Input label="Parent PIN" value={form.parent_pin} onChange={v=>setForm({...form,parent_pin:v})} placeholder="4-digit PIN" />
          </div>
          <div style={{ display:"flex", gap:12, marginTop:16 }}>
            <GoldButton onClick={handleSave} disabled={saving}>{saving?"Saving...":"Save"}</GoldButton>
            <button onClick={()=>{ setShowAdd(false); setEditing(null); }} style={{ padding:"10px 20px", borderRadius:8, border:"1px solid #e2e8f0", background:"white", cursor:"pointer" }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ background:"white", borderRadius:12, border:"1px solid #e2e8f0", overflow:"hidden" }}>
        <div style={{ padding:"12px 16px", background:"#f8fafc", borderBottom:"1px solid #e2e8f0", fontSize:13, color:"#64748b" }}>
          Showing {filtered.length} of {students.length} students
        </div>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead><tr style={{ background:"#f8fafc" }}>
            {["ID","Name","Class","Date of Birth","Parent PIN",...(isAdmin?["Actions"]:[])].map(h=><th key={h} style={thStyle}>{h}</th>)}
          </tr></thead>
          <tbody>
            {filtered.map((s,i)=>(
              <tr key={s.id} style={{ borderTop:"1px solid #f1f5f9", background:i%2?"#fafafa":"white" }}>
                <td style={tdStyle}><span style={{ fontFamily:"monospace", background:"#f1f5f9", padding:"2px 6px", borderRadius:4, fontSize:12 }}>{s.id}</span></td>
                <td style={{ ...tdStyle, fontWeight:"500" }}>{s.name}</td>
                <td style={tdStyle}><ClassBadge cls={s.class}/></td>
                <td style={tdStyle}>{s.dob||"—"}</td>
                <td style={tdStyle}><span style={{ fontFamily:"monospace", color:"#6366f1" }}>{s.parent_pin}</span></td>
                {isAdmin && <td style={tdStyle}><div style={{ display:"flex", gap:8 }}>
                  <IconBtn onClick={()=>{ setEditing(s.id); setForm({...s}); setShowAdd(false); }}>✏️</IconBtn>
                  <IconBtn onClick={()=>handleDelete(s.id)} danger>🗑️</IconBtn>
                </div></td>}
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length===0 && <div style={{ padding:40, textAlign:"center", color:"#94a3b8" }}>No students found.</div>}
      </div>
    </div>
  );
}

// ─── SCORES PAGE ──────────────────────────────────────────────────────────────
function ScoresPage({ user, data, activeTerm, toast, isAdmin, reload }) {
  const { students, terms, scores } = data;
  const [selectedTerm, setSelectedTerm] = useState(activeTerm?.id||"");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [localScores, setLocalScores] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const allowedClasses = isAdmin ? ALL_CLASSES : (user.classes||[]);
  const classStudents = students.filter(s=>s.class===selectedClass);
  const subjects = CLASS_SUBJECTS[selectedClass]||[];

  useEffect(()=>{
    if (selectedStudent && selectedTerm && selectedClass) {
      const existing = scores.filter(s=>s.term_id===selectedTerm&&s.student_id===selectedStudent);
      const init = {};
      subjects.forEach(sub=>{
        const row = existing.find(e=>e.subject===sub);
        init[sub] = row ? { cat1:row.cat1, cat2:row.cat2, exam:row.exam, ba:row.ba } : { cat1:"", cat2:"", exam:"", ba:"" };
      });
      setLocalScores(init); setSaved(false);
    }
  },[selectedStudent,selectedTerm,selectedClass]);

  const handleChange = (subject, field, value) => {
    const max = field==="exam"?60:field==="ba"?10:15;
    const num = value===""?"":Math.min(Number(value)||0,max);
    setLocalScores(prev=>({ ...prev, [subject]:{ ...prev[subject], [field]:num } }));
    setSaved(false);
  };

  const handleSave = async () => {
    if (!selectedStudent||!selectedTerm) return;
    setSaving(true);
    try {
      const rows = subjects.map(sub=>{
        const s = localScores[sub]||{};
        const total = calcTotal(s.cat1,s.cat2,s.exam,s.ba);
        const info = getGradeInfo(total);
        return { term_id:selectedTerm, student_id:selectedStudent, subject:sub, cat1:Number(s.cat1)||0, cat2:Number(s.cat2)||0, exam:Number(s.exam)||0, ba:Number(s.ba)||0, total, grade:info.grade, gpa:info.gpa, remark:info.remark };
      });
      for (const row of rows) {
        await db.upsert("scores", row);
      }
      await reload();
      setSaved(true); toast("Scores saved!");
    } catch(e) { toast("Save failed: "+e.message,"error"); }
    setSaving(false);
  };

  const student = students.find(s=>s.id===selectedStudent);

  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16, marginBottom:24, background:"white", padding:20, borderRadius:12, border:"1px solid #e2e8f0" }}>
        <div><label style={labelStyle}>Term</label><select value={selectedTerm} onChange={e=>setSelectedTerm(e.target.value)} style={{ ...selectStyle,width:"100%",marginTop:4 }}><option value="">Select...</option>{terms.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}</select></div>
        <div><label style={labelStyle}>Class</label><select value={selectedClass} onChange={e=>{ setSelectedClass(e.target.value); setSelectedStudent(""); }} style={{ ...selectStyle,width:"100%",marginTop:4 }}><option value="">Select...</option>{allowedClasses.map(c=><option key={c}>{c}</option>)}</select></div>
        <div><label style={labelStyle}>Student</label><select value={selectedStudent} onChange={e=>setSelectedStudent(e.target.value)} style={{ ...selectStyle,width:"100%",marginTop:4 }} disabled={!selectedClass}><option value="">Select...</option>{classStudents.map(s=><option key={s.id} value={s.id}>{s.name} ({s.id})</option>)}</select></div>
      </div>

      {selectedStudent && selectedClass ? (
        <div style={{ background:"white", borderRadius:12, border:"1px solid #e2e8f0", overflow:"hidden" }}>
          <div style={{ padding:"16px 20px", background:"#f8fafc", borderBottom:"1px solid #e2e8f0", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div><h4 style={{ margin:0 }}>{student?.name}</h4><span style={{ fontSize:13, color:"#64748b" }}>{selectedClass} · {student?.id}</span></div>
            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
              {saved && <span style={{ color:"#10b981", fontSize:13 }}>✓ Saved to database</span>}
              <GoldButton onClick={handleSave} disabled={saving}>{saving?"Saving...":"Save All Scores"}</GoldButton>
            </div>
          </div>
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead><tr style={{ background:"#f8fafc" }}>
                {["Subject","CAT 1 (15)","CAT 2 (15)","Exam (60)","BA (10)","Total","Grade","Remark"].map(h=><th key={h} style={thStyle}>{h}</th>)}
              </tr></thead>
              <tbody>
                {subjects.map((sub,i)=>{
                  const s = localScores[sub]||{};
                  const total = calcTotal(s.cat1,s.cat2,s.exam,s.ba);
                  const info = getGradeInfo(total);
                  const hasData = s.cat1!==""||s.cat2!==""||s.exam!==""||s.ba!=="";
                  return (
                    <tr key={sub} style={{ borderTop:"1px solid #f1f5f9", background:i%2?"#fafafa":"white" }}>
                      <td style={{ ...tdStyle,fontSize:13 }}>{sub}</td>
                      {["cat1","cat2","exam","ba"].map(field=>(
                        <td key={field} style={tdStyle}>
                          <input type="number" min="0" max={field==="exam"?60:field==="ba"?10:15} value={s[field]??""} onChange={e=>handleChange(sub,field,e.target.value)}
                            style={{ width:56, padding:"4px 6px", border:"1px solid #e2e8f0", borderRadius:6, textAlign:"center", fontSize:13 }} />
                        </td>
                      ))}
                      <td style={{ ...tdStyle, fontWeight:"bold", color:hasData?gradeColor(info.grade):"#94a3b8" }}>{hasData?total:"—"}</td>
                      <td style={tdStyle}>{hasData?<GradeBadge grade={info.grade}/>:"—"}</td>
                      <td style={{ ...tdStyle, fontSize:12, color:"#64748b" }}>{hasData?info.remark:"—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div style={{ background:"white", borderRadius:12, border:"1px dashed #e2e8f0", padding:60, textAlign:"center", color:"#94a3b8" }}>
          <div style={{ fontSize:40, marginBottom:12 }}>📝</div>
          <p>Select a term, class, and student to enter scores</p>
        </div>
      )}
    </div>
  );
}

// ─── REPORTS PAGE ─────────────────────────────────────────────────────────────
function ReportsPage({ data }) {
  const { students, scores, terms, staff, attendance } = data;
  const [selectedTerm, setSelectedTerm] = useState(terms.find(t=>t.active)?.id||"");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [report, setReport] = useState(null);

  const classStudents = students.filter(s=>s.class===selectedClass);

  const generate = () => {
    const student = students.find(s=>s.id===selectedStudent);
    if (!student) return;
    const term = terms.find(t=>t.id===selectedTerm);
    const termScores = scores.filter(s=>s.term_id===selectedTerm&&s.student_id===selectedStudent);
    const gpa = calcGPA(termScores);
    const comment = getComment(Number(gpa));
    const formTeacher = staff.find(s=>s.role==="teacher"&&s.classes?.includes(student.class));
    const att = attendance.find(a=>a.term_id===selectedTerm&&a.student_id===selectedStudent)||{};
    const classStudentIds = students.filter(s=>s.class===student.class).map(s=>s.id);
    const withPos = termScores.map(sc=>{
      const all = classStudentIds.map(sid=>scores.find(r=>r.term_id===selectedTerm&&r.student_id===sid&&r.subject===sc.subject)?.total||0).sort((a,b)=>b-a);
      return { ...sc, position:all.indexOf(sc.total)+1 };
    });
    setReport({ student, term, scores:withPos, gpa, comment, formTeacher, att });
  };

  if (report) return <ReportCard {...report} onBack={()=>setReport(null)} />;

  return (
    <div>
      <div style={{ background:"white", borderRadius:12, padding:24, border:"1px solid #e2e8f0", marginBottom:20 }}>
        <h4 style={{ margin:"0 0 20px" }}>Generate Report Card</h4>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16 }}>
          <div><label style={labelStyle}>Term</label><select value={selectedTerm} onChange={e=>setSelectedTerm(e.target.value)} style={{ ...selectStyle,width:"100%",marginTop:4 }}>{terms.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}</select></div>
          <div><label style={labelStyle}>Class</label><select value={selectedClass} onChange={e=>{ setSelectedClass(e.target.value); setSelectedStudent(""); }} style={{ ...selectStyle,width:"100%",marginTop:4 }}><option value="">Select...</option>{ALL_CLASSES.map(c=><option key={c}>{c}</option>)}</select></div>
          <div><label style={labelStyle}>Student</label><select value={selectedStudent} onChange={e=>setSelectedStudent(e.target.value)} style={{ ...selectStyle,width:"100%",marginTop:4 }} disabled={!selectedClass}><option value="">Select...</option>{classStudents.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
        </div>
        <GoldButton onClick={generate} style={{ marginTop:16 }} disabled={!selectedStudent}>Generate Report Card</GoldButton>
      </div>

      {selectedClass && selectedTerm && (
        <div style={{ background:"white", borderRadius:12, border:"1px solid #e2e8f0", overflow:"hidden" }}>
          <div style={{ padding:"16px 20px", borderBottom:"1px solid #e2e8f0" }}><h4 style={{ margin:0 }}>Class Summary — {selectedClass}</h4></div>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr style={{ background:"#f8fafc" }}>{["Student","ID","Subjects","GPA"].map(h=><th key={h} style={thStyle}>{h}</th>)}</tr></thead>
            <tbody>
              {classStudents.map((s,i)=>{
                const ss = scores.filter(r=>r.term_id===selectedTerm&&r.student_id===s.id);
                const gpa = calcGPA(ss);
                return (
                  <tr key={s.id} style={{ borderTop:"1px solid #f1f5f9", background:i%2?"#fafafa":"white" }}>
                    <td style={tdStyle}>{s.name}</td>
                    <td style={{ ...tdStyle, fontFamily:"monospace", fontSize:12 }}>{s.id}</td>
                    <td style={tdStyle}>{ss.length}</td>
                    <td style={{ ...tdStyle, fontWeight:"bold", color:"#6366f1" }}>{ss.length?gpa:<span style={{ color:"#94a3b8" }}>No scores</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── REPORT CARD ──────────────────────────────────────────────────────────────
function ReportCard({ student, term, scores, gpa, comment, formTeacher, att, onBack }) {
  const gradeKey = [
    { grade:"A+",range:"91–100",pts:"5.0",desc:"Distinction" },{ grade:"A",range:"80–90",pts:"5.0",desc:"Excellent" },
    { grade:"B",range:"70–79",pts:"4.0",desc:"Very Good" },{ grade:"C",range:"60–69",pts:"3.0",desc:"Good" },
    { grade:"D",range:"50–59",pts:"2.0",desc:"Average" },{ grade:"E",range:"40–49",pts:"1.0",desc:"Fair" },
    { grade:"F",range:"0–39",pts:"0.0",desc:"Poor" },
  ];
  return (
    <div>
      <div style={{ display:"flex", gap:12, marginBottom:20 }}>
        <button onClick={onBack} style={{ padding:"8px 16px", borderRadius:8, border:"1px solid #e2e8f0", background:"white", cursor:"pointer", fontSize:14 }}>← Back</button>
        <button onClick={()=>window.print()} style={{ padding:"8px 16px", borderRadius:8, border:"none", background:"#3b82f6", cursor:"pointer", color:"white", fontSize:14 }}>🖨️ Print</button>
      </div>
      <div style={{ background:"white", borderRadius:12, border:"2px solid #c9a84c", maxWidth:900, margin:"0 auto", overflow:"hidden" }}>
        <div style={{ background:"linear-gradient(135deg,#0f1923,#1a2d40)", padding:"24px 32px", textAlign:"center", color:"white" }}>
          <div style={{ fontSize:32, marginBottom:8 }}>🎓</div>
          <h2 style={{ color:"#e8c96e", margin:"0 0 4px", fontSize:22 }}>{SCHOOL_NAME}</h2>
          <p style={{ color:"#8a9bb0", margin:0, fontSize:13 }}>Official Academic Report Card</p>
          <p style={{ color:"#c9a84c", margin:"8px 0 0", fontWeight:"bold" }}>{term?.label}</p>
        </div>
        <div style={{ padding:"20px 32px", borderBottom:"1px solid #e2e8f0", display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16, background:"#fafafa" }}>
          <InfoRow label="Student Name" value={student.name}/>
          <InfoRow label="Admission No." value={student.id}/>
          <InfoRow label="Class" value={student.class}/>
          <InfoRow label="Date of Birth" value={student.dob||"—"}/>
          <InfoRow label="Days Present" value={att.present||"—"}/>
          <InfoRow label="Days Absent" value={att.present&&att.total?att.total-att.present:"—"}/>
        </div>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr style={{ background:"#1a2d40" }}>
              {["S/N","Subject","CAT 1","CAT 2","Exam","BA","Total","GP","Grade","Position","Remark"].map(h=>(
                <th key={h} style={{ padding:"10px 12px", textAlign:"left", fontSize:11, color:"#e8c96e", fontWeight:"bold" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {scores.map((s,i)=>(
                <tr key={s.subject} style={{ borderBottom:"1px solid #f1f5f9", background:i%2?"#f8fafc":"white" }}>
                  <td style={{ padding:"8px 12px", fontSize:12, color:"#64748b" }}>{i+1}</td>
                  <td style={{ padding:"8px 12px", fontSize:12, fontWeight:"500" }}>{s.subject}</td>
                  <td style={{ padding:"8px 12px", fontSize:12, textAlign:"center" }}>{s.cat1||0}</td>
                  <td style={{ padding:"8px 12px", fontSize:12, textAlign:"center" }}>{s.cat2||0}</td>
                  <td style={{ padding:"8px 12px", fontSize:12, textAlign:"center" }}>{s.exam||0}</td>
                  <td style={{ padding:"8px 12px", fontSize:12, textAlign:"center" }}>{s.ba||0}</td>
                  <td style={{ padding:"8px 12px", fontSize:13, fontWeight:"bold", textAlign:"center", color:gradeColor(s.grade) }}>{s.total}</td>
                  <td style={{ padding:"8px 12px", fontSize:12, textAlign:"center" }}>{getGradeInfo(s.total).gpa}</td>
                  <td style={{ padding:"8px 12px", textAlign:"center" }}><GradeBadge grade={s.grade} small/></td>
                  <td style={{ padding:"8px 12px", fontSize:12, textAlign:"center", color:"#6366f1" }}>{s.position||"—"}</td>
                  <td style={{ padding:"8px 12px", fontSize:11, color:"#64748b" }}>{s.remark}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding:"20px 32px", borderTop:"2px solid #e2e8f0", display:"grid", gridTemplateColumns:"1fr 1fr", gap:24 }}>
          <div>
            <div style={{ background:"#f8fafc", borderRadius:8, padding:16, border:"1px solid #e2e8f0", marginBottom:16 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:14 }}>Term GPA</span>
                <span style={{ fontSize:28, fontWeight:"bold", color:"#6366f1" }}>{gpa}</span>
              </div>
            </div>
            <div style={{ marginBottom:12 }}>
              <p style={{ fontSize:12, color:"#64748b", margin:"0 0 4px", fontWeight:"bold" }}>Form Teacher ({formTeacher?.name||"—"}):</p>
              <p style={{ fontSize:13, color:"#374151", margin:0, fontStyle:"italic" }}>"{comment.form}"</p>
            </div>
            <div>
              <p style={{ fontSize:12, color:"#64748b", margin:"0 0 4px", fontWeight:"bold" }}>Head Teacher:</p>
              <p style={{ fontSize:13, color:"#374151", margin:0, fontStyle:"italic" }}>"{comment.head}"</p>
            </div>
          </div>
          <div>
            <h5 style={{ margin:"0 0 8px", fontSize:12, color:"#64748b", textTransform:"uppercase" }}>Grading Key</h5>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:11 }}>
              <thead><tr style={{ background:"#f8fafc" }}>{["Grade","Range","Points","Remark"].map(h=><th key={h} style={{ padding:"4px 8px", textAlign:"left", color:"#64748b" }}>{h}</th>)}</tr></thead>
              <tbody>{gradeKey.map(g=><tr key={g.grade} style={{ borderTop:"1px solid #f1f5f9" }}><td style={{ padding:"3px 8px", fontWeight:"bold", color:gradeColor(g.grade) }}>{g.grade}</td><td style={{ padding:"3px 8px" }}>{g.range}</td><td style={{ padding:"3px 8px" }}>{g.pts}</td><td style={{ padding:"3px 8px", color:"#64748b" }}>{g.desc}</td></tr>)}</tbody>
            </table>
          </div>
        </div>
        <div style={{ background:"#0f1923", padding:"12px 32px", textAlign:"center" }}>
          <span style={{ color:"#566a7f", fontSize:12 }}>{SCHOOL_NAME} · Official Academic Record · {term?.session}</span>
        </div>
      </div>
    </div>
  );
}

// ─── ATTENDANCE PAGE ──────────────────────────────────────────────────────────
function AttendancePage({ data, toast, reload }) {
  const { students, terms, attendance } = data;
  const [selectedTerm, setSelectedTerm] = useState(terms.find(t=>t.active)?.id||"");
  const [selectedClass, setSelectedClass] = useState("");
  const [totalDays, setTotalDays] = useState(90);
  const [localAtt, setLocalAtt] = useState({});
  const [saving, setSaving] = useState(false);

  const classStudents = students.filter(s=>s.class===selectedClass);

  useEffect(()=>{
    if (selectedClass&&selectedTerm) {
      const init = {};
      classStudents.forEach(s=>{ const a=attendance.find(r=>r.term_id===selectedTerm&&r.student_id===s.id)||{}; init[s.id]={ present:a.present??"", total:totalDays }; });
      setLocalAtt(init);
    }
  },[selectedClass,selectedTerm,attendance]);

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const [student_id, a] of Object.entries(localAtt)) {
        await db.upsert("attendance",{ term_id:selectedTerm, student_id, present:Number(a.present)||0, total:totalDays });
      }
      await reload(); toast("Attendance saved!");
    } catch(e) { toast("Error: "+e.message,"error"); }
    setSaving(false);
  };

  return (
    <div>
      <div style={{ background:"white", borderRadius:12, padding:20, border:"1px solid #e2e8f0", marginBottom:20, display:"flex", gap:16, alignItems:"flex-end" }}>
        <div style={{ flex:1 }}><label style={labelStyle}>Term</label><select value={selectedTerm} onChange={e=>setSelectedTerm(e.target.value)} style={{ ...selectStyle,width:"100%",marginTop:4 }}>{terms.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}</select></div>
        <div style={{ flex:1 }}><label style={labelStyle}>Class</label><select value={selectedClass} onChange={e=>setSelectedClass(e.target.value)} style={{ ...selectStyle,width:"100%",marginTop:4 }}><option value="">Select...</option>{ALL_CLASSES.map(c=><option key={c}>{c}</option>)}</select></div>
        <div><label style={labelStyle}>Total School Days</label><input type="number" value={totalDays} onChange={e=>setTotalDays(Number(e.target.value))} style={{ ...selectStyle,width:100,marginTop:4 }}/></div>
        <GoldButton onClick={handleSave} disabled={saving||!selectedClass}>{saving?"Saving...":"Save"}</GoldButton>
      </div>
      {selectedClass && (
        <div style={{ background:"white", borderRadius:12, border:"1px solid #e2e8f0", overflow:"hidden" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr style={{ background:"#f8fafc" }}>{["Student","ID","Total Days","Days Present","Days Absent","Attendance %"].map(h=><th key={h} style={thStyle}>{h}</th>)}</tr></thead>
            <tbody>
              {classStudents.map((s,i)=>{
                const a=localAtt[s.id]||{ present:"",total:totalDays };
                const absent=totalDays-(Number(a.present)||0);
                const pct=a.present!==""?((Number(a.present)/totalDays)*100).toFixed(0):"—";
                return (
                  <tr key={s.id} style={{ borderTop:"1px solid #f1f5f9", background:i%2?"#fafafa":"white" }}>
                    <td style={tdStyle}>{s.name}</td>
                    <td style={{ ...tdStyle,fontFamily:"monospace",fontSize:12 }}>{s.id}</td>
                    <td style={tdStyle}>{totalDays}</td>
                    <td style={tdStyle}><input type="number" min={0} max={totalDays} value={a.present} onChange={e=>setLocalAtt(prev=>({...prev,[s.id]:{present:e.target.value,total:totalDays}}))} style={{ width:60,padding:"4px 6px",border:"1px solid #e2e8f0",borderRadius:6,textAlign:"center" }}/></td>
                    <td style={tdStyle}>{a.present!==""?absent:"—"}</td>
                    <td style={tdStyle}>{pct!=="—"&&<div style={{ display:"flex",alignItems:"center",gap:8 }}><div style={{ width:60,height:6,borderRadius:3,background:"#f1f5f9" }}><div style={{ width:`${pct}%`,height:"100%",borderRadius:3,background:Number(pct)>=75?"#10b981":"#f59e0b" }}/></div><span style={{ fontSize:13,color:Number(pct)>=75?"#10b981":"#f59e0b" }}>{pct}%</span></div>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── STAFF PAGE ───────────────────────────────────────────────────────────────
function StaffPage({ data, toast, reload }) {
  const { staff } = data;
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name:"", role:"teacher", username:"", password:"", classes:[], subjects:[] });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.name||!form.username) return toast("Name and username required.","error");
    setSaving(true);
    try {
      await db.insert("staff",{ ...form, id:`T${Date.now()}` });
      await reload(); toast("Staff added!"); setShowAdd(false);
      setForm({ name:"",role:"teacher",username:"",password:"",classes:[],subjects:[] });
    } catch(e) { toast("Error: "+e.message,"error"); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this staff member?")) return;
    try { await db.delete("staff",`id=eq.${id}`); await reload(); toast("Staff removed."); }
    catch(e) { toast("Error: "+e.message,"error"); }
  };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:16 }}>
        <GoldButton onClick={()=>setShowAdd(!showAdd)}>+ Add Staff</GoldButton>
      </div>
      {showAdd && (
        <div style={{ background:"white", borderRadius:12, padding:24, border:"1px solid #e2e8f0", marginBottom:20 }}>
          <h4 style={{ margin:"0 0 20px" }}>Add Staff Member</h4>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
            <Input label="Full Name" value={form.name} onChange={v=>setForm({...form,name:v})}/>
            <Input label="Username" value={form.username} onChange={v=>setForm({...form,username:v})}/>
            <Input label="Password" value={form.password} onChange={v=>setForm({...form,password:v})} type="password"/>
            <div><label style={labelStyle}>Role</label><select value={form.role} onChange={e=>setForm({...form,role:e.target.value})} style={{ ...selectStyle,width:"100%",marginTop:4 }}><option value="teacher">Teacher</option><option value="admin">Admin</option></select></div>
          </div>
          <div style={{ display:"flex", gap:12, marginTop:16 }}>
            <GoldButton onClick={handleSave} disabled={saving}>{saving?"Saving...":"Save"}</GoldButton>
            <button onClick={()=>setShowAdd(false)} style={{ padding:"10px 20px", borderRadius:8, border:"1px solid #e2e8f0", background:"white", cursor:"pointer" }}>Cancel</button>
          </div>
        </div>
      )}
      <div style={{ background:"white", borderRadius:12, border:"1px solid #e2e8f0", overflow:"hidden" }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead><tr style={{ background:"#f8fafc" }}>{["Name","Username","Role","Actions"].map(h=><th key={h} style={thStyle}>{h}</th>)}</tr></thead>
          <tbody>
            {staff.map((s,i)=>(
              <tr key={s.id} style={{ borderTop:"1px solid #f1f5f9", background:i%2?"#fafafa":"white" }}>
                <td style={{ ...tdStyle,fontWeight:"500" }}>{s.name}</td>
                <td style={{ ...tdStyle,fontFamily:"monospace",fontSize:12 }}>{s.username}</td>
                <td style={tdStyle}><span style={{ background:s.role==="admin"?"#fef3c7":"#e0f2fe", color:s.role==="admin"?"#92400e":"#0369a1", padding:"2px 8px", borderRadius:20, fontSize:12 }}>{s.role}</span></td>
                <td style={tdStyle}><IconBtn onClick={()=>handleDelete(s.id)} danger>🗑️</IconBtn></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── TERMS PAGE ───────────────────────────────────────────────────────────────
function TermsPage({ data, toast, reload }) {
  const { terms } = data;
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ session:"", term:"1" });
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!form.session) return toast("Session is required.","error");
    const id = `T${form.term}-${form.session.replace("/","-")}`;
    setSaving(true);
    try {
      await db.insert("terms",{ id, label:`Term ${form.term} – ${form.session}`, session:form.session, term:Number(form.term), active:false });
      await reload(); toast("Term added!"); setShowAdd(false);
    } catch(e) { toast("Error: "+e.message,"error"); }
    setSaving(false);
  };

  const setActive = async (id) => {
    try {
      await db.update("terms","id=neq.none",{ active:false });
      await db.update("terms",`id=eq.${id}`,{ active:true });
      await reload(); toast("Active term updated!");
    } catch(e) { toast("Error: "+e.message,"error"); }
  };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:16 }}>
        <GoldButton onClick={()=>setShowAdd(!showAdd)}>+ Add Term</GoldButton>
      </div>
      {showAdd && (
        <div style={{ background:"white", borderRadius:12, padding:24, border:"1px solid #e2e8f0", marginBottom:20 }}>
          <h4 style={{ margin:"0 0 16px" }}>New Term</h4>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
            <Input label="Session (e.g. 2025/2026)" value={form.session} onChange={v=>setForm({...form,session:v})} placeholder="2025/2026"/>
            <div><label style={labelStyle}>Term</label><select value={form.term} onChange={e=>setForm({...form,term:e.target.value})} style={{ ...selectStyle,width:"100%",marginTop:4 }}><option value="1">Term 1</option><option value="2">Term 2</option><option value="3">Term 3</option></select></div>
          </div>
          <div style={{ display:"flex", gap:12, marginTop:16 }}>
            <GoldButton onClick={handleAdd} disabled={saving}>{saving?"Adding...":"Add Term"}</GoldButton>
            <button onClick={()=>setShowAdd(false)} style={{ padding:"10px 20px", borderRadius:8, border:"1px solid #e2e8f0", background:"white", cursor:"pointer" }}>Cancel</button>
          </div>
        </div>
      )}
      <div style={{ display:"grid", gap:12 }}>
        {terms.map(t=>(
          <div key={t.id} style={{ background:"white", borderRadius:12, padding:20, border:`2px solid ${t.active?"#c9a84c":"#e2e8f0"}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div><div style={{ fontWeight:"bold", color:"#1e293b", fontSize:16 }}>{t.label}</div><div style={{ color:"#64748b", fontSize:13 }}>Session: {t.session} · Term {t.term}</div></div>
            {t.active ? <span style={{ background:"#d1fae5", color:"#065f46", padding:"6px 14px", borderRadius:20, fontSize:13, fontWeight:"bold" }}>✓ Active</span>
              : <button onClick={()=>setActive(t.id)} style={{ padding:"8px 16px", borderRadius:8, border:"1px solid #c9a84c", background:"transparent", cursor:"pointer", color:"#92400e", fontSize:13 }}>Set Active</button>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── PARENT PORTAL ────────────────────────────────────────────────────────────
function ParentPortal({ user, data, onLogout, toast, notify }) {
  const { students, scores, terms, attendance } = data;
  const student = students.find(s=>s.id===user.studentId);
  const [selectedTerm, setSelectedTerm] = useState(terms.find(t=>t.active)?.id||terms[0]?.id||"");

  if (!student) return <div style={{ padding:40, textAlign:"center" }}>Student not found.</div>;

  const termScores = scores.filter(s=>s.term_id===selectedTerm&&s.student_id===student.id);
  const gpa = calcGPA(termScores);
  const comment = getComment(Number(gpa));
  const att = attendance.find(a=>a.term_id===selectedTerm&&a.student_id===student.id)||{};

  return (
    <div style={{ minHeight:"100vh", background:"#f0f4f8", fontFamily:"'Trebuchet MS',sans-serif" }}>
      <div style={{ background:"linear-gradient(135deg,#0f1923,#1a2d40)", padding:"0 24px", height:60, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <span style={{ fontSize:24 }}>🎓</span>
          <span style={{ color:"#e8c96e", fontWeight:"bold" }}>{SCHOOL_SHORT} Parent Portal</span>
        </div>
        <button onClick={onLogout} style={{ background:"rgba(255,255,255,0.1)", border:"none", color:"#8a9bb0", padding:"8px 16px", borderRadius:8, cursor:"pointer", fontSize:13 }}>Logout</button>
      </div>
      <div style={{ maxWidth:900, margin:"0 auto", padding:24 }}>
        <div style={{ background:"white", borderRadius:12, padding:24, border:"1px solid #e2e8f0", marginBottom:20, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ display:"flex", alignItems:"center", gap:16 }}>
            <div style={{ width:56, height:56, borderRadius:"50%", background:"linear-gradient(135deg,#6366f1,#8b5cf6)", display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontSize:22, fontWeight:"bold" }}>{student.name[0]}</div>
            <div><h3 style={{ margin:0, color:"#1e293b" }}>{student.name}</h3><p style={{ margin:0, color:"#64748b", fontSize:13 }}>{student.id} · {student.class}</p></div>
          </div>
          <div>
            <label style={labelStyle}>View Term</label>
            <select value={selectedTerm} onChange={e=>setSelectedTerm(e.target.value)} style={{ ...selectStyle,marginLeft:8 }}>
              {terms.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:20 }}>
          {[
            { label:"Term GPA", value:termScores.length?gpa:"—", color:"#6366f1", icon:"📊" },
            { label:"Subjects", value:termScores.length, color:"#3b82f6", icon:"📚" },
            { label:"Days Present", value:att.present??"—", color:"#10b981", icon:"✅" },
            { label:"Days Absent", value:att.present!=null&&att.total?att.total-att.present:"—", color:"#f59e0b", icon:"📅" },
          ].map(c=>(
            <div key={c.label} style={{ background:"white", borderRadius:12, padding:16, border:"1px solid #e2e8f0", textAlign:"center" }}>
              <div style={{ fontSize:24, marginBottom:8 }}>{c.icon}</div>
              <div style={{ fontSize:24, fontWeight:"bold", color:c.color }}>{c.value}</div>
              <div style={{ fontSize:12, color:"#64748b" }}>{c.label}</div>
            </div>
          ))}
        </div>
        {termScores.length>0 ? (
          <>
            <div style={{ background:"white", borderRadius:12, border:"1px solid #e2e8f0", overflow:"hidden", marginBottom:20 }}>
              <div style={{ padding:"16px 20px", borderBottom:"1px solid #e2e8f0" }}><h4 style={{ margin:0 }}>Academic Results</h4></div>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead><tr style={{ background:"#f8fafc" }}>{["Subject","CAT 1","CAT 2","Exam","BA","Total","Grade","Remark"].map(h=><th key={h} style={thStyle}>{h}</th>)}</tr></thead>
                <tbody>
                  {termScores.map((s,i)=>(
                    <tr key={s.subject} style={{ borderTop:"1px solid #f1f5f9", background:i%2?"#fafafa":"white" }}>
                      <td style={{ ...tdStyle,fontSize:13 }}>{s.subject}</td>
                      <td style={{ ...tdStyle,textAlign:"center" }}>{s.cat1||0}</td>
                      <td style={{ ...tdStyle,textAlign:"center" }}>{s.cat2||0}</td>
                      <td style={{ ...tdStyle,textAlign:"center" }}>{s.exam||0}</td>
                      <td style={{ ...tdStyle,textAlign:"center" }}>{s.ba||0}</td>
                      <td style={{ ...tdStyle,fontWeight:"bold",textAlign:"center",color:gradeColor(s.grade) }}>{s.total}</td>
                      <td style={{ ...tdStyle,textAlign:"center" }}><GradeBadge grade={s.grade}/></td>
                      <td style={{ ...tdStyle,fontSize:12,color:"#64748b" }}>{s.remark}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ background:"white", borderRadius:12, padding:20, border:"1px solid #e2e8f0" }}>
              <h4 style={{ margin:"0 0 16px" }}>Teacher Comments</h4>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                <div style={{ background:"#f8fafc", borderRadius:8, padding:16 }}><p style={{ fontSize:12, color:"#64748b", margin:"0 0 8px", fontWeight:"bold" }}>Form Teacher</p><p style={{ fontSize:14, color:"#374151", margin:0, fontStyle:"italic" }}>"{comment.form}"</p></div>
                <div style={{ background:"#f8fafc", borderRadius:8, padding:16 }}><p style={{ fontSize:12, color:"#64748b", margin:"0 0 8px", fontWeight:"bold" }}>Head Teacher</p><p style={{ fontSize:14, color:"#374151", margin:0, fontStyle:"italic" }}>"{comment.head}"</p></div>
              </div>
            </div>
          </>
        ) : (
          <div style={{ background:"white", borderRadius:12, border:"1px dashed #e2e8f0", padding:40, textAlign:"center", color:"#94a3b8" }}>
            <div style={{ fontSize:32, marginBottom:8 }}>📭</div>
            <p>No results available for this term yet.</p>
          </div>
        )}
      </div>
      {notify && <div style={{ position:"fixed", bottom:24, right:24, background:"#065f46", color:"white", padding:"12px 20px", borderRadius:10, fontSize:14, zIndex:9999 }}>{notify.msg}</div>}
    </div>
  );
}
