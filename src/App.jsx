import React, { useState, useEffect, useCallback } from "react";

// ─── SUPABASE ─────────────────────────────────────────────────────────────────
const SUPABASE_URL = "https://stolatcjrhkriunpvoky.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0b2xhdGNqcmhrcml1bnB2b2t5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0MTQ5NTIsImV4cCI6MjA5NDk5MDk1Mn0.GyMH-MA_wNnKXEc0uLOqXYseoVuteUAjdwBf5pJnS48";

async function sbFetch(path, method="GET", body=null, prefer="return=representation") {
  const url = `${SUPABASE_URL}/rest/v1/${path}${path.includes("?")?"&":"?"}apikey=${SUPABASE_ANON_KEY}`;
  const headers = { "Authorization":`Bearer ${SUPABASE_ANON_KEY}`, "Content-Type":"application/json", "Prefer":prefer };
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  if (!res.ok) { const e = await res.text(); throw new Error(e); }
  const t = await res.text();
  return t ? JSON.parse(t) : [];
}
const db = {
  select: (table, query="") => sbFetch(query?`${table}?${query}`:table),
  insert: (table, data) => sbFetch(table,"POST",data),
  update: (table, match, data) => sbFetch(`${table}?${match}`,"PATCH",data),
  upsert: (table, data) => sbFetch(table,"POST",data,"resolution=merge-duplicates,return=representation"),
  delete: (table, match) => sbFetch(`${table}?${match}`,"DELETE"),
};

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const SCHOOL_NAME = "Sated Haven High School";
const SCHOOL_SHORT = "SHHS";
const CLASS_FORM_TEACHERS = { JSS1:"adeola.o", JSS2:"joseph.e", JSS3:"gbaranen.b" };
const GRADE_SCALE = [
  {min:91,max:100,grade:"A+",gpa:5.0,remark:"Distinction"},
  {min:80,max:90,grade:"A",gpa:5.0,remark:"Excellent"},
  {min:70,max:79,grade:"B",gpa:4.0,remark:"Very Good"},
  {min:60,max:69,grade:"C",gpa:3.0,remark:"Good"},
  {min:50,max:59,grade:"D",gpa:2.0,remark:"Average"},
  {min:40,max:49,grade:"E",gpa:1.0,remark:"Fair"},
  {min:0,max:39,grade:"F",gpa:0.0,remark:"Poor"},
];
const COMMENT_DB = [
  {min:4.5,max:5.0,form:"Excellent work. You performed exceptionally well.",head:"An Excellent result. Keep maintaining this high standard."},
  {min:4.0,max:4.49,form:"Very good performance. Keep it up.",head:"A very good result. Continue with this positive progress."},
  {min:3.0,max:3.99,form:"Satisfactory effort. Continued consistency will help you progress.",head:"A good result. Steady commitment will strengthen future performance."},
  {min:2.0,max:2.99,form:"Progress is visible; continue working steadily.",head:"A fair result. Continued effort will be beneficial."},
  {min:1.0,max:1.99,form:"More consistent effort in your academics will help you do better.",head:"A modest result. Greater focus will support better improvement."},
  {min:0.0,max:0.99,form:"Needs improvement. A more focused approach is advised.",head:"Needs significant improvement. Increased effort is advised."},
];
const CODING_REMARKS = {1:"Needs Significant Improvement",2:"Below Expectation",3:"Meets Expectation",4:"Exceeds Expectation",5:"Outstanding"};
const JSS_SUBJECTS = ["CRK","CCA","English (Grammar/Speech Work)","English (Literature)","English (Vocabulary)","English (Comprehension/Creative Writing)","Mathematics (Algebra)","Mathematics (Geometry)","Agric Science","ICT","Basic Tech","Basic Science","National Value","History","Home Economics","PHE","Business Studies","French"];
const SS_SCIENCE_SUBJECTS = ["English Language","Mathematics","Physics","Chemistry","Biology","Further Mathematics","Technical Drawing","Agricultural Science","Computer Science","Economics","Geography","CRK","French","PHE"];
const SS_ART_SUBJECTS = ["English Language","Mathematics","Literature in English","Government","Economics","CRK","History","Geography","French","Yoruba","Fine Arts","Music","Commerce","Accounting","PHE"];
const CLASS_SUBJECTS = {JSS1:JSS_SUBJECTS,JSS2:JSS_SUBJECTS,JSS3:JSS_SUBJECTS,"SS1 Science":SS_SCIENCE_SUBJECTS,"SS1 Art":SS_ART_SUBJECTS,"SS2 Science":SS_SCIENCE_SUBJECTS,"SS2 Art":SS_ART_SUBJECTS};
const ALL_CLASSES = ["JSS1","JSS2","JSS3","SS1 Science","SS1 Art","SS2 Science","SS2 Art"];
const MATH_SUBJECTS = ["Mathematics (Algebra)","Mathematics (Geometry)","Mathematics"];
const ENGLISH_SUBJECTS = ["English (Grammar/Speech Work)","English (Literature)","English (Vocabulary)","English (Comprehension/Creative Writing)","English Language"];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const getGradeInfo = s => GRADE_SCALE.find(g=>s>=g.min&&s<=g.max)||GRADE_SCALE[GRADE_SCALE.length-1];
const getComment = gpa => COMMENT_DB.find(c=>gpa>=c.min&&gpa<=c.max)||COMMENT_DB[COMMENT_DB.length-1];
const calcTotal = (c1,c2,ex,ba) => (Number(c1)||0)+(Number(c2)||0)+(Number(ex)||0)+(Number(ba)||0);
const calcGPA = rows => rows.length?(rows.reduce((s,r)=>s+getGradeInfo(r.total).gpa,0)/rows.length).toFixed(2):"0.00";
const calcClassGPA = (scores,studentIds,termId) => {
  const gpas = studentIds.map(sid=>{ const ss=scores.filter(r=>r.term_id===termId&&r.student_id===sid); return ss.length?Number(calcGPA(ss)):null; }).filter(g=>g!==null);
  return gpas.length?(gpas.reduce((a,b)=>a+b,0)/gpas.length).toFixed(2):"—";
};
const gradeColor = g => ({["A+"]:"#059669",A:"#10b981",B:"#3b82f6",C:"#6366f1",D:"#f59e0b",E:"#f97316",F:"#ef4444"}[g]||"#64748b");

// ─── STYLES ───────────────────────────────────────────────────────────────────
const labelStyle={fontSize:12,fontWeight:"bold",color:"#64748b",textTransform:"uppercase",letterSpacing:0.5};
const selectStyle={padding:"8px 12px",border:"1px solid #e2e8f0",borderRadius:8,fontSize:14,background:"white",cursor:"pointer"};
const tdStyle={padding:"10px 14px",fontSize:13,color:"#374151"};
const thStyle={padding:"11px 14px",textAlign:"left",fontSize:11,fontWeight:"bold",color:"#64748b",textTransform:"uppercase",letterSpacing:0.5};

// ─── UI COMPONENTS ────────────────────────────────────────────────────────────
function Input({label,value,onChange,type="text",placeholder,disabled}){
  return(<div>{label&&<label style={labelStyle}>{label}</label>}<input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} disabled={disabled} style={{width:"100%",padding:"10px 12px",border:"1px solid #e2e8f0",borderRadius:8,fontSize:14,marginTop:label?4:0,boxSizing:"border-box",background:disabled?"#f8fafc":"white",color:disabled?"#94a3b8":"#1e293b"}}/></div>);
}
function Textarea({label,value,onChange,placeholder,rows=3}){
  return(<div>{label&&<label style={labelStyle}>{label}</label>}<textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows} style={{width:"100%",padding:"10px 12px",border:"1px solid #e2e8f0",borderRadius:8,fontSize:14,marginTop:label?4:0,boxSizing:"border-box",resize:"vertical"}}/></div>);
}
function GoldButton({onClick,children,style,disabled}){
  return(<button onClick={onClick} disabled={disabled} style={{background:disabled?"#e2e8f0":"linear-gradient(135deg,#c9a84c,#e8c96e)",color:disabled?"#94a3b8":"#1a2d40",border:"none",padding:"10px 20px",borderRadius:8,cursor:disabled?"not-allowed":"pointer",fontWeight:"bold",fontSize:14,...style}}>{children}</button>);
}
function Btn({onClick,children,color="#3b82f6",style,disabled}){
  return(<button onClick={onClick} disabled={disabled} style={{background:color,color:"white",border:"none",padding:"8px 16px",borderRadius:8,cursor:disabled?"not-allowed":"pointer",fontSize:13,...style}}>{children}</button>);
}
function IconBtn({onClick,children,danger,title}){
  return(<button onClick={onClick} title={title} style={{background:danger?"#fee2e2":"#f1f5f9",border:"none",padding:"4px 8px",borderRadius:6,cursor:"pointer",fontSize:14}}>{children}</button>);
}
function InfoRow({label,value}){
  return(<div style={{padding:"7px 0",borderBottom:"1px solid #f1f5f9",display:"flex",justifyContent:"space-between",gap:8}}><span style={{fontSize:12,color:"#64748b"}}>{label}</span><span style={{fontSize:13,color:"#1e293b",fontWeight:"500",textAlign:"right"}}>{value||"—"}</span></div>);
}
function ClassBadge({cls}){
  const bg={JSS1:"#dbeafe",JSS2:"#dcfce7",JSS3:"#fef3c7","SS1 Science":"#ede9fe","SS1 Art":"#fce7f3","SS2 Science":"#e0f2fe","SS2 Art":"#fff7ed"};
  const tx={JSS1:"#1d4ed8",JSS2:"#166534",JSS3:"#92400e","SS1 Science":"#6d28d9","SS1 Art":"#9d174d","SS2 Science":"#0369a1","SS2 Art":"#c2410c"};
  return(<span style={{background:bg[cls]||"#f1f5f9",color:tx[cls]||"#374151",padding:"2px 8px",borderRadius:20,fontSize:12,fontWeight:"500"}}>{cls}</span>);
}
function GradeBadge({grade,small}){
  const c=gradeColor(grade);
  return(<span style={{background:`${c}20`,color:c,padding:small?"1px 6px":"2px 8px",borderRadius:20,fontSize:small?11:12,fontWeight:"bold"}}>{grade||"—"}</span>);
}
function Spinner(){
  return(<div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:60}}><div style={{width:36,height:36,border:"3px solid #e2e8f0",borderTop:"3px solid #c9a84c",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>);
}
function Card({children,style}){
  return(<div style={{background:"white",borderRadius:12,border:"1px solid #e2e8f0",padding:18,...style}}>{children}</div>);
}
function StatCard({label,value,icon,color}){
  return(<Card><div style={{display:"flex",alignItems:"center",gap:14}}><div style={{width:46,height:46,borderRadius:12,background:`${color}15`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>{icon}</div><div><div style={{fontSize:26,fontWeight:"bold",color}}>{value}</div><div style={{fontSize:12,color:"#64748b"}}>{label}</div></div></div></Card>);
}
function Stars({value,onChange,readonly}){
  return(<div style={{display:"flex",gap:3}}>{[1,2,3,4,5].map(i=><span key={i} onClick={()=>!readonly&&onChange&&onChange(i)} style={{fontSize:22,cursor:readonly?"default":"pointer",color:i<=value?"#f59e0b":"#e2e8f0"}}>{i<=value?"★":"☆"}</span>)}</div>);
}
function PromotionStamp({status}){
  const cfg={PROMOTED:{color:"#065f46",bg:"#d1fae5",border:"#10b981",icon:"✅",text:"PROMOTED"},NOT_PROMOTED:{color:"#7f1d1d",bg:"#fee2e2",border:"#ef4444",icon:"❌",text:"NOT PROMOTED"},TRIAL:{color:"#78350f",bg:"#fef3c7",border:"#f59e0b",icon:"⚠️",text:"PROMOTED ON TRIAL"}};
  const c=cfg[status]; if(!c) return null;
  return(<div style={{border:`3px solid ${c.border}`,borderRadius:12,padding:"14px 20px",textAlign:"center",background:c.bg,margin:"12px 0"}}>
    <div style={{fontSize:26,marginBottom:4}}>{c.icon}</div>
    <div style={{fontSize:20,fontWeight:"bold",color:c.color,letterSpacing:2}}>{c.text}</div>
    {status==="TRIAL"&&<div style={{fontSize:12,color:c.color,marginTop:4}}>Average score in Mathematics and English is below 40% across all terms</div>}
  </div>);
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
export default function App(){
  const [user,setUser]=useState(null);
  const [page,setPage]=useState("dashboard");
  const [notify,setNotify]=useState(null);
  const [data,setData]=useState({students:[],staff:[],terms:[],scores:[],attendance:[],assignments:[],codingScores:[],ratings:[]});
  const [loading,setLoading]=useState(false);
  const toast=(msg,type="success")=>{setNotify({msg,type});setTimeout(()=>setNotify(null),3500);};
  const loadAll=useCallback(async()=>{
    setLoading(true);
    try{
      const [students,staff,terms,scores,attendance,assignments,codingScores,ratings]=await Promise.all([
        db.select("students","order=id"),db.select("staff","order=name"),db.select("terms","order=session,term"),
        db.select("scores","order=student_id"),db.select("attendance","order=student_id"),
        db.select("assignments","order=created_at.desc"),db.select("coding_scores","order=student_id"),
        db.select("teacher_ratings","order=created_at.desc"),
      ]);
      setData({students,staff,terms,scores,attendance,assignments,codingScores,ratings});
    }catch(e){toast("Failed to load: "+e.message,"error");}
    setLoading(false);
  },[]);
  useEffect(()=>{if(user)loadAll();},[user]);
  const activeTerm=data.terms.find(t=>t.active)||data.terms[data.terms.length-1];
  if(!user) return <LoginPage onLogin={(u,pg)=>{setUser(u);setPage(pg||"dashboard");}} />;
  if(user.role==="student") return <StudentPortal user={user} data={data} activeTerm={activeTerm} onLogout={()=>setUser(null)} toast={toast} notify={notify} reload={loadAll}/>;
  if(user.role==="parent") return <ParentPortal user={user} data={data} onLogout={()=>setUser(null)} toast={toast} notify={notify}/>;
  return <MainLayout user={user} page={page} setPage={setPage} data={data} activeTerm={activeTerm} toast={toast} notify={notify} reload={loadAll} loading={loading} onLogout={()=>setUser(null)}/>;
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function LoginPage({onLogin}){
  const [tab,setTab]=useState("staff");
  const [u,setU]=useState(""); const [p,setP]=useState("");
  const [sid,setSid]=useState(""); const [pin,setPin]=useState("");
  const [role,setRole]=useState("parent");
  const [err,setErr]=useState(""); const [loading,setLoading]=useState(false);
  const handleStaff=async()=>{
    setLoading(true);setErr("");
    try{ const rows=await db.select("staff",`username=eq.${u}&password=eq.${p}`);
      if(rows.length) onLogin(rows[0]); else setErr("Invalid username or password.");
    }catch(e){setErr("Connection error. Please check your internet.");}
    setLoading(false);
  };
  const handlePortal=async()=>{
    setLoading(true);setErr("");
    try{
      if(role==="parent"){
        const rows=await db.select("students",`id=eq.${sid.toUpperCase()}&parent_pin=eq.${pin}`);
        if(rows.length) onLogin({role:"parent",studentId:rows[0].id,name:`Parent of ${rows[0].name}`});
        else setErr("Invalid Student ID or PIN.");
      } else {
        const rows=await db.select("students",`id=eq.${sid.toUpperCase()}&student_pin=eq.${pin}`);
        if(rows.length) onLogin({role:"student",studentId:rows[0].id,name:rows[0].name,class:rows[0].class});
        else setErr("Invalid Student ID or PIN.");
      }
    }catch(e){setErr("Connection error.");}
    setLoading(false);
  };
  return(
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#0f1923 0%,#1a2d40 50%,#0f1923 100%)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Trebuchet MS',sans-serif",padding:20}}>
      <div style={{width:"100%",maxWidth:440}}>
        <div style={{textAlign:"center",marginBottom:36}}>
          <div style={{width:70,height:70,borderRadius:"50%",background:"linear-gradient(135deg,#c9a84c,#e8c96e)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px",boxShadow:"0 8px 32px rgba(201,168,76,0.4)",fontSize:30}}>🎓</div>
          <h1 style={{color:"#e8c96e",fontSize:22,margin:0,letterSpacing:1}}>{SCHOOL_NAME}</h1>
          <p style={{color:"#8a9bb0",margin:"4px 0 0",fontSize:13}}>School Management System</p>
        </div>
        <div style={{background:"rgba(255,255,255,0.05)",borderRadius:16,border:"1px solid rgba(201,168,76,0.2)",overflow:"hidden"}}>
          <div style={{display:"flex",borderBottom:"1px solid rgba(201,168,76,0.15)"}}>
            {[["staff","Staff Login"],["portal","Student / Parent"]].map(([t,l])=>(
              <button key={t} onClick={()=>{setTab(t);setErr("");}} style={{flex:1,padding:14,background:tab===t?"rgba(201,168,76,0.15)":"transparent",color:tab===t?"#e8c96e":"#8a9bb0",border:"none",cursor:"pointer",fontSize:13,borderBottom:tab===t?"2px solid #c9a84c":"2px solid transparent"}}>{l}</button>
            ))}
          </div>
          <div style={{padding:26}}>
            {err&&<div style={{background:"rgba(220,50,50,0.15)",border:"1px solid rgba(220,50,50,0.3)",borderRadius:8,padding:"10px 14px",color:"#ff8080",fontSize:13,marginBottom:14}}>{err}</div>}
            {tab==="staff"?(
              <><Input label="Username" value={u} onChange={setU} placeholder="e.g. adeola.o"/>
              <div style={{marginTop:10}}><Input label="Password" value={p} onChange={setP} type="password" placeholder="••••••••"/></div>
              <GoldButton onClick={handleStaff} style={{marginTop:14,width:"100%"}} disabled={loading}>{loading?"Signing in...":"Sign In"}</GoldButton></>
            ):(
              <><div style={{display:"flex",gap:8,marginBottom:12}}>
                {[["parent","Parent"],["student","Student"]].map(([r,l])=>(
                  <button key={r} onClick={()=>setRole(r)} style={{flex:1,padding:"8px",borderRadius:8,border:`2px solid ${role===r?"#c9a84c":"#e2e8f0"}`,background:role===r?"rgba(201,168,76,0.1)":"white",cursor:"pointer",color:role===r?"#92400e":"#64748b",fontSize:13,fontWeight:role===r?"bold":"normal"}}>{l}</button>
                ))}
              </div>
              <Input label="Student ID" value={sid} onChange={setSid} placeholder="e.g. SH11"/>
              <div style={{marginTop:10}}><Input label="PIN" value={pin} onChange={setPin} type="password" placeholder="Your PIN"/></div>
              <GoldButton onClick={handlePortal} style={{marginTop:14,width:"100%"}} disabled={loading}>{loading?"Checking...":"Access Portal"}</GoldButton></>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


// ─── MAIN LAYOUT ─────────────────────────────────────────────────────────────
function MainLayout({user,page,setPage,data,activeTerm,toast,notify,reload,loading,onLogout}){
  const [sidebarOpen,setSidebarOpen]=useState(true);
  const isAdmin=user.role==="admin";
  const adminNav=[
    {id:"dashboard",label:"Dashboard",icon:"M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"},
    {id:"students",label:"Students",icon:"M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8z"},
    {id:"scores",label:"Enter Scores",icon:"M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"},
    {id:"reports",label:"Report Cards",icon:"M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6"},
    {id:"attendance",label:"Attendance",icon:"M9 12l2 2 4-4"},
    {id:"elearning",label:"E-Learning",icon:"M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253"},
    {id:"performance",label:"Performance",icon:"M18 20V10M12 20V4M6 20v-6"},
    {id:"staff",label:"Staff",icon:"M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z"},
    {id:"ratings",label:"Teacher Ratings",icon:"M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"},
    {id:"terms",label:"Terms",icon:"M8 6h13M8 12h13M8 18h13"},
    {id:"subjects",label:"Subject Assignment",icon:"M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"},
  ];
  const teacherNav=[
    {id:"dashboard",label:"Dashboard",icon:"M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"},
    {id:"scores",label:"Grading",icon:"M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"},
    {id:"attendance",label:"Attendance",icon:"M9 12l2 2 4-4"},
    {id:"students",label:"My Students",icon:"M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8z"},
    {id:"elearning",label:"E-Learning",icon:"M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253"},
    {id:"performance",label:"Performance",icon:"M18 20V10M12 20V4M6 20v-6"},
  ];
  const navItems=isAdmin?adminNav:teacherNav;
  const props={user,data,activeTerm,toast,isAdmin,reload};
  const pageMap={dashboard:<Dashboard {...props}/>,students:<StudentsPage {...props}/>,scores:<ScoresPage {...props}/>,reports:<ReportsPage {...props}/>,attendance:<AttendancePage {...props}/>,elearning:<ELearningPage {...props}/>,performance:<PerformancePage {...props}/>,staff:isAdmin?<StaffPage {...props}/>:null,ratings:isAdmin?<RatingsPage {...props}/>:null,terms:isAdmin?<TermsPage {...props}/>:null,subjects:isAdmin?<SubjectAssignmentPage {...props}/>:null};
  return(
    <div style={{display:"flex",minHeight:"100vh",background:"#f0f4f8",fontFamily:"Trebuchet MS,sans-serif"}}>
      <div style={{width:sidebarOpen?240:64,background:"linear-gradient(180deg,#0f1923,#1a2d40)",transition:"width 0.3s",flexShrink:0,display:"flex",flexDirection:"column",position:"fixed",top:0,left:0,height:"100vh",zIndex:100,overflow:"hidden"}}>
        <div style={{padding:"14px",borderBottom:"1px solid rgba(201,168,76,0.15)",display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:34,height:34,borderRadius:"50%",background:"linear-gradient(135deg,#c9a84c,#e8c96e)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:16}}>🎓</div>
          {sidebarOpen&&<div><div style={{color:"#e8c96e",fontWeight:"bold",fontSize:13}}>{SCHOOL_SHORT}</div><div style={{color:"#566a7f",fontSize:10}}>{user.role.toUpperCase()}</div></div>}
        </div>
        <nav style={{flex:1,padding:"8px",overflowY:"auto"}}>
          {navItems.map(item=>(
            <button key={item.id} onClick={()=>setPage(item.id)} style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"9px 10px",borderRadius:8,border:"none",cursor:"pointer",marginBottom:2,background:page===item.id?"rgba(201,168,76,0.15)":"transparent",color:page===item.id?"#e8c96e":"#8a9bb0",textAlign:"left",whiteSpace:"nowrap"}}>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><path d={item.icon}/></svg>
              {sidebarOpen&&<span style={{fontSize:13}}>{item.label}</span>}
            </button>
          ))}
        </nav>
        <div style={{padding:"8px",borderTop:"1px solid rgba(201,168,76,0.15)"}}>
          {sidebarOpen&&<div style={{padding:"6px 10px",marginBottom:4}}><div style={{color:"#e8c96e",fontSize:12,fontWeight:"bold"}}>{user.name}</div><div style={{color:"#566a7f",fontSize:10}}>{user.role}</div></div>}
          <button onClick={onLogout} style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"9px 10px",borderRadius:8,border:"none",cursor:"pointer",background:"rgba(220,50,50,0.1)",color:"#ff8080"}}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
            {sidebarOpen&&<span style={{fontSize:13}}>Logout</span>}
          </button>
        </div>
      </div>
      <div style={{flex:1,marginLeft:sidebarOpen?240:64,transition:"margin-left 0.3s",minHeight:"100vh",display:"flex",flexDirection:"column"}}>
        <header style={{background:"white",padding:"0 20px",height:54,display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid #e2e8f0",position:"sticky",top:0,zIndex:50}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <button onClick={()=>setSidebarOpen(!sidebarOpen)} style={{background:"none",border:"none",cursor:"pointer",color:"#64748b",padding:4}}>
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
            </button>
            <h2 style={{margin:0,fontSize:15,color:"#1e293b",fontWeight:"bold"}}>{navItems.find(n=>n.id===page)?.label||"Dashboard"}</h2>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <button onClick={reload} style={{background:"none",border:"1px solid #e2e8f0",borderRadius:8,padding:"5px 12px",cursor:"pointer",fontSize:12,color:"#64748b"}}>↻ Refresh</button>
            <span style={{background:"#f0f9ff",color:"#0369a1",padding:"4px 10px",borderRadius:20,fontSize:12,border:"1px solid #bae6fd"}}>{activeTerm?.label}</span>
          </div>
        </header>
        <main style={{flex:1,padding:20,overflowY:"auto"}}>{loading?<Spinner/>:(pageMap[page]||<Dashboard {...props}/>)}</main>
      </div>
      {notify&&<div style={{position:"fixed",bottom:24,right:24,background:notify.type==="success"?"#065f46":"#7f1d1d",color:"white",padding:"12px 20px",borderRadius:10,fontSize:14,zIndex:9999}}>{notify.msg}</div>}
    </div>
  );
}

function Dashboard({user,data,activeTerm,isAdmin}){
  const {students,staff,scores,assignments,ratings}=data;
  const myAssignments=isAdmin?assignments:assignments.filter(a=>a.teacher_id===user.id);
  const myRatings=isAdmin?ratings:ratings.filter(r=>r.teacher_id===user.id);
  const avgRating=myRatings.length?(myRatings.reduce((s,r)=>s+r.rating,0)/myRatings.length).toFixed(1):"—";
  const termScores=scores.filter(s=>s.term_id===activeTerm?.id);
  const uniqueWithScores=[...new Set(termScores.map(s=>s.student_id))].length;
  return(
    <div>
      <div style={{marginBottom:18}}><h3 style={{margin:0,color:"#1e293b"}}>Welcome, {user.name.split(" ")[0]}! 👋</h3><p style={{color:"#64748b",margin:"4px 0 0",fontSize:14}}>{activeTerm?.label}</p></div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12,marginBottom:18}}>
        <StatCard label={isAdmin?"Total Students":"My Students"} value={isAdmin?students.length:students.filter(s=>(user.classes||[]).includes(s.class)).length} icon="👨‍🎓" color="#3b82f6"/>
        {isAdmin&&<StatCard label="Staff" value={staff.filter(s=>s.role==="teacher").length} icon="👨‍🏫" color="#8b5cf6"/>}
        <StatCard label="Results Entered" value={uniqueWithScores} icon="📝" color="#10b981"/>
        <StatCard label="Assignments" value={myAssignments.length} icon="📚" color="#f59e0b"/>
        <StatCard label="Avg Rating" value={avgRating} icon="⭐" color="#ec4899"/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        <Card><h4 style={{margin:"0 0 12px"}}>Students by Class</h4>
          {ALL_CLASSES.map(c=>{const cnt=students.filter(s=>s.class===c).length;if(!cnt)return null;
            return(<div key={c} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:"1px solid #f1f5f9"}}>
              <span style={{fontSize:13}}>{c}</span>
              <div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:70,height:5,borderRadius:3,background:"#f1f5f9"}}><div style={{width:Math.round((cnt/students.length)*100)+"%",height:"100%",background:"#3b82f6",borderRadius:3}}/></div><b style={{fontSize:13,color:"#3b82f6"}}>{cnt}</b></div>
            </div>);
          })}
        </Card>
        <Card><h4 style={{margin:"0 0 12px"}}>Recent Assignments</h4>
          {myAssignments.slice(0,5).map(a=>(<div key={a.id} style={{padding:"7px 0",borderBottom:"1px solid #f1f5f9"}}><div style={{fontSize:13,fontWeight:"500"}}>{a.title}</div><div style={{fontSize:12,color:"#64748b"}}>{a.class} · {a.subject}</div></div>))}
          {!myAssignments.length&&<p style={{color:"#94a3b8",fontSize:13}}>No assignments yet.</p>}
        </Card>
      </div>
    </div>
  );
}

function StudentsPage({user,data,toast,isAdmin,reload}){
  const {students}=data;
  const [filter,setFilter]=useState(""); const [classFilter,setClassFilter]=useState("All");
  const [showAdd,setShowAdd]=useState(false); const [editing,setEditing]=useState(null);
  const [form,setForm]=useState({id:"",name:"",class:"JSS1",dob:"",parent_pin:"",student_pin:""});
  const [saving,setSaving]=useState(false);
  const myClasses=isAdmin?ALL_CLASSES:(user.classes||[]);
  const filtered=students.filter(s=>(classFilter==="All"||s.class===classFilter)&&myClasses.includes(s.class)&&(s.name.toLowerCase().includes(filter.toLowerCase())||s.id.toLowerCase().includes(filter.toLowerCase())));
  const handleSave=async()=>{
    if(!form.id||!form.name) return toast("ID and name required.","error");
    setSaving(true);
    try{
      if(editing){await db.update("students","id=eq."+form.id,{name:form.name,class:form.class,dob:form.dob,parent_pin:form.parent_pin,student_pin:form.student_pin});toast("Updated!");}
      else{await db.insert("students",form);toast("Added!");}
      await reload();setShowAdd(false);setEditing(null);setForm({id:"",name:"",class:"JSS1",dob:"",parent_pin:"",student_pin:""});
    }catch(e){toast("Error: "+e.message,"error");}
    setSaving(false);
  };
  const handleDelete=async(id)=>{
    if(!window.confirm("Delete?")) return;
    try{await db.delete("students","id=eq."+id);await reload();toast("Deleted.");}catch(e){toast("Error.","error");}
  };
  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div style={{display:"flex",gap:10}}>
          <input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Search..." style={{padding:"8px 12px",border:"1px solid #e2e8f0",borderRadius:8,fontSize:14,minWidth:180}}/>
          <select value={classFilter} onChange={e=>setClassFilter(e.target.value)} style={selectStyle}><option>All</option>{myClasses.map(c=><option key={c}>{c}</option>)}</select>
        </div>
        {isAdmin&&<GoldButton onClick={()=>{setShowAdd(true);setEditing(null);setForm({id:"",name:"",class:"JSS1",dob:"",parent_pin:"",student_pin:""});}}>+ Add Student</GoldButton>}
      </div>
      {(showAdd||editing)&&<Card style={{marginBottom:14}}>
        <h4 style={{margin:"0 0 14px"}}>{editing?"Edit":"Add"} Student</h4>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Input label="Student ID" value={form.id} onChange={v=>setForm({...form,id:v})} disabled={!!editing}/>
          <Input label="Full Name" value={form.name} onChange={v=>setForm({...form,name:v})}/>
          <div><label style={labelStyle}>Class</label><select value={form.class} onChange={e=>setForm({...form,class:e.target.value})} style={{...selectStyle,width:"100%",marginTop:4}}>{ALL_CLASSES.map(c=><option key={c}>{c}</option>)}</select></div>
          <Input label="Date of Birth" value={form.dob} onChange={v=>setForm({...form,dob:v})} type="date"/>
          <Input label="Parent PIN" value={form.parent_pin} onChange={v=>setForm({...form,parent_pin:v})}/>
          <Input label="Student PIN" value={form.student_pin} onChange={v=>setForm({...form,student_pin:v})}/>
        </div>
        <div style={{display:"flex",gap:10,marginTop:12}}>
          <GoldButton onClick={handleSave} disabled={saving}>{saving?"Saving...":"Save"}</GoldButton>
          <button onClick={()=>{setShowAdd(false);setEditing(null);}} style={{padding:"10px 18px",borderRadius:8,border:"1px solid #e2e8f0",background:"white",cursor:"pointer"}}>Cancel</button>
        </div>
      </Card>}
      <Card style={{padding:0,overflow:"hidden"}}>
        <div style={{padding:"10px 14px",background:"#f8fafc",borderBottom:"1px solid #e2e8f0",fontSize:13,color:"#64748b"}}>{filtered.length} students</div>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead><tr style={{background:"#f8fafc"}}>{["ID","Name","Class","DOB","Parent PIN","Student PIN",...(isAdmin?["Actions"]:[])].map(h=><th key={h} style={thStyle}>{h}</th>)}</tr></thead>
          <tbody>{filtered.map((s,i)=>(<tr key={s.id} style={{borderTop:"1px solid #f1f5f9",background:i%2?"#fafafa":"white"}}>
            <td style={tdStyle}><span style={{fontFamily:"monospace",background:"#f1f5f9",padding:"2px 6px",borderRadius:4,fontSize:12}}>{s.id}</span></td>
            <td style={{...tdStyle,fontWeight:"500"}}>{s.name}</td>
            <td style={tdStyle}><ClassBadge cls={s.class}/></td>
            <td style={{...tdStyle,fontSize:12}}>{s.dob||"—"}</td>
            <td style={{...tdStyle,fontFamily:"monospace",fontSize:12,color:"#6366f1"}}>{s.parent_pin}</td>
            <td style={{...tdStyle,fontFamily:"monospace",fontSize:12,color:"#10b981"}}>{s.student_pin||s.parent_pin}</td>
            {isAdmin&&<td style={tdStyle}><div style={{display:"flex",gap:6}}>
              <IconBtn onClick={()=>{setEditing(s.id);setForm({...s,student_pin:s.student_pin||s.parent_pin});}}>✏️</IconBtn>
              <IconBtn onClick={()=>handleDelete(s.id)} danger>🗑️</IconBtn>
            </div></td>}
          </tr>))}</tbody>
        </table>
      </Card>
    </div>
  );
}

function ScoresPage({user,data,activeTerm,toast,isAdmin,reload}){
  const {students,terms,scores,codingScores}=data;
  const [selectedTerm,setSelectedTerm]=useState(activeTerm?.id||"");
  const [selectedClass,setSelectedClass]=useState(""); const [selectedStudent,setSelectedStudent]=useState("");
  const [sheetType,setSheetType]=useState("cat1"); const [localScores,setLocalScores]=useState({});
  const [codingScore,setCodingScore]=useState(0); const [saving,setSaving]=useState(false); const [saved,setSaved]=useState(false);
  const allowedClasses=isAdmin?ALL_CLASSES:(user.classes||[]);
  const classStudents=students.filter(s=>s.class===selectedClass);
  const subjects=CLASS_SUBJECTS[selectedClass]||[];
  useEffect(()=>{
    if(selectedStudent&&selectedTerm&&selectedClass){
      const existing=scores.filter(s=>s.term_id===selectedTerm&&s.student_id===selectedStudent);
      const init={};
      subjects.forEach(sub=>{const r=existing.find(e=>e.subject===sub);init[sub]=r?{cat1:r.cat1,cat2:r.cat2,exam:r.exam,ba:r.ba}:{cat1:"",cat2:"",exam:"",ba:""};});
      setLocalScores(init);
      const cs=codingScores.find(c=>c.term_id===selectedTerm&&c.student_id===selectedStudent);
      setCodingScore(cs?.score||0);setSaved(false);
    }
  },[selectedStudent,selectedTerm,selectedClass]);
  const handleChange=(sub,field,val)=>{
    const max=field==="exam"?60:field==="ba"?10:15;
    setLocalScores(prev=>({...prev,[sub]:{...prev[sub],[field]:val===""?"":Math.min(Number(val)||0,max)}}));setSaved(false);
  };
  const handleSave=async()=>{
    if(!selectedStudent||!selectedTerm) return;
    setSaving(true);
    try{
      for(const sub of subjects){
        const s=localScores[sub]||{};
        if(s.cat1===""&&s.cat2===""&&s.exam===""&&s.ba==="") continue;
        const total=calcTotal(s.cat1,s.cat2,s.exam,s.ba);const info=getGradeInfo(total);
        await db.upsert("scores",{term_id:selectedTerm,student_id:selectedStudent,subject:sub,cat1:Number(s.cat1)||0,cat2:Number(s.cat2)||0,exam:Number(s.exam)||0,ba:Number(s.ba)||0,total,grade:info.grade,gpa:info.gpa,remark:info.remark});
      }
      if(codingScore>0) await db.upsert("coding_scores",{term_id:selectedTerm,student_id:selectedStudent,score:codingScore,remark:CODING_REMARKS[codingScore]||""});
      await reload();setSaved(true);toast("Scores saved!");
    }catch(e){toast("Save failed: "+e.message,"error");}
    setSaving(false);
  };
  const student=students.find(s=>s.id===selectedStudent);
  const fieldMax={cat1:15,cat2:15,exam:60,ba:10};
  const sheetFields={cat1:["cat1"],cat2:["cat2"],exam:["cat1","cat2","exam","ba"]};
  return(
    <div>
      <Card style={{marginBottom:14}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
          <div><label style={labelStyle}>Term</label><select value={selectedTerm} onChange={e=>setSelectedTerm(e.target.value)} style={{...selectStyle,width:"100%",marginTop:4}}><option value="">Select...</option>{terms.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}</select></div>
          <div><label style={labelStyle}>Class</label><select value={selectedClass} onChange={e=>{setSelectedClass(e.target.value);setSelectedStudent("");}} style={{...selectStyle,width:"100%",marginTop:4}}><option value="">Select...</option>{allowedClasses.map(c=><option key={c}>{c}</option>)}</select></div>
          <div><label style={labelStyle}>Student</label><select value={selectedStudent} onChange={e=>setSelectedStudent(e.target.value)} style={{...selectStyle,width:"100%",marginTop:4}} disabled={!selectedClass}><option value="">Select...</option>{classStudents.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
          <div><label style={labelStyle}>Sheet Type</label><select value={sheetType} onChange={e=>setSheetType(e.target.value)} style={{...selectStyle,width:"100%",marginTop:4}}><option value="cat1">CAT 1 Sheet</option><option value="cat2">CAT 2 Sheet</option><option value="exam">Exam Sheet</option></select></div>
        </div>
      </Card>
      {selectedStudent&&selectedClass?(
        <Card style={{padding:0,overflow:"hidden"}}>
          <div style={{padding:"12px 18px",background:"#f8fafc",borderBottom:"1px solid #e2e8f0",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div><h4 style={{margin:0}}>{student?.name} — <span style={{color:"#6366f1"}}>{sheetType==="cat1"?"CAT 1":sheetType==="cat2"?"CAT 2":"Exam"} Sheet</span></h4><span style={{fontSize:13,color:"#64748b"}}>{selectedClass} · {student?.id}</span></div>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>{saved&&<span style={{color:"#10b981",fontSize:13}}>✓ Saved</span>}<GoldButton onClick={handleSave} disabled={saving}>{saving?"Saving...":"Save Scores"}</GoldButton></div>
          </div>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead><tr style={{background:"#f8fafc"}}>
                <th style={{...thStyle,minWidth:190}}>Subject</th>
                {sheetFields[sheetType].map(f=><th key={f} style={thStyle}>{f==="cat1"?"CAT 1 /15":f==="cat2"?"CAT 2 /15":f==="exam"?"Exam /60":"BA /10"}</th>)}
                <th style={thStyle}>Total</th><th style={thStyle}>Grade</th>
              </tr></thead>
              <tbody>{subjects.map((sub,i)=>{
                const s=localScores[sub]||{};
                const dt=sheetType==="exam"?calcTotal(s.cat1,s.cat2,s.exam,s.ba):Number(s[sheetType])||0;
                const info=getGradeInfo(dt);
                return(<tr key={sub} style={{borderTop:"1px solid #f1f5f9",background:i%2?"#fafafa":"white"}}>
                  <td style={{...tdStyle,fontSize:13}}>{sub}</td>
                  {sheetFields[sheetType].map(field=>(<td key={field} style={tdStyle}><input type="number" min="0" max={fieldMax[field]} value={s[field]??""} onChange={e=>handleChange(sub,field,e.target.value)} style={{width:56,padding:"4px 6px",border:"1px solid #e2e8f0",borderRadius:6,textAlign:"center",fontSize:13}}/></td>))}
                  <td style={{...tdStyle,fontWeight:"bold",color:dt>0?gradeColor(info.grade):"#94a3b8"}}>{dt||"—"}</td>
                  <td style={tdStyle}>{dt>0?<GradeBadge grade={info.grade}/>:"—"}</td>
                </tr>);
              })}</tbody>
            </table>
          </div>
          <div style={{padding:"12px 18px",borderTop:"1px solid #e2e8f0",background:"#fafafa",display:"flex",alignItems:"center",gap:16}}>
            <span style={{fontSize:13,fontWeight:"bold",color:"#64748b"}}>Coding Score (1–5):</span>
            <Stars value={codingScore} onChange={setCodingScore}/>
            {codingScore>0&&<span style={{fontSize:13,color:"#6366f1"}}>{CODING_REMARKS[codingScore]}</span>}
          </div>
        </Card>
      ):(
        <Card style={{textAlign:"center",padding:60,border:"1px dashed #e2e8f0"}}><div style={{fontSize:40,marginBottom:12}}>📝</div><p style={{color:"#94a3b8"}}>Select term, class, student and sheet type</p></Card>
      )}
    </div>
  );
}


// ─── REPORTS PAGE ─────────────────────────────────────────────────────────────
function ReportsPage({data}){
  const {students,scores,terms,staff,attendance,codingScores}=data;
  const [selectedTerm,setSelectedTerm]=useState(terms.find(t=>t.active)?.id||"");
  const [selectedClass,setSelectedClass]=useState(""); const [selectedStudent,setSelectedStudent]=useState("");
  const [reportType,setReportType]=useState("exam"); const [report,setReport]=useState(null);
  const classStudents=students.filter(s=>s.class===selectedClass);
  const generate=()=>{
    const student=students.find(s=>s.id===selectedStudent); if(!student) return;
    const term=terms.find(t=>t.id===selectedTerm);
    const termScores=scores.filter(s=>s.term_id===selectedTerm&&s.student_id===selectedStudent);
    const gpa=calcGPA(termScores); const comment=getComment(Number(gpa));
    const ftUsername=CLASS_FORM_TEACHERS[student.class];
    const formTeacher=staff.find(s=>s.username===ftUsername)||staff.find(s=>s.role==="teacher"&&s.classes?.includes(student.class));
    const att=attendance.find(a=>a.term_id===selectedTerm&&a.student_id===selectedStudent)||{};
    const classStudentIds=students.filter(s=>s.class===student.class).map(s=>s.id);
    const classGPA=calcClassGPA(scores,classStudentIds,selectedTerm);
    const withPos=termScores.map(sc=>{
      const all=classStudentIds.map(sid=>scores.find(r=>r.term_id===selectedTerm&&r.student_id===sid&&r.subject===sc.subject)?.total||0).sort((a,b)=>b-a);
      const classAvg=all.length?all.reduce((a,b)=>a+b,0)/all.length:0;
      return{...sc,position:all.indexOf(sc.total)+1,classAvg:classAvg.toFixed(1)};
    });
    const codingScore=codingScores.find(c=>c.term_id===selectedTerm&&c.student_id===selectedStudent);
    let prevTermScores={};
    if(term?.term===3){
      const sessionTerms=terms.filter(t=>t.session===term.session).sort((a,b)=>a.term-b.term);
      const t1=sessionTerms.find(t=>t.term===1); const t2=sessionTerms.find(t=>t.term===2);
      if(t1) prevTermScores.term1=scores.filter(s=>s.term_id===t1.id&&s.student_id===selectedStudent);
      if(t2) prevTermScores.term2=scores.filter(s=>s.term_id===t2.id&&s.student_id===selectedStudent);
    }
    let promotionStatus=null;
    if(term?.term===3){
      const gpaNum=Number(gpa);
      const sessionTerms=terms.filter(t=>t.session===term.session).sort((a,b)=>a.term-b.term);
      const avgSub=(subList)=>{let total=0,cnt=0;sessionTerms.forEach(t=>subList.forEach(sub=>{const r=scores.find(x=>x.term_id===t.id&&x.student_id===selectedStudent&&x.subject===sub);if(r){total+=r.total;cnt++;}}));return cnt>0?total/cnt:null;};
      const avgM=avgSub(MATH_SUBJECTS); const avgE=avgSub(ENGLISH_SUBJECTS);
      if(gpaNum>=2.5){promotionStatus=(avgM!==null&&avgM<40&&avgE!==null&&avgE<40)?"TRIAL":"PROMOTED";}
      else{promotionStatus="NOT_PROMOTED";}
    }
    setReport({student,term,scores:withPos,gpa,classGPA,comment,formTeacher,att,promotionStatus,codingScore,prevTermScores,reportType,staff});
  };
  if(report) return <ReportCard {...report} onBack={()=>setReport(null)}/>;
  return(
    <div>
      <Card style={{marginBottom:14}}>
        <h4 style={{margin:"0 0 14px"}}>Generate Report Card</h4>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
          <div><label style={labelStyle}>Term</label><select value={selectedTerm} onChange={e=>setSelectedTerm(e.target.value)} style={{...selectStyle,width:"100%",marginTop:4}}>{terms.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}</select></div>
          <div><label style={labelStyle}>Class</label><select value={selectedClass} onChange={e=>{setSelectedClass(e.target.value);setSelectedStudent("");}} style={{...selectStyle,width:"100%",marginTop:4}}><option value="">Select...</option>{ALL_CLASSES.map(c=><option key={c}>{c}</option>)}</select></div>
          <div><label style={labelStyle}>Student</label><select value={selectedStudent} onChange={e=>setSelectedStudent(e.target.value)} style={{...selectStyle,width:"100%",marginTop:4}} disabled={!selectedClass}><option value="">Select...</option>{classStudents.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
          <div><label style={labelStyle}>Report Type</label><select value={reportType} onChange={e=>setReportType(e.target.value)} style={{...selectStyle,width:"100%",marginTop:4}}><option value="cat1">CAT 1 Report</option><option value="cat2">CAT 2 Report</option><option value="exam">Full Term Report</option></select></div>
        </div>
        <GoldButton onClick={generate} style={{marginTop:12}} disabled={!selectedStudent}>Generate Report</GoldButton>
      </Card>
      {selectedClass&&selectedTerm&&<Card style={{padding:0,overflow:"hidden"}}>
        <div style={{padding:"12px 16px",borderBottom:"1px solid #e2e8f0"}}><h4 style={{margin:0}}>Class Summary — {selectedClass}</h4></div>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead><tr style={{background:"#f8fafc"}}>{["Student","ID","Subjects","GPA","Class Avg GPA"].map(h=><th key={h} style={thStyle}>{h}</th>)}</tr></thead>
          <tbody>{classStudents.map((s,i)=>{
            const ss=scores.filter(r=>r.term_id===selectedTerm&&r.student_id===s.id);
            const gpa=calcGPA(ss);const classAvgGPA=calcClassGPA(scores,classStudents.map(x=>x.id),selectedTerm);
            return(<tr key={s.id} style={{borderTop:"1px solid #f1f5f9",background:i%2?"#fafafa":"white"}}>
              <td style={tdStyle}>{s.name}</td><td style={{...tdStyle,fontFamily:"monospace",fontSize:12}}>{s.id}</td>
              <td style={tdStyle}>{ss.length}</td><td style={{...tdStyle,fontWeight:"bold",color:"#6366f1"}}>{ss.length?gpa:"—"}</td>
              <td style={{...tdStyle,color:"#64748b"}}>{classAvgGPA}</td>
            </tr>);
          })}</tbody>
        </table>
      </Card>}
    </div>
  );
}

function ReportCard({student,term,scores,gpa,classGPA,comment,formTeacher,att,promotionStatus,codingScore,prevTermScores,reportType,onBack,staff}){
  const isCAT1=reportType==="cat1"; const isCAT2=reportType==="cat2"; const isFull=reportType==="exam";
  const isTerm3=term?.term===3;
  const gradeKey=[{g:"A+",r:"91-100",p:"5.0",d:"Distinction"},{g:"A",r:"80-90",p:"5.0",d:"Excellent"},{g:"B",r:"70-79",p:"4.0",d:"Very Good"},{g:"C",r:"60-69",p:"3.0",d:"Good"},{g:"D",r:"50-59",p:"2.0",d:"Average"},{g:"E",r:"40-49",p:"1.0",d:"Fair"},{g:"F",r:"0-39",p:"0.0",d:"Poor"}];
  const getSub=(sub,ts)=>ts?.find(s=>s.subject===sub)?.total||"—";
  const getSubjectTeacher=(subject)=>{
    const teacher=staff?.find(s=>s.role==="teacher"&&s.subjects?.includes(subject));
    if(!teacher) return "—";
    const parts=teacher.name.replace(/^(Mr\.|Mrs\.|Ms\.|Dr\.|Monsieur)\s*/i,"").split(" ");
    return parts[parts.length-1]||teacher.name;
  };
  const th=(label,extra={})=><th style={{padding:"8px 8px",fontSize:10,color:"#e8c96e",fontWeight:"bold",textAlign:"center",whiteSpace:"nowrap",...extra}}>{label}</th>;
  const td=(val,extra={})=><td style={{padding:"7px 8px",fontSize:12,textAlign:"center",...extra}}>{val}</td>;
  return(
    <div>
      <div style={{display:"flex",gap:10,marginBottom:14}}>
        <button onClick={onBack} style={{padding:"8px 14px",borderRadius:8,border:"1px solid #e2e8f0",background:"white",cursor:"pointer",fontSize:13}}>← Back</button>
        <button onClick={()=>window.print()} style={{padding:"8px 14px",borderRadius:8,border:"none",background:"#3b82f6",cursor:"pointer",color:"white",fontSize:13}}>🖨️ Print</button>
      </div>
      <div style={{background:"white",borderRadius:12,border:"2px solid #c9a84c",maxWidth:1020,margin:"0 auto",overflow:"hidden"}}>
        <div style={{background:"linear-gradient(135deg,#0f1923,#1a2d40)",padding:"18px 26px",textAlign:"center",color:"white"}}>
          <div style={{fontSize:26,marginBottom:6}}>🎓</div>
          <h2 style={{color:"#e8c96e",margin:"0 0 2px",fontSize:19}}>{SCHOOL_NAME}</h2>
          <p style={{color:"#8a9bb0",margin:0,fontSize:12}}>Official Academic Report Card</p>
          <p style={{color:"#c9a84c",margin:"6px 0 0",fontWeight:"bold",fontSize:13}}>{term?.label} — {isCAT1?"CAT 1 Assessment":isCAT2?"CAT 2 Assessment":"Full Term Report"}</p>
        </div>
        <div style={{padding:"14px 26px",borderBottom:"1px solid #e2e8f0",display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,background:"#fafafa"}}>
          <InfoRow label="Student Name" value={student.name}/><InfoRow label="Admission No." value={student.id}/><InfoRow label="Class" value={student.class}/>
          <InfoRow label="Date of Birth" value={student.dob||"—"}/><InfoRow label="Days Present" value={att.present||"—"}/><InfoRow label="Days Absent" value={att.present!=null&&att.total?att.total-att.present:"—"}/>
        </div>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr style={{background:"#1a2d40"}}>
              {th("SUBJECT",{textAlign:"left",minWidth:170,fontSize:11})}
              {(isCAT1||isCAT2)&&<>
                {th(isCAT1?"CAT 1 /15":"CAT 2 /15")}
                {th("BA /10")}
                {th("GP")}
                {th("GRADE")}
                {th("SUBJECT POSITION")}
                {th("SUBJECT TEACHER")}
                {th("REMARK")}
              </>}
              {isFull&&<>
                {th("CAT 1")}
                {th("CAT 2")}
                {th("EXAM")}
                {th("BA")}
                {th("TOTAL")}
                {th("GRADE")}
                {th("POS")}
                {th("GP")}
                {isTerm3&&<>{th("T1",{color:"#f59e0b"})}{th("T2",{color:"#f59e0b"})}</>}
                {th("SUBJECT TEACHER")}
                {th("REMARK")}
              </>}
            </tr></thead>
            <tbody>{scores.map((s,i)=>{
              const c1=Number(s.cat1)||0; const c2=Number(s.cat2)||0;
              const catScore=isCAT1?c1:c2;
              const catInfo=getGradeInfo(catScore);
              const catGP=catInfo.gpa;
              const subTeacher=getSubjectTeacher(s.subject);
              return(<tr key={s.subject} style={{borderBottom:"1px solid #f1f5f9",background:i%2?"#f8fafc":"white"}}>
                <td style={{padding:"7px 10px",fontSize:12,fontWeight:"500"}}>{s.subject}</td>
                {(isCAT1||isCAT2)&&<>
                  {td(<span style={{fontWeight:"bold",color:gradeColor(catInfo.grade)}}>{catScore}</span>)}
                  {td(s.ba||0)}
                  {td(catGP)}
                  {td(<GradeBadge grade={catInfo.grade} small/>)}
                  {td(s.position||"—",{color:"#6366f1",fontWeight:"500"})}
                  {td(subTeacher,{color:"#374151",fontSize:11})}
                  {td(catInfo.remark,{color:"#64748b",fontSize:11})}
                </>}
                {isFull&&<>
                  {td(s.cat1||0)}
                  {td(s.cat2||0)}
                  {td(s.exam||0)}
                  {td(s.ba||0)}
                  {td(<span style={{fontWeight:"bold",color:gradeColor(s.grade)}}>{s.total}</span>)}
                  {td(<GradeBadge grade={s.grade} small/>)}
                  {td(s.position||"—",{color:"#6366f1",fontWeight:"500"})}
                  {td(getGradeInfo(s.total).gpa)}
                  {isTerm3&&<>{td(getSub(s.subject,prevTermScores?.term1),{color:"#d97706",fontWeight:"500"})}{td(getSub(s.subject,prevTermScores?.term2),{color:"#d97706",fontWeight:"500"})}</>}
                  {td(subTeacher,{color:"#374151",fontSize:11})}
                  {td(s.remark,{color:"#64748b",fontSize:11})}
                </>}
              </tr>);
            })}</tbody>
          </table>
        </div>
        <div style={{padding:"14px 26px",borderTop:"2px solid #e2e8f0",display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
          <div>
            <div style={{background:"#f8fafc",borderRadius:8,padding:12,border:"1px solid #e2e8f0",marginBottom:12,display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div style={{textAlign:"center"}}><div style={{fontSize:12,color:"#64748b",marginBottom:2}}>Student GPA</div><div style={{fontSize:22,fontWeight:"bold",color:"#6366f1"}}>{gpa}</div></div>
              <div style={{textAlign:"center"}}><div style={{fontSize:12,color:"#64748b",marginBottom:2}}>Class GPA</div><div style={{fontSize:22,fontWeight:"bold",color:"#10b981"}}>{classGPA}</div></div>
            </div>
            {codingScore&&<div style={{background:"#fef3c7",borderRadius:8,padding:10,marginBottom:10,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:13,fontWeight:"bold",color:"#92400e"}}>Coding Score</span>
              <div style={{display:"flex",alignItems:"center",gap:6}}><Stars value={codingScore.score} readonly/><span style={{fontSize:12,color:"#92400e"}}>{CODING_REMARKS[codingScore.score]}</span></div>
            </div>}
            {isFull&&<><div style={{marginBottom:8}}><p style={{fontSize:12,color:"#64748b",margin:"0 0 3px",fontWeight:"bold"}}>Form Teacher ({formTeacher?.name||"—"}):</p><p style={{fontSize:13,color:"#374151",margin:0,fontStyle:"italic"}}>"{comment.form}"</p></div>
            <div><p style={{fontSize:12,color:"#64748b",margin:"0 0 3px",fontWeight:"bold"}}>Head Teacher:</p><p style={{fontSize:13,color:"#374151",margin:0,fontStyle:"italic"}}>"{comment.head}"</p></div></>}
          </div>
          <div>
            <h5 style={{margin:"0 0 6px",fontSize:12,color:"#64748b",textTransform:"uppercase"}}>Grading Key</h5>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
              <thead><tr style={{background:"#f8fafc"}}>{["Grade","Range","Pts","Remark"].map(h=><th key={h} style={{padding:"3px 6px",textAlign:"left",color:"#64748b"}}>{h}</th>)}</tr></thead>
              <tbody>{gradeKey.map(g=><tr key={g.g} style={{borderTop:"1px solid #f1f5f9"}}><td style={{padding:"2px 6px",fontWeight:"bold",color:gradeColor(g.g)}}>{g.g}</td><td style={{padding:"2px 6px"}}>{g.r}</td><td style={{padding:"2px 6px"}}>{g.p}</td><td style={{padding:"2px 6px",color:"#64748b"}}>{g.d}</td></tr>)}</tbody>
            </table>
          </div>
        </div>
        {isFull&&isTerm3&&promotionStatus&&<div style={{padding:"0 26px 14px"}}><PromotionStamp status={promotionStatus}/></div>}
        <div style={{background:"#0f1923",padding:"10px 26px",textAlign:"center"}}><span style={{color:"#566a7f",fontSize:11}}>{SCHOOL_NAME} · Official Academic Record · {term?.session}</span></div>
      </div>
    </div>
  );
}

function AttendancePage({data,toast,reload}){
  const {students,terms,attendance}=data;
  const [selectedTerm,setSelectedTerm]=useState(terms.find(t=>t.active)?.id||"");
  const [selectedClass,setSelectedClass]=useState(""); const [totalDays,setTotalDays]=useState(90);
  const [localAtt,setLocalAtt]=useState({}); const [saving,setSaving]=useState(false);
  const classStudents=students.filter(s=>s.class===selectedClass);
  useEffect(()=>{
    if(selectedClass&&selectedTerm){const init={};classStudents.forEach(s=>{const a=attendance.find(r=>r.term_id===selectedTerm&&r.student_id===s.id)||{};init[s.id]={present:a.present??"",total:totalDays};});setLocalAtt(init);}
  },[selectedClass,selectedTerm,attendance]);
  const handleSave=async()=>{
    setSaving(true);
    try{for(const [sid,a] of Object.entries(localAtt)) await db.upsert("attendance",{term_id:selectedTerm,student_id:sid,present:Number(a.present)||0,total:totalDays});await reload();toast("Saved!");}
    catch(e){toast("Error: "+e.message,"error");}
    setSaving(false);
  };
  return(
    <div>
      <Card style={{marginBottom:14,display:"flex",gap:14,alignItems:"flex-end"}}>
        <div style={{flex:1}}><label style={labelStyle}>Term</label><select value={selectedTerm} onChange={e=>setSelectedTerm(e.target.value)} style={{...selectStyle,width:"100%",marginTop:4}}>{terms.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}</select></div>
        <div style={{flex:1}}><label style={labelStyle}>Class</label><select value={selectedClass} onChange={e=>setSelectedClass(e.target.value)} style={{...selectStyle,width:"100%",marginTop:4}}><option value="">Select...</option>{ALL_CLASSES.map(c=><option key={c}>{c}</option>)}</select></div>
        <div><label style={labelStyle}>Total Days</label><input type="number" value={totalDays} onChange={e=>setTotalDays(Number(e.target.value))} style={{...selectStyle,width:90,marginTop:4}}/></div>
        <GoldButton onClick={handleSave} disabled={saving||!selectedClass}>{saving?"Saving...":"Save"}</GoldButton>
      </Card>
      {selectedClass&&<Card style={{padding:0,overflow:"hidden"}}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead><tr style={{background:"#f8fafc"}}>{["Student","ID","Total","Present","Absent","Attendance %"].map(h=><th key={h} style={thStyle}>{h}</th>)}</tr></thead>
          <tbody>{classStudents.map((s,i)=>{
            const a=localAtt[s.id]||{present:"",total:totalDays};
            const absent=totalDays-(Number(a.present)||0);
            const pct=a.present!==""?((Number(a.present)/totalDays)*100).toFixed(0):"—";
            return(<tr key={s.id} style={{borderTop:"1px solid #f1f5f9",background:i%2?"#fafafa":"white"}}>
              <td style={tdStyle}>{s.name}</td><td style={{...tdStyle,fontFamily:"monospace",fontSize:12}}>{s.id}</td>
              <td style={tdStyle}>{totalDays}</td>
              <td style={tdStyle}><input type="number" min={0} max={totalDays} value={a.present} onChange={e=>setLocalAtt(prev=>({...prev,[s.id]:{present:e.target.value,total:totalDays}}))} style={{width:56,padding:"4px 6px",border:"1px solid #e2e8f0",borderRadius:6,textAlign:"center"}}/></td>
              <td style={tdStyle}>{a.present!==""?absent:"—"}</td>
              <td style={tdStyle}>{pct!=="—"&&<div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:60,height:6,borderRadius:3,background:"#f1f5f9"}}><div style={{width:pct+"%",height:"100%",borderRadius:3,background:Number(pct)>=75?"#10b981":"#f59e0b"}}/></div><span style={{fontSize:12,color:Number(pct)>=75?"#10b981":"#f59e0b"}}>{pct}%</span></div>}</td>
            </tr>);
          })}</tbody>
        </table>
      </Card>}
    </div>
  );
}

function ELearningPage({user,data,toast,isAdmin,reload}){
  const {assignments,staff,terms,activeTerm}=data;
  const [showAdd,setShowAdd]=useState(false); const [filter,setFilter]=useState("All");
  const [form,setForm]=useState({title:"",description:"",class:"JSS1",subject:"",drive_link:"",type:"assignment"});
  const [saving,setSaving]=useState(false);
  const myAssignments=isAdmin?assignments:assignments.filter(a=>a.teacher_id===user.id);
  const filtered=filter==="All"?myAssignments:myAssignments.filter(a=>a.class===filter);
  const activeTerm2=terms.find(t=>t.active)||terms[terms.length-1];
  const handleSave=async()=>{
    if(!form.title||!form.subject) return toast("Title and subject required.","error");
    setSaving(true);
    try{await db.insert("assignments",{...form,teacher_id:user.id,term_id:activeTerm2?.id||""});await reload();toast("Posted!");setShowAdd(false);setForm({title:"",description:"",class:"JSS1",subject:"",drive_link:"",type:"assignment"});}
    catch(e){toast("Error: "+e.message,"error");}
    setSaving(false);
  };
  const handleDelete=async(id)=>{if(!window.confirm("Delete?")) return;try{await db.delete("assignments","id=eq."+id);await reload();toast("Deleted.");}catch(e){toast("Error.","error");}};
  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <select value={filter} onChange={e=>setFilter(e.target.value)} style={selectStyle}><option value="All">All Classes</option>{ALL_CLASSES.map(c=><option key={c}>{c}</option>)}</select>
        <GoldButton onClick={()=>setShowAdd(!showAdd)}>+ Post Assignment</GoldButton>
      </div>
      {showAdd&&<Card style={{marginBottom:12}}>
        <h4 style={{margin:"0 0 12px"}}>New Post</h4>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <Input label="Title" value={form.title} onChange={v=>setForm({...form,title:v})}/>
          <div><label style={labelStyle}>Type</label><select value={form.type} onChange={e=>setForm({...form,type:e.target.value})} style={{...selectStyle,width:"100%",marginTop:4}}><option value="assignment">Assignment</option><option value="material">Material</option><option value="note">Note</option></select></div>
          <div><label style={labelStyle}>Class</label><select value={form.class} onChange={e=>setForm({...form,class:e.target.value,subject:""})} style={{...selectStyle,width:"100%",marginTop:4}}>{ALL_CLASSES.map(c=><option key={c}>{c}</option>)}</select></div>
          <div><label style={labelStyle}>Subject</label><select value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})} style={{...selectStyle,width:"100%",marginTop:4}}><option value="">Select...</option>{(CLASS_SUBJECTS[form.class]||[]).map(s=><option key={s}>{s}</option>)}</select></div>
          <div style={{gridColumn:"span 2"}}><Input label="Google Drive Link (optional)" value={form.drive_link} onChange={v=>setForm({...form,drive_link:v})} placeholder="https://drive.google.com/..."/></div>
          <div style={{gridColumn:"span 2"}}><Textarea label="Description / Instructions" value={form.description} onChange={v=>setForm({...form,description:v})} placeholder="Assignment details..." rows={3}/></div>
        </div>
        <div style={{display:"flex",gap:10,marginTop:10}}>
          <GoldButton onClick={handleSave} disabled={saving}>{saving?"Posting...":"Post"}</GoldButton>
          <button onClick={()=>setShowAdd(false)} style={{padding:"10px 18px",borderRadius:8,border:"1px solid #e2e8f0",background:"white",cursor:"pointer"}}>Cancel</button>
        </div>
      </Card>}
      <div style={{display:"grid",gap:10}}>
        {filtered.map(a=>{const teacher=staff.find(s=>s.id===a.teacher_id);return(<Card key={a.id}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                <span style={{background:a.type==="assignment"?"#dbeafe":a.type==="material"?"#dcfce7":"#fef3c7",color:a.type==="assignment"?"#1d4ed8":a.type==="material"?"#166534":"#92400e",padding:"2px 8px",borderRadius:20,fontSize:12,fontWeight:"bold"}}>{a.type}</span>
                <ClassBadge cls={a.class}/><span style={{fontSize:12,color:"#64748b"}}>{a.subject}</span>
              </div>
              <h4 style={{margin:"0 0 4px"}}>{a.title}</h4>
              {a.description&&<p style={{margin:"0 0 6px",fontSize:13,color:"#374151"}}>{a.description}</p>}
              {a.drive_link&&<a href={a.drive_link} target="_blank" rel="noreferrer" style={{fontSize:13,color:"#3b82f6",textDecoration:"none"}}>📎 Open in Google Drive</a>}
              <div style={{fontSize:12,color:"#94a3b8",marginTop:6}}>By {teacher?.name||"Teacher"} · {new Date(a.created_at).toLocaleDateString()}</div>
            </div>
            <IconBtn onClick={()=>handleDelete(a.id)} danger>🗑️</IconBtn>
          </div>
        </Card>);})}
        {!filtered.length&&<Card style={{textAlign:"center",padding:40,border:"1px dashed #e2e8f0"}}><div style={{fontSize:32,marginBottom:8}}>📚</div><p style={{color:"#94a3b8"}}>No posts yet.</p></Card>}
      </div>
    </div>
  );
}

function PerformancePage({user,data,isAdmin}){
  const {students,scores,terms}=data;
  const [selectedTerm,setSelectedTerm]=useState(data.terms.find(t=>t.active)?.id||"");
  const [selectedClass,setSelectedClass]=useState("");
  const allowedClasses=isAdmin?ALL_CLASSES:(user.classes||[]);
  const classStudents=students.filter(s=>s.class===selectedClass);
  return(
    <div>
      <Card style={{marginBottom:14,display:"flex",gap:14}}>
        <div style={{flex:1}}><label style={labelStyle}>Term</label><select value={selectedTerm} onChange={e=>setSelectedTerm(e.target.value)} style={{...selectStyle,width:"100%",marginTop:4}}>{terms.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}</select></div>
        <div style={{flex:1}}><label style={labelStyle}>Class</label><select value={selectedClass} onChange={e=>setSelectedClass(e.target.value)} style={{...selectStyle,width:"100%",marginTop:4}}><option value="">Select...</option>{allowedClasses.map(c=><option key={c}>{c}</option>)}</select></div>
      </Card>
      {selectedClass&&<Card style={{padding:0,overflow:"hidden"}}>
        <div style={{padding:"12px 14px",borderBottom:"1px solid #e2e8f0"}}><h4 style={{margin:0}}>Performance — {selectedClass}</h4></div>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead><tr style={{background:"#f8fafc"}}>{["#","Student","GPA","Subjects","Performance Bar"].map(h=><th key={h} style={thStyle}>{h}</th>)}</tr></thead>
          <tbody>{classStudents.sort((a,b)=>Number(calcGPA(scores.filter(r=>r.term_id===selectedTerm&&r.student_id===b.id)))-Number(calcGPA(scores.filter(r=>r.term_id===selectedTerm&&r.student_id===a.id)))).map((s,i)=>{
            const ss=scores.filter(r=>r.term_id===selectedTerm&&r.student_id===s.id);
            const gpa=calcGPA(ss);const gpaNum=Number(gpa);const bar=Math.min((gpaNum/5)*100,100);
            return(<tr key={s.id} style={{borderTop:"1px solid #f1f5f9",background:i%2?"#fafafa":"white"}}>
              <td style={{...tdStyle,color:"#94a3b8",fontWeight:"bold"}}>{i+1}</td>
              <td style={{...tdStyle,fontWeight:"500"}}>{s.name}</td>
              <td style={{...tdStyle,fontWeight:"bold",color:"#6366f1"}}>{ss.length?gpa:"—"}</td>
              <td style={tdStyle}>{ss.length}</td>
              <td style={tdStyle}><div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:100,height:8,borderRadius:4,background:"#f1f5f9"}}><div style={{width:bar+"%",height:"100%",borderRadius:4,background:gpaNum>=4?"#10b981":gpaNum>=3?"#3b82f6":gpaNum>=2?"#f59e0b":"#ef4444"}}/></div><span style={{fontSize:12,color:"#64748b"}}>{bar.toFixed(0)}%</span></div></td>
            </tr>);
          })}</tbody>
        </table>
      </Card>}
    </div>
  );
}

function StaffPage({data,toast,reload}){
  const {staff}=data;
  const [showAdd,setShowAdd]=useState(false);
  const [form,setForm]=useState({name:"",role:"teacher",username:"",password:"",classes:[],subjects:[]});
  const [saving,setSaving]=useState(false);
  const handleSave=async()=>{
    if(!form.name||!form.username) return toast("Name and username required.","error");
    setSaving(true);
    try{await db.insert("staff",{...form,id:"T"+Date.now()});await reload();toast("Added!");setShowAdd(false);setForm({name:"",role:"teacher",username:"",password:"",classes:[],subjects:[]});}
    catch(e){toast("Error: "+e.message,"error");}
    setSaving(false);
  };
  const handleDelete=async(id)=>{if(!window.confirm("Remove?")) return;try{await db.delete("staff","id=eq."+id);await reload();toast("Removed.");}catch(e){toast("Error.","error");}};
  return(
    <div>
      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:12}}><GoldButton onClick={()=>setShowAdd(!showAdd)}>+ Add Staff</GoldButton></div>
      {showAdd&&<Card style={{marginBottom:12}}>
        <h4 style={{margin:"0 0 12px"}}>Add Staff</h4>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Input label="Full Name" value={form.name} onChange={v=>setForm({...form,name:v})}/>
          <Input label="Username" value={form.username} onChange={v=>setForm({...form,username:v})}/>
          <Input label="Password" value={form.password} onChange={v=>setForm({...form,password:v})} type="password"/>
          <div><label style={labelStyle}>Role</label><select value={form.role} onChange={e=>setForm({...form,role:e.target.value})} style={{...selectStyle,width:"100%",marginTop:4}}><option value="teacher">Teacher</option><option value="admin">Admin</option></select></div>
        </div>
        <div style={{display:"flex",gap:10,marginTop:10}}>
          <GoldButton onClick={handleSave} disabled={saving}>{saving?"Saving...":"Save"}</GoldButton>
          <button onClick={()=>setShowAdd(false)} style={{padding:"10px 18px",borderRadius:8,border:"1px solid #e2e8f0",background:"white",cursor:"pointer"}}>Cancel</button>
        </div>
      </Card>}
      <Card style={{padding:0,overflow:"hidden"}}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead><tr style={{background:"#f8fafc"}}>{["Name","Username","Role","Actions"].map(h=><th key={h} style={thStyle}>{h}</th>)}</tr></thead>
          <tbody>{staff.map((s,i)=>(<tr key={s.id} style={{borderTop:"1px solid #f1f5f9",background:i%2?"#fafafa":"white"}}>
            <td style={{...tdStyle,fontWeight:"500"}}>{s.name}</td>
            <td style={{...tdStyle,fontFamily:"monospace",fontSize:12}}>{s.username}</td>
            <td style={tdStyle}><span style={{background:s.role==="admin"?"#fef3c7":"#e0f2fe",color:s.role==="admin"?"#92400e":"#0369a1",padding:"2px 8px",borderRadius:20,fontSize:12}}>{s.role}</span></td>
            <td style={tdStyle}><IconBtn onClick={()=>handleDelete(s.id)} danger>🗑️</IconBtn></td>
          </tr>))}</tbody>
        </table>
      </Card>
    </div>
  );
}

function RatingsPage({data}){
  const {ratings,staff,students,terms}=data;
  const teachers=staff.filter(s=>s.role==="teacher");
  return(
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:14}}>
        {teachers.map(t=>{
          const tr=ratings.filter(r=>r.teacher_id===t.id);
          const avg=tr.length?(tr.reduce((s,r)=>s+r.rating,0)/tr.length).toFixed(1):null;
          return(<Card key={t.id}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
              <div><h4 style={{margin:"0 0 2px"}}>{t.name}</h4><span style={{fontSize:12,color:"#64748b"}}>{t.username}</span></div>
              {avg&&<div style={{textAlign:"center"}}><div style={{fontSize:22,fontWeight:"bold",color:"#f59e0b"}}>{avg}</div><Stars value={Math.round(Number(avg))} readonly/></div>}
            </div>
            <div style={{fontSize:13,color:"#64748b",marginBottom:8}}>{tr.length} rating{tr.length!==1?"s":""}</div>
            {tr.slice(0,3).map(r=>{const st=students.find(s=>s.id===r.student_id);const tm=terms.find(t=>t.id===r.term_id);return(<div key={r.id} style={{background:"#f8fafc",borderRadius:8,padding:10,marginBottom:6}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}><span style={{fontSize:12,fontWeight:"500"}}>{st?.name||r.student_id}</span><Stars value={r.rating} readonly/></div>
              {r.comment&&<p style={{fontSize:12,color:"#64748b",margin:0}}>{r.comment}</p>}
              <div style={{fontSize:11,color:"#94a3b8",marginTop:3}}>{tm?.label}</div>
            </div>);})}
          </Card>);
        })}
      </div>
    </div>
  );
}

function TermsPage({data,toast,reload}){
  const {terms}=data;
  const [showAdd,setShowAdd]=useState(false); const [form,setForm]=useState({session:"",term:"1"}); const [saving,setSaving]=useState(false);
  const handleAdd=async()=>{
    if(!form.session) return toast("Session required.","error");
    const id="T"+form.term+"-"+form.session.replace("/","-");
    setSaving(true);
    try{await db.insert("terms",{id,label:"Term "+form.term+" - "+form.session,session:form.session,term:Number(form.term),active:false});await reload();toast("Added!");setShowAdd(false);}
    catch(e){toast("Error: "+e.message,"error");}
    setSaving(false);
  };
  const setActive=async(id)=>{
    try{await db.update("terms","active=eq.true",{active:false});await db.update("terms","id=eq."+id,{active:true});await reload();toast("Active term updated!");}
    catch(e){toast("Error: "+e.message,"error");}
  };
  return(
    <div>
      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:12}}><GoldButton onClick={()=>setShowAdd(!showAdd)}>+ Add Term</GoldButton></div>
      {showAdd&&<Card style={{marginBottom:12}}>
        <h4 style={{margin:"0 0 12px"}}>New Term</h4>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Input label="Session (e.g. 2025/2026)" value={form.session} onChange={v=>setForm({...form,session:v})} placeholder="2025/2026"/>
          <div><label style={labelStyle}>Term</label><select value={form.term} onChange={e=>setForm({...form,term:e.target.value})} style={{...selectStyle,width:"100%",marginTop:4}}><option value="1">Term 1</option><option value="2">Term 2</option><option value="3">Term 3</option></select></div>
        </div>
        <div style={{display:"flex",gap:10,marginTop:10}}>
          <GoldButton onClick={handleAdd} disabled={saving}>{saving?"Adding...":"Add"}</GoldButton>
          <button onClick={()=>setShowAdd(false)} style={{padding:"10px 18px",borderRadius:8,border:"1px solid #e2e8f0",background:"white",cursor:"pointer"}}>Cancel</button>
        </div>
      </Card>}
      <div style={{display:"grid",gap:10}}>
        {terms.map(t=>(<div key={t.id} style={{background:"white",borderRadius:12,padding:16,border:"2px solid "+(t.active?"#c9a84c":"#e2e8f0"),display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div><div style={{fontWeight:"bold",color:"#1e293b"}}>{t.label}</div><div style={{color:"#64748b",fontSize:13}}>Session: {t.session} · Term {t.term}</div></div>
          {t.active?<span style={{background:"#d1fae5",color:"#065f46",padding:"5px 14px",borderRadius:20,fontSize:13,fontWeight:"bold"}}>✓ Active</span>
            :<button onClick={()=>setActive(t.id)} style={{padding:"7px 14px",borderRadius:8,border:"1px solid #c9a84c",background:"transparent",cursor:"pointer",color:"#92400e",fontSize:13}}>Set Active</button>}
        </div>))}
      </div>
    </div>
  );
}

function ParentPortal({user,data,onLogout,notify}){
  const {students,scores,terms,attendance}=data;
  const student=students.find(s=>s.id===user.studentId);
  const [selectedTerm,setSelectedTerm]=useState(terms.find(t=>t.active)?.id||terms[0]?.id||"");
  if(!student) return <div style={{padding:40,textAlign:"center"}}>Student not found.</div>;
  const termScores=scores.filter(s=>s.term_id===selectedTerm&&s.student_id===student.id);
  const gpa=calcGPA(termScores); const comment=getComment(Number(gpa));
  const att=attendance.find(a=>a.term_id===selectedTerm&&a.student_id===student.id)||{};
  return(
    <div style={{minHeight:"100vh",background:"#f0f4f8",fontFamily:"Trebuchet MS,sans-serif"}}>
      <div style={{background:"linear-gradient(135deg,#0f1923,#1a2d40)",padding:"0 20px",height:54,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:20}}>🎓</span><span style={{color:"#e8c96e",fontWeight:"bold"}}>{SCHOOL_SHORT} Parent Portal</span></div>
        <button onClick={onLogout} style={{background:"rgba(255,255,255,0.1)",border:"none",color:"#8a9bb0",padding:"6px 12px",borderRadius:8,cursor:"pointer",fontSize:13}}>Logout</button>
      </div>
      <div style={{maxWidth:900,margin:"0 auto",padding:18}}>
        <Card style={{marginBottom:14,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:50,height:50,borderRadius:"50%",background:"linear-gradient(135deg,#6366f1,#8b5cf6)",display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontSize:18,fontWeight:"bold"}}>{student.name[0]}</div>
            <div><h3 style={{margin:0,color:"#1e293b"}}>{student.name}</h3><p style={{margin:0,color:"#64748b",fontSize:13}}>{student.id} · {student.class}</p></div>
          </div>
          <div><label style={labelStyle}>Term</label><select value={selectedTerm} onChange={e=>setSelectedTerm(e.target.value)} style={{...selectStyle,marginLeft:8}}>{terms.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}</select></div>
        </Card>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:14}}>
          <StatCard label="Term GPA" value={termScores.length?gpa:"—"} icon="📊" color="#6366f1"/>
          <StatCard label="Subjects" value={termScores.length} icon="📚" color="#3b82f6"/>
          <StatCard label="Days Present" value={att.present??"—"} icon="✅" color="#10b981"/>
          <StatCard label="Days Absent" value={att.present!=null&&att.total?att.total-att.present:"—"} icon="📅" color="#f59e0b"/>
        </div>
        {termScores.length>0?(<>
          <Card style={{padding:0,overflow:"hidden",marginBottom:12}}>
            <div style={{padding:"10px 14px",borderBottom:"1px solid #e2e8f0"}}><h4 style={{margin:0}}>Academic Results</h4></div>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead><tr style={{background:"#f8fafc"}}>{["Subject","CAT 1","CAT 2","Exam","BA","Total","Grade","Remark"].map(h=><th key={h} style={thStyle}>{h}</th>)}</tr></thead>
              <tbody>{termScores.map((s,i)=>(<tr key={s.subject} style={{borderTop:"1px solid #f1f5f9",background:i%2?"#fafafa":"white"}}>
                <td style={{...tdStyle,fontSize:13}}>{s.subject}</td>
                <td style={{...tdStyle,textAlign:"center"}}>{s.cat1||0}</td><td style={{...tdStyle,textAlign:"center"}}>{s.cat2||0}</td>
                <td style={{...tdStyle,textAlign:"center"}}>{s.exam||0}</td><td style={{...tdStyle,textAlign:"center"}}>{s.ba||0}</td>
                <td style={{...tdStyle,fontWeight:"bold",textAlign:"center",color:gradeColor(s.grade)}}>{s.total}</td>
                <td style={{...tdStyle,textAlign:"center"}}><GradeBadge grade={s.grade}/></td>
                <td style={{...tdStyle,fontSize:12,color:"#64748b"}}>{s.remark}</td>
              </tr>))}</tbody>
            </table>
          </Card>
          <Card><h4 style={{margin:"0 0 10px"}}>Teacher Comments</h4>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div style={{background:"#f8fafc",borderRadius:8,padding:12}}><p style={{fontSize:12,color:"#64748b",margin:"0 0 4px",fontWeight:"bold"}}>Form Teacher</p><p style={{fontSize:13,color:"#374151",margin:0,fontStyle:"italic"}}>"{comment.form}"</p></div>
              <div style={{background:"#f8fafc",borderRadius:8,padding:12}}><p style={{fontSize:12,color:"#64748b",margin:"0 0 4px",fontWeight:"bold"}}>Head Teacher</p><p style={{fontSize:13,color:"#374151",margin:0,fontStyle:"italic"}}>"{comment.head}"</p></div>
            </div>
          </Card>
        </>):<Card style={{textAlign:"center",padding:40,border:"1px dashed #e2e8f0"}}><div style={{fontSize:32,marginBottom:8}}>📭</div><p style={{color:"#94a3b8"}}>No results yet for this term.</p></Card>}
      </div>
      {notify&&<div style={{position:"fixed",bottom:24,right:24,background:"#065f46",color:"white",padding:"12px 20px",borderRadius:10,fontSize:14,zIndex:9999}}>{notify.msg}</div>}
    </div>
  );
}

function StudentPortal({user,data,activeTerm,onLogout,toast,notify,reload}){
  const {students,scores,terms,attendance,assignments,staff,ratings,codingScores}=data;
  const [page,setPage]=useState("dashboard");
  const [selectedTerm,setSelectedTerm]=useState(activeTerm?.id||"");
  const student=students.find(s=>s.id===user.studentId);
  if(!student) return <div style={{padding:40,textAlign:"center"}}>Student not found.</div>;
  const termScores=scores.filter(s=>s.term_id===selectedTerm&&s.student_id===student.id);
  const gpa=calcGPA(termScores);
  const att=attendance.find(a=>a.term_id===selectedTerm&&a.student_id===student.id)||{};
  const myAssignments=assignments.filter(a=>a.class===student.class);
  const codingScore=codingScores.find(c=>c.term_id===selectedTerm&&c.student_id===student.id);
  const navItems=[{id:"dashboard",label:"Dashboard",icon:"🏠"},{id:"eclassroom",label:"E-Classroom",icon:"📚"},{id:"subjects",label:"My Subjects",icon:"📖"},{id:"grading",label:"My Results",icon:"📊"},{id:"rate",label:"Rate My Teacher",icon:"⭐"}];
  const renderPage=()=>{
    switch(page){
      case "dashboard": return(
        <div>
          <div style={{marginBottom:16}}><h3 style={{margin:0}}>Welcome, {student.name.split(" ")[0]}! 👋</h3><p style={{color:"#64748b",margin:"3px 0 0",fontSize:14}}>{student.class} · {activeTerm?.label}</p></div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:12,marginBottom:16}}>
            <StatCard label="Term GPA" value={termScores.length?gpa:"—"} icon="📊" color="#6366f1"/>
            <StatCard label="Subjects" value={termScores.length} icon="📖" color="#3b82f6"/>
            <StatCard label="Days Present" value={att.present??"—"} icon="✅" color="#10b981"/>
            <StatCard label="Assignments" value={myAssignments.length} icon="📚" color="#f59e0b"/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <Card><h4 style={{margin:"0 0 10px"}}>Recent Assignments</h4>
              {myAssignments.slice(0,4).map(a=>(<div key={a.id} style={{padding:"7px 0",borderBottom:"1px solid #f1f5f9"}}><div style={{fontSize:13,fontWeight:"500"}}>{a.title}</div><div style={{fontSize:12,color:"#64748b"}}>{a.subject} · {a.type}</div></div>))}
              {!myAssignments.length&&<p style={{color:"#94a3b8",fontSize:13}}>No assignments yet.</p>}
            </Card>
            <Card><h4 style={{margin:"0 0 10px"}}>My Performance</h4>
              {termScores.slice(0,5).map(s=>(<div key={s.subject} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid #f1f5f9"}}>
                <span style={{fontSize:13}}>{s.subject}</span>
                <div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:13,fontWeight:"bold",color:gradeColor(s.grade)}}>{s.total}</span><GradeBadge grade={s.grade} small/></div>
              </div>))}
              {!termScores.length&&<p style={{color:"#94a3b8",fontSize:13}}>No results yet.</p>}
            </Card>
          </div>
        </div>
      );
      case "eclassroom": return(
        <div>
          <h3 style={{margin:"0 0 14px"}}>E-Classroom</h3>
          <div style={{display:"grid",gap:10}}>
            {myAssignments.map(a=>{const teacher=staff.find(s=>s.id===a.teacher_id);return(<Card key={a.id}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                <span style={{background:a.type==="assignment"?"#dbeafe":a.type==="material"?"#dcfce7":"#fef3c7",color:a.type==="assignment"?"#1d4ed8":a.type==="material"?"#166534":"#92400e",padding:"2px 8px",borderRadius:20,fontSize:12,fontWeight:"bold"}}>{a.type}</span>
                <span style={{fontSize:12,color:"#64748b"}}>{a.subject}</span><span style={{fontSize:12,color:"#94a3b8"}}>· {new Date(a.created_at).toLocaleDateString()}</span>
              </div>
              <h4 style={{margin:"0 0 4px"}}>{a.title}</h4>
              {a.description&&<p style={{fontSize:13,color:"#374151",margin:"0 0 6px"}}>{a.description}</p>}
              {a.drive_link&&<a href={a.drive_link} target="_blank" rel="noreferrer" style={{fontSize:13,color:"#3b82f6",textDecoration:"none"}}>📎 Open in Google Drive</a>}
              <div style={{fontSize:12,color:"#94a3b8",marginTop:6}}>By {teacher?.name||"Teacher"}</div>
            </Card>);})}
            {!myAssignments.length&&<Card style={{textAlign:"center",padding:40,border:"1px dashed #e2e8f0"}}><div style={{fontSize:32,marginBottom:8}}>📭</div><p style={{color:"#94a3b8"}}>No assignments posted yet.</p></Card>}
          </div>
        </div>
      );
      case "subjects": return(
        <div>
          <h3 style={{margin:"0 0 14px"}}>My Subjects — {student.class}</h3>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:10}}>
            {(CLASS_SUBJECTS[student.class]||[]).map(sub=>{const sc=termScores.find(s=>s.subject===sub);return(<Card key={sub} style={{textAlign:"center"}}>
              <div style={{fontSize:13,fontWeight:"bold",color:"#1e293b",marginBottom:8}}>{sub}</div>
              {sc?<><div style={{fontSize:26,fontWeight:"bold",color:gradeColor(sc.grade)}}>{sc.total}</div><GradeBadge grade={sc.grade}/><div style={{fontSize:12,color:"#64748b",marginTop:4}}>{sc.remark}</div></>
              :<div style={{fontSize:13,color:"#94a3b8"}}>No score yet</div>}
            </Card>);})}
          </div>
        </div>
      );
      case "grading": return(
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <h3 style={{margin:0}}>My Results</h3>
            <select value={selectedTerm} onChange={e=>setSelectedTerm(e.target.value)} style={selectStyle}>{terms.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}</select>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:14}}>
            <StatCard label="GPA" value={termScores.length?gpa:"—"} icon="📊" color="#6366f1"/>
            <StatCard label="Days Present" value={att.present??"—"} icon="✅" color="#10b981"/>
            {codingScore&&<StatCard label="Coding Score" value={codingScore.score+"/5"} icon="💻" color="#f59e0b"/>}
          </div>
          {termScores.length>0?<Card style={{padding:0,overflow:"hidden"}}>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead><tr style={{background:"#f8fafc"}}>{["Subject","CAT 1","CAT 2","Exam","BA","Total","Grade","Remark"].map(h=><th key={h} style={thStyle}>{h}</th>)}</tr></thead>
              <tbody>{termScores.map((s,i)=>(<tr key={s.subject} style={{borderTop:"1px solid #f1f5f9",background:i%2?"#fafafa":"white"}}>
                <td style={{...tdStyle,fontSize:13}}>{s.subject}</td>
                <td style={{...tdStyle,textAlign:"center"}}>{s.cat1||0}</td><td style={{...tdStyle,textAlign:"center"}}>{s.cat2||0}</td>
                <td style={{...tdStyle,textAlign:"center"}}>{s.exam||0}</td><td style={{...tdStyle,textAlign:"center"}}>{s.ba||0}</td>
                <td style={{...tdStyle,fontWeight:"bold",textAlign:"center",color:gradeColor(s.grade)}}>{s.total}</td>
                <td style={{...tdStyle,textAlign:"center"}}><GradeBadge grade={s.grade}/></td>
                <td style={{...tdStyle,fontSize:12,color:"#64748b"}}>{s.remark}</td>
              </tr>))}</tbody>
            </table>
          </Card>:<Card style={{textAlign:"center",padding:40,border:"1px dashed #e2e8f0"}}><p style={{color:"#94a3b8"}}>No results yet.</p></Card>}
        </div>
      );
      case "rate": return <RateTeacherPage student={student} data={data} toast={toast} reload={reload} selectedTerm={selectedTerm}/>;
      default: return null;
    }
  };
  return(
    <div style={{minHeight:"100vh",background:"#f0f4f8",fontFamily:"Trebuchet MS,sans-serif"}}>
      <div style={{background:"linear-gradient(135deg,#0f1923,#1a2d40)",padding:"0 18px",height:54,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:20}}>🎓</span><span style={{color:"#e8c96e",fontWeight:"bold",fontSize:14}}>{SCHOOL_SHORT} Student Portal</span></div>
        <button onClick={onLogout} style={{background:"rgba(255,255,255,0.1)",border:"none",color:"#8a9bb0",padding:"6px 12px",borderRadius:8,cursor:"pointer",fontSize:13}}>Logout</button>
      </div>
      <div style={{display:"flex",borderBottom:"1px solid #e2e8f0",background:"white",overflowX:"auto"}}>
        {navItems.map(item=>(<button key={item.id} onClick={()=>setPage(item.id)} style={{padding:"11px 18px",border:"none",background:"transparent",cursor:"pointer",color:page===item.id?"#6366f1":"#64748b",borderBottom:page===item.id?"2px solid #6366f1":"2px solid transparent",fontWeight:page===item.id?"bold":"normal",fontSize:13,whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:6}}><span>{item.icon}</span>{item.label}</button>))}
      </div>
      <div style={{maxWidth:1000,margin:"0 auto",padding:18}}>{renderPage()}</div>
      {notify&&<div style={{position:"fixed",bottom:24,right:24,background:"#065f46",color:"white",padding:"12px 20px",borderRadius:10,fontSize:14,zIndex:9999}}>{notify.msg}</div>}
    </div>
  );
}


// ─── SUBJECT ASSIGNMENT PAGE ──────────────────────────────────────────────────
function SubjectAssignmentPage({data,toast,reload}){
  const {staff}=data;
  const teachers=staff.filter(s=>s.role==="teacher");
  const [selectedClass,setSelectedClass]=useState("JSS1");
  const [assignments,setAssignments]=useState({});
  const [subjectNames,setSubjectNames]=useState({});
  const [saving,setSaving]=useState(false);
  const [editingSubject,setEditingSubject]=useState(null);
  const [editValue,setEditValue]=useState("");
  const [showAddSubject,setShowAddSubject]=useState(false);
  const [newSubject,setNewSubject]=useState("");

  // Local editable subject list per class (stored in localStorage so it persists)
  const storageKey="shhs_custom_subjects_"+selectedClass;
  const getSubjects=()=>{
    try{const s=localStorage.getItem(storageKey);return s?JSON.parse(s):(CLASS_SUBJECTS[selectedClass]||[]);}
    catch{return CLASS_SUBJECTS[selectedClass]||[];}
  };
  const saveSubjects=(list)=>{
    try{localStorage.setItem(storageKey,JSON.stringify(list));}catch{}
  };
  const [localSubjects,setLocalSubjects]=useState(getSubjects);

  useEffect(()=>{
    const subs=getSubjects();
    setLocalSubjects(subs);
    const init={};
    subs.forEach(sub=>{
      const teacher=teachers.find(t=>t.subjects?.includes(sub));
      init[sub]=teacher?.id||"";
    });
    setAssignments(init);
  },[selectedClass,staff]);

  const handleAssignChange=(subject,teacherId)=>{
    setAssignments(prev=>({...prev,[subject]:teacherId}));
  };

  // Rename a subject
  const handleRenameStart=(sub)=>{setEditingSubject(sub);setEditValue(sub);};
  const handleRenameConfirm=()=>{
    if(!editValue.trim()||editValue===editingSubject){setEditingSubject(null);return;}
    const updated=localSubjects.map(s=>s===editingSubject?editValue.trim():s);
    setLocalSubjects(updated);saveSubjects(updated);
    // Update assignments map key
    setAssignments(prev=>{
      const next={...prev};
      next[editValue.trim()]=prev[editingSubject]||"";
      delete next[editingSubject];
      return next;
    });
    setEditingSubject(null);
    toast("Subject renamed!");
  };

  // Add a new subject
  const handleAddSubject=()=>{
    if(!newSubject.trim()) return toast("Enter a subject name.","error");
    if(localSubjects.includes(newSubject.trim())) return toast("Subject already exists.","error");
    const updated=[...localSubjects,newSubject.trim()];
    setLocalSubjects(updated);saveSubjects(updated);
    setAssignments(prev=>({...prev,[newSubject.trim()]:""}));
    setNewSubject("");setShowAddSubject(false);
    toast("Subject added!");
  };

  // Remove a subject
  const handleRemoveSubject=(sub)=>{
    if(!window.confirm("Remove subject: "+sub+"?")) return;
    const updated=localSubjects.filter(s=>s!==sub);
    setLocalSubjects(updated);saveSubjects(updated);
    setAssignments(prev=>{const next={...prev};delete next[sub];return next;});
    toast("Subject removed.");
  };

  const handleSave=async()=>{
    setSaving(true);
    try{
      const teacherSubjectMap={};
      teachers.forEach(t=>{teacherSubjectMap[t.id]=[...new Set(t.subjects||[])];});
      // Remove this class's subjects from all teachers
      localSubjects.forEach(sub=>{
        teachers.forEach(t=>{teacherSubjectMap[t.id]=teacherSubjectMap[t.id].filter(s=>s!==sub);});
      });
      // Assign new
      localSubjects.forEach(sub=>{
        const tid=assignments[sub];
        if(tid&&teacherSubjectMap[tid]&&!teacherSubjectMap[tid].includes(sub)) teacherSubjectMap[tid].push(sub);
      });
      // Update classes list too
      const teacherClassMap={};
      teachers.forEach(t=>{teacherClassMap[t.id]=[...new Set(t.classes||[])];});
      for(const t of teachers){
        await db.update("staff","id=eq."+t.id,{subjects:teacherSubjectMap[t.id],classes:teacherClassMap[t.id]});
      }
      await reload();
      toast("Assignments saved!");
    }catch(e){toast("Error: "+e.message,"error");}
    setSaving(false);
  };

  const getTeacherLoad=(teacherId)=>Object.values(assignments).filter(id=>id===teacherId).length;

  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
        <div>
          <h3 style={{margin:"0 0 4px",color:"#1e293b"}}>Subject & Teacher Assignment</h3>
          <p style={{margin:0,color:"#64748b",fontSize:13}}>Assign teachers, rename or add subjects per class. Changes reflect on report cards immediately.</p>
        </div>
        <GoldButton onClick={handleSave} disabled={saving}>{saving?"Saving...":"Save Assignments"}</GoldButton>
      </div>

      {/* Class tabs */}
      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
        {ALL_CLASSES.map(c=>(
          <button key={c} onClick={()=>setSelectedClass(c)} style={{padding:"8px 16px",borderRadius:20,cursor:"pointer",fontWeight:selectedClass===c?"bold":"normal",fontSize:13,background:selectedClass===c?"linear-gradient(135deg,#c9a84c,#e8c96e)":"white",color:selectedClass===c?"#1a2d40":"#64748b",border:selectedClass===c?"none":"1px solid #e2e8f0"}}>
            {c}
          </button>
        ))}
      </div>

      {/* Teacher summary cards */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:10,marginBottom:16}}>
        {teachers.map(t=>(
          <div key={t.id} style={{background:"white",borderRadius:10,padding:"10px 14px",border:"1px solid #e2e8f0",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div><div style={{fontSize:13,fontWeight:"600",color:"#1e293b"}}>{t.name}</div><div style={{fontSize:11,color:"#64748b"}}>{t.username}</div></div>
            <div style={{background:"#f0f9ff",color:"#0369a1",borderRadius:20,padding:"2px 10px",fontSize:12,fontWeight:"bold"}}>{getTeacherLoad(t.id)} here</div>
          </div>
        ))}
      </div>

      {/* Subject table */}
      <div style={{background:"white",borderRadius:12,border:"1px solid #e2e8f0",overflow:"hidden"}}>
        <div style={{padding:"12px 16px",background:"#f8fafc",borderBottom:"1px solid #e2e8f0",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <h4 style={{margin:0}}>{selectedClass} — {localSubjects.length} Subjects</h4>
          <button onClick={()=>setShowAddSubject(!showAddSubject)} style={{background:"#6366f1",color:"white",border:"none",padding:"7px 14px",borderRadius:8,cursor:"pointer",fontSize:13,fontWeight:"bold"}}>+ Add Subject</button>
        </div>

        {/* Add subject row */}
        {showAddSubject&&(
          <div style={{padding:"12px 16px",background:"#f0f4ff",borderBottom:"1px solid #e2e8f0",display:"flex",gap:10,alignItems:"center"}}>
            <input value={newSubject} onChange={e=>setNewSubject(e.target.value)} placeholder="New subject name..." onKeyDown={e=>e.key==="Enter"&&handleAddSubject()} style={{flex:1,padding:"8px 12px",border:"1px solid #6366f1",borderRadius:8,fontSize:14,outline:"none"}} autoFocus/>
            <button onClick={handleAddSubject} style={{background:"#6366f1",color:"white",border:"none",padding:"8px 16px",borderRadius:8,cursor:"pointer",fontSize:13}}>Add</button>
            <button onClick={()=>{setShowAddSubject(false);setNewSubject("");}} style={{background:"white",color:"#64748b",border:"1px solid #e2e8f0",padding:"8px 14px",borderRadius:8,cursor:"pointer",fontSize:13}}>Cancel</button>
          </div>
        )}

        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead>
            <tr style={{background:"#f8fafc"}}>
              <th style={{...thStyle,width:36}}>#</th>
              <th style={thStyle}>Subject Name</th>
              <th style={thStyle}>Assigned Teacher</th>
              <th style={thStyle}>Teacher Load</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {localSubjects.map((sub,i)=>{
              const assignedId=assignments[sub]||"";
              const load=assignedId?getTeacherLoad(assignedId):0;
              const isEditing=editingSubject===sub;
              return(
                <tr key={sub} style={{borderTop:"1px solid #f1f5f9",background:i%2?"#fafafa":"white"}}>
                  <td style={{...tdStyle,color:"#94a3b8",fontWeight:"bold",fontSize:12}}>{i+1}</td>
                  <td style={tdStyle}>
                    {isEditing?(
                      <div style={{display:"flex",gap:8,alignItems:"center"}}>
                        <input value={editValue} onChange={e=>setEditValue(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")handleRenameConfirm();if(e.key==="Escape")setEditingSubject(null);}}
                          style={{flex:1,padding:"6px 10px",border:"2px solid #c9a84c",borderRadius:8,fontSize:13,outline:"none"}} autoFocus/>
                        <button onClick={handleRenameConfirm} style={{background:"#10b981",color:"white",border:"none",padding:"5px 12px",borderRadius:6,cursor:"pointer",fontSize:12}}>✓ Save</button>
                        <button onClick={()=>setEditingSubject(null)} style={{background:"#f1f5f9",color:"#64748b",border:"none",padding:"5px 10px",borderRadius:6,cursor:"pointer",fontSize:12}}>✕</button>
                      </div>
                    ):(
                      <span style={{fontWeight:"500",color:"#1e293b"}}>{sub}</span>
                    )}
                  </td>
                  <td style={tdStyle}>
                    <select value={assignedId} onChange={e=>handleAssignChange(sub,e.target.value)}
                      style={{...selectStyle,width:"100%",maxWidth:260,border:assignedId?"1px solid #c9a84c":"1px solid #f87171",background:assignedId?"white":"#fff5f5"}}>
                      <option value="">— Unassigned —</option>
                      {teachers.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </td>
                  <td style={tdStyle}>
                    {assignedId?(
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <div style={{width:70,height:6,borderRadius:3,background:"#f1f5f9",overflow:"hidden"}}>
                          <div style={{width:Math.min((load/10)*100,100)+"%",height:"100%",borderRadius:3,background:load>8?"#ef4444":load>5?"#f59e0b":"#10b981"}}/>
                        </div>
                        <span style={{fontSize:12,color:"#64748b"}}>{load} in class</span>
                      </div>
                    ):<span style={{fontSize:12,color:"#f87171"}}>Unassigned</span>}
                  </td>
                  <td style={tdStyle}>
                    <div style={{display:"flex",gap:6}}>
                      <button onClick={()=>handleRenameStart(sub)} title="Rename subject" style={{background:"#f0f9ff",border:"none",padding:"5px 9px",borderRadius:6,cursor:"pointer",fontSize:13}}>✏️</button>
                      <button onClick={()=>handleRemoveSubject(sub)} title="Remove subject" style={{background:"#fee2e2",border:"none",padding:"5px 9px",borderRadius:6,cursor:"pointer",fontSize:13}}>🗑️</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Unassigned warning */}
      {localSubjects.filter(s=>!assignments[s]).length>0&&(
        <div style={{background:"#fff5f5",border:"1px solid #fecaca",borderRadius:10,padding:"12px 16px",marginTop:12}}>
          <span style={{fontSize:13,color:"#dc2626",fontWeight:"bold"}}>⚠️ {localSubjects.filter(s=>!assignments[s]).length} subject(s) unassigned: </span>
          <span style={{fontSize:13,color:"#dc2626"}}>{localSubjects.filter(s=>!assignments[s]).join(", ")}</span>
        </div>
      )}
    </div>
  );
}

function RateTeacherPage({student,data,toast,reload,selectedTerm}){
  const {staff,ratings}=data;
  const teachers=staff.filter(s=>s.role==="teacher");
  const [rv,setRv]=useState({}); const [rc,setRc]=useState({}); const [saving,setSaving]=useState(null);
  useEffect(()=>{
    const iv={};const ic={};
    teachers.forEach(t=>{const e=ratings.find(r=>r.teacher_id===t.id&&r.student_id===student.id&&r.term_id===selectedTerm);iv[t.id]=e?.rating||0;ic[t.id]=e?.comment||"";});
    setRv(iv);setRc(ic);
  },[selectedTerm,ratings]);
  const handleSave=async(tid)=>{
    if(!rv[tid]) return toast("Please select a rating.","error");
    setSaving(tid);
    try{await db.upsert("teacher_ratings",{teacher_id:tid,student_id:student.id,term_id:selectedTerm,rating:rv[tid],comment:rc[tid]||""});await reload();toast("Rating submitted!");}
    catch(e){toast("Error: "+e.message,"error");}
    setSaving(null);
  };
  return(
    <div>
      <h3 style={{margin:"0 0 14px"}}>Rate My Teachers</h3>
      <div style={{background:"#fef3c7",borderRadius:8,padding:"10px 14px",marginBottom:14,fontSize:13,color:"#92400e"}}>⚠️ Ratings are anonymous to teachers but visible to admin only.</div>
      <div style={{display:"grid",gap:12}}>
        {teachers.map(t=>(<Card key={t.id}>
          <div style={{marginBottom:10}}><h4 style={{margin:"0 0 2px"}}>{t.name}</h4><span style={{fontSize:12,color:"#64748b"}}>{t.subjects?.slice(0,2).join(", ")}</span></div>
          <div style={{marginBottom:10}}><label style={labelStyle}>Your Rating</label><div style={{marginTop:6}}><Stars value={rv[t.id]||0} onChange={v=>setRv(prev=>({...prev,[t.id]:v}))}/></div></div>
          <Textarea label="Comment (optional)" value={rc[t.id]||""} onChange={v=>setRc(prev=>({...prev,[t.id]:v}))} placeholder="Share your experience..." rows={2}/>
          <div style={{marginTop:10}}><Btn onClick={()=>handleSave(t.id)} disabled={saving===t.id} color="#6366f1">{saving===t.id?"Submitting...":"Submit Rating"}</Btn></div>
        </Card>))}
      </div>
    </div>
  );
}
