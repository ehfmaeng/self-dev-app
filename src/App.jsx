import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase";

/* ═══════════════════════════════════════════
   Global Styles
   ═══════════════════════════════════════════ */
const globalStyles = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif; background: #f8f8fa; }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-thumb { background: #ddd; border-radius: 3px; }
  input, select, textarea { font-family: inherit; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes slideIn { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
  .fade-in { animation: fadeIn 0.3s ease; }
  .slide-in { animation: slideIn 0.25s ease; }
  @media (max-width: 768px) {
    .desktop-only { display: none !important; }
    .main-content { padding: 16px !important; padding-top: 72px !important; }
  }
  @media (min-width: 769px) {
    .mobile-only { display: none !important; }
    .mobile-sidebar { display: none !important; }
  }
`;

/* ═══════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════ */
const TAB_GROUPS = [
  { group: "🌱 자기계발", tabs: [
    { id: "overview", label: "대시보드", icon: "📋" },
    { id: "certs", label: "자격증", icon: "📜" },
    { id: "skills", label: "스킬", icon: "⚡" },
    { id: "courses", label: "인강", icon: "📚" },
    { id: "notes", label: "필기노트", icon: "✏️" },
    { id: "reading", label: "독서/콘텐츠", icon: "📖" },
    { id: "portfolio", label: "포트폴리오", icon: "🗂️" },
    { id: "review", label: "주간회고", icon: "🔄" },
    { id: "events", label: "세미나", icon: "🎪" },
    { id: "habits", label: "습관", icon: "✅" },
  ]},
  { group: "💼 취준 관리", tabs: [
    { id: "job_overview", label: "취준 대시보드", icon: "📊" },
    { id: "experiences", label: "경험정리", icon: "⭐" },
    { id: "cover_letters", label: "자소서", icon: "📝" },
    { id: "job_postings", label: "공고 관리", icon: "📌" },
    { id: "resume", label: "이력서/경력", icon: "📄" },
    { id: "interviews", label: "면접 기록", icon: "🎤" },
  ]},
];

const TABS = TAB_GROUPS.flatMap(g => g.tabs);

const STATUS_COLORS = {
  "취득완료": { bg: "#dff5e3", text: "#1a7f37" },
  "진행중": { bg: "#fff3cd", text: "#9a6700" },
  "예정": { bg: "#e8e8e8", text: "#656d76" },
  "완강": { bg: "#dff5e3", text: "#1a7f37" },
  "수강중": { bg: "#fff3cd", text: "#9a6700" },
  "중단": { bg: "#ffe0e0", text: "#cf222e" },
  "초급": { bg: "#e8e8e8", text: "#656d76" },
  "중급": { bg: "#fff3cd", text: "#9a6700" },
  "고급": { bg: "#dff5e3", text: "#1a7f37" },
  "관심": { bg: "#e8e8f8", text: "#5b21b6" },
  "서류준비": { bg: "#fff3cd", text: "#9a6700" },
  "지원완료": { bg: "#dbeafe", text: "#1d4ed8" },
  "서류통과": { bg: "#dff5e3", text: "#1a7f37" },
  "면접예정": { bg: "#fef3c7", text: "#92400e" },
  "최종합격": { bg: "#bbf7d0", text: "#166534" },
  "불합격": { bg: "#ffe0e0", text: "#cf222e" },
  "대기중": { bg: "#e8e8e8", text: "#656d76" },
  "작성중": { bg: "#fff3cd", text: "#9a6700" },
  "완료": { bg: "#dff5e3", text: "#1a7f37" },
  "합격": { bg: "#bbf7d0", text: "#166534" },
  "1차": { bg: "#dbeafe", text: "#1d4ed8" },
  "2차": { bg: "#e8e8f8", text: "#5b21b6" },
  "최종": { bg: "#fef3c7", text: "#92400e" },
};

/* ═══════════════════════════════════════════
   Shared UI Components
   ═══════════════════════════════════════════ */
const Badge = ({ label }) => {
  const c = STATUS_COLORS[label] || { bg: "#f0f0f0", text: "#555" };
  return (
    <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, backgroundColor: c.bg, color: c.text }}>{label}</span>
  );
};

const ProgressBar = ({ value, color = "#4f46e5" }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
    <div style={{ flex: 1, height: 8, backgroundColor: "#eee", borderRadius: 100, overflow: "hidden" }}>
      <div style={{ width: `${Math.min(value, 100)}%`, height: "100%", background: `linear-gradient(90deg, ${color}, ${color}cc)`, borderRadius: 100, transition: "width 0.6s ease" }} />
    </div>
    <span style={{ fontSize: 13, fontWeight: 600, color: "#555", minWidth: 38 }}>{value}%</span>
  </div>
);

const StatCard = ({ icon, label, value, sub, color = "#4f46e5" }) => (
  <div style={{ backgroundColor: "#fff", borderRadius: 14, border: "1px solid #e8e8ec", padding: "20px 22px", display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: 22 }}>{icon}</span>
      <span style={{ fontSize: 11, fontWeight: 600, color, backgroundColor: `${color}15`, padding: "3px 10px", borderRadius: 20, whiteSpace: "nowrap" }}>{sub}</span>
    </div>
    <span style={{ fontSize: 28, fontWeight: 800, color: "#1a1a2e" }}>{value}</span>
    <span style={{ fontSize: 13, color: "#888" }}>{label}</span>
  </div>
);

const SectionCard = ({ title, desc, children, onAdd }) => (
  <div className="fade-in" style={{ backgroundColor: "#fff", borderRadius: 14, border: "1px solid #e8e8ec", padding: "24px 28px", marginBottom: 20 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: desc ? 4 : 14 }}>
      <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#1a1a2e" }}>{title}</h3>
      {onAdd && (
        <button onClick={onAdd} style={{ padding: "6px 16px", borderRadius: 8, border: "1px solid #ddd", backgroundColor: "#fff", fontSize: 13, fontWeight: 600, color: "#4f46e5", cursor: "pointer", transition: "all 0.15s" }}
          onMouseEnter={e => { e.target.style.backgroundColor = "#f0f0ff"; }} onMouseLeave={e => { e.target.style.backgroundColor = "#fff"; }}>
          + 추가
        </button>
      )}
    </div>
    {desc && <p style={{ margin: "0 0 18px", fontSize: 13, color: "#888" }}>{desc}</p>}
    {children}
  </div>
);

const Modal = ({ title, onClose, children }) => (
  <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.4)", padding: 20 }} onClick={onClose}>
    <div className="fade-in" style={{ backgroundColor: "#fff", borderRadius: 16, padding: "28px 32px", width: "100%", maxWidth: 500, maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#1a1a2e" }}>{title}</h3>
        <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#999" }}>✕</button>
      </div>
      {children}
    </div>
  </div>
);

const FormField = ({ label, children }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#555", marginBottom: 6 }}>{label}</label>
    {children}
  </div>
);

const inputStyle = { width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14, outline: "none", transition: "border 0.15s" };
const selectStyle = { ...inputStyle, backgroundColor: "#fff" };
const btnPrimary = { padding: "10px 24px", borderRadius: 8, border: "none", backgroundColor: "#4f46e5", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", width: "100%" };
const btnDanger = { padding: "6px 14px", borderRadius: 6, border: "1px solid #fca5a5", backgroundColor: "#fff", color: "#ef4444", fontSize: 12, fontWeight: 600, cursor: "pointer" };

const EmptyState = ({ icon, text }) => (
  <div style={{ textAlign: "center", padding: "40px 20px", color: "#bbb" }}>
    <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>
    <div style={{ fontSize: 14 }}>{text}</div>
  </div>
);

const DeleteBtn = ({ onClick }) => (
  <button onClick={e => { e.stopPropagation(); if(confirm("삭제하시겠습니까?")) onClick(); }} style={btnDanger}>삭제</button>
);

/* ═══════════════════════════════════════════
   Supabase CRUD Hook
   ═══════════════════════════════════════════ */
function useSupabaseTable(tableName, orderBy = "created_at") {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data: rows, error } = await supabase.from(tableName).select("*").order(orderBy, { ascending: false });
    if (!error) setData(rows || []);
    setLoading(false);
  }, [tableName, orderBy]);

  useEffect(() => { fetch(); }, [fetch]);

  const insert = async (row) => {
    const { error } = await supabase.from(tableName).insert(row);
    if (!error) await fetch();
    return !error;
  };

  const update = async (id, updates) => {
    const { error } = await supabase.from(tableName).update(updates).eq("id", id);
    if (!error) await fetch();
    return !error;
  };

  const remove = async (id) => {
    const { error } = await supabase.from(tableName).delete().eq("id", id);
    if (!error) await fetch();
    return !error;
  };

  return { data, loading, fetch, insert, update, remove };
}

/* ═══════════════════════════════════════════
   SECTION: Overview Dashboard
   ═══════════════════════════════════════════ */
function Overview({ certs, courses, skills, reading, habits }) {
  const certCount = certs.data.length;
  const inProgressCerts = certs.data.filter(c => c.status === "진행중").length;
  const activeCourses = courses.data.filter(c => c.status === "수강중");
  const avgProgress = activeCourses.length ? Math.round(activeCourses.reduce((s, c) => s + (c.total_lessons > 0 ? (c.completed_lessons / c.total_lessons * 100) : 0), 0) / activeCourses.length) : 0;
  const skillCount = skills.data.length;
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const monthReading = reading.data.filter(r => r.read_date >= monthStart.slice(0, 10)).length;

  const weekDays = ["월", "화", "수", "목", "금", "토", "일"];
  const todayIdx = (new Date().getDay() + 6) % 7;
  const weekHabits = habits.data.filter(h => {
    const d = new Date(h.date);
    const diff = Math.floor((now - d) / 86400000);
    return diff >= 0 && diff < 7;
  });

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 24 }}>
        <StatCard icon="📜" label="자격증" value={certCount} sub={`${inProgressCerts} 진행중`} color="#9333ea" />
        <StatCard icon="📚" label="인강 수강중" value={activeCourses.length} sub={`평균 ${avgProgress}%`} color="#2563eb" />
        <StatCard icon="⚡" label="등록 스킬" value={skillCount} sub="전체" color="#059669" />
        <StatCard icon="📖" label="이번 달 독서" value={monthReading} sub="이번 달" color="#d97706" />
      </div>

      {activeCourses.length > 0 && (
        <SectionCard title="📈 인강 진도 현황">
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {activeCourses.map((c, i) => {
              const pct = c.total_lessons > 0 ? Math.round(c.completed_lessons / c.total_lessons * 100) : 0;
              const colors = ["#4f46e5", "#059669", "#d97706", "#dc2626", "#8b5cf6", "#0891b2"];
              return (
                <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                  <div style={{ minWidth: 160 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#333" }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: "#999" }}>{c.platform} · {c.completed_lessons}/{c.total_lessons}강</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 120 }}>
                    <ProgressBar value={pct} color={colors[i % colors.length]} />
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   SECTION: Certifications
   ═══════════════════════════════════════════ */
function Certifications({ certs }) {
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});

  const openAdd = () => { setForm({ name: "", status: "예정", exam_date: "", pass: "미응시", field: "", note: "" }); setModal("add"); };
  const openEdit = (item) => { setForm({ ...item }); setModal("edit"); };

  const save = async () => {
    if (!form.name) return alert("자격증명을 입력하세요");
    if (modal === "add") await certs.insert(form);
    else await certs.update(form.id, form);
    setModal(null);
  };

  return (
    <>
      <SectionCard title="📜 자격증 관리" desc="자격증 취득 상태와 시험일을 관리하세요" onAdd={openAdd}>
        {certs.data.length === 0 ? <EmptyState icon="📜" text="자격증을 추가해보세요!" /> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {certs.data.map(c => (
              <div key={c.id} onClick={() => openEdit(c)} style={{ border: "1px solid #eee", borderRadius: 10, padding: "14px 18px", cursor: "pointer", transition: "all 0.15s", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "#ccc"} onMouseLeave={e => e.currentTarget.style.borderColor = "#eee"}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15, color: "#1a1a2e", marginBottom: 4 }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: "#999" }}>{c.exam_date || "날짜 미정"} · {c.field || "분야 미지정"}</div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <Badge label={c.status} />
                  <DeleteBtn onClick={() => certs.remove(c.id)} />
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
      {modal && (
        <Modal title={modal === "add" ? "자격증 추가" : "자격증 수정"} onClose={() => setModal(null)}>
          <FormField label="자격증명"><input style={inputStyle} value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="예) 컴퓨터활용능력 1급" /></FormField>
          <FormField label="상태">
            <select style={selectStyle} value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
              <option>예정</option><option>진행중</option><option>취득완료</option>
            </select>
          </FormField>
          <FormField label="시험일"><input type="date" style={inputStyle} value={form.exam_date || ""} onChange={e => setForm({...form, exam_date: e.target.value})} /></FormField>
          <FormField label="합격여부">
            <select style={selectStyle} value={form.pass} onChange={e => setForm({...form, pass: e.target.value})}>
              <option>미응시</option><option>합격</option><option>불합격</option>
            </select>
          </FormField>
          <FormField label="관련 분야"><input style={inputStyle} value={form.field || ""} onChange={e => setForm({...form, field: e.target.value})} placeholder="예) IT, 사무" /></FormField>
          <FormField label="비고"><input style={inputStyle} value={form.note || ""} onChange={e => setForm({...form, note: e.target.value})} placeholder="메모" /></FormField>
          <button style={btnPrimary} onClick={save}>{modal === "add" ? "추가" : "저장"}</button>
        </Modal>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════
   SECTION: Skills
   ═══════════════════════════════════════════ */
function Skills({ skills }) {
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});

  const openAdd = () => { setForm({ name: "", category: "", level: "초급", method: "", priority: "중" }); setModal("add"); };
  const openEdit = (item) => { setForm({ ...item }); setModal("edit"); };

  const save = async () => {
    if (!form.name) return alert("스킬명을 입력하세요");
    if (modal === "add") await skills.insert(form);
    else await skills.update(form.id, form);
    setModal(null);
  };

  return (
    <>
      <SectionCard title="⚡ 스킬 관리" desc="보유 스킬을 체계적으로 관리하세요" onAdd={openAdd}>
        {skills.data.length === 0 ? <EmptyState icon="⚡" text="스킬을 추가해보세요!" /> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {skills.data.map(s => (
              <div key={s.id} onClick={() => openEdit(s)} style={{ border: "1px solid #eee", borderRadius: 10, padding: "14px 18px", cursor: "pointer", transition: "all 0.15s", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "#ccc"} onMouseLeave={e => e.currentTarget.style.borderColor = "#eee"}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15, color: "#1a1a2e", marginBottom: 4 }}>{s.name}</div>
                  <div style={{ fontSize: 12, color: "#999" }}>{s.category || "미분류"} · {s.method || ""}</div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <Badge label={s.level} />
                  <DeleteBtn onClick={() => skills.remove(s.id)} />
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
      {modal && (
        <Modal title={modal === "add" ? "스킬 추가" : "스킬 수정"} onClose={() => setModal(null)}>
          <FormField label="스킬명"><input style={inputStyle} value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="예) 콘텐츠 기획" /></FormField>
          <FormField label="분류"><input style={inputStyle} value={form.category || ""} onChange={e => setForm({...form, category: e.target.value})} placeholder="예) 기획, 디자인, IT" /></FormField>
          <FormField label="숙련도">
            <select style={selectStyle} value={form.level} onChange={e => setForm({...form, level: e.target.value})}>
              <option>초급</option><option>중급</option><option>고급</option>
            </select>
          </FormField>
          <FormField label="학습 방법"><input style={inputStyle} value={form.method || ""} onChange={e => setForm({...form, method: e.target.value})} placeholder="예) 실무 경험 + 인강" /></FormField>
          <FormField label="우선순위">
            <select style={selectStyle} value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}>
              <option>상</option><option>중</option><option>하</option>
            </select>
          </FormField>
          <button style={btnPrimary} onClick={save}>{modal === "add" ? "추가" : "저장"}</button>
        </Modal>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════
   SECTION: Courses
   ═══════════════════════════════════════════ */
function Courses({ courses }) {
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});

  const openAdd = () => { setForm({ name: "", platform: "", total_lessons: 0, completed_lessons: 0, target_date: "", status: "수강중" }); setModal("add"); };
  const openEdit = (item) => { setForm({ ...item }); setModal("edit"); };

  const save = async () => {
    if (!form.name) return alert("강의명을 입력하세요");
    const d = { ...form, total_lessons: Number(form.total_lessons), completed_lessons: Number(form.completed_lessons) };
    if (modal === "add") await courses.insert(d);
    else await courses.update(d.id, d);
    setModal(null);
  };

  const colors = ["#4f46e5", "#059669", "#d97706", "#dc2626", "#8b5cf6", "#0891b2"];

  return (
    <>
      <SectionCard title="📚 인강 학습 트래커" desc="진도율과 목표일을 관리하세요" onAdd={openAdd}>
        {courses.data.length === 0 ? <EmptyState icon="📚" text="인강을 추가해보세요!" /> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {courses.data.map((c, i) => {
              const pct = c.total_lessons > 0 ? Math.round(c.completed_lessons / c.total_lessons * 100) : 0;
              return (
                <div key={c.id} onClick={() => openEdit(c)} style={{ border: "1px solid #eee", borderRadius: 12, padding: "18px 22px", cursor: "pointer", display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap", transition: "box-shadow 0.15s", backgroundColor: c.status === "완강" ? "#fafff9" : "#fff" }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.06)"} onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
                  <div style={{ flex: "0 0 auto", minWidth: 160 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: "#1a1a2e", marginBottom: 4 }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: "#999" }}>{c.platform} · {c.completed_lessons}/{c.total_lessons}강</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 120 }}><ProgressBar value={pct} color={colors[i % colors.length]} /></div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <Badge label={c.status} />
                    <DeleteBtn onClick={() => courses.remove(c.id)} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>
      {modal && (
        <Modal title={modal === "add" ? "인강 추가" : "인강 수정"} onClose={() => setModal(null)}>
          <FormField label="강의명"><input style={inputStyle} value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="예) 문화기획 실무 마스터" /></FormField>
          <FormField label="플랫폼"><input style={inputStyle} value={form.platform || ""} onChange={e => setForm({...form, platform: e.target.value})} placeholder="예) 클래스101, 인프런" /></FormField>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <FormField label="총 강의수"><input type="number" style={inputStyle} value={form.total_lessons} onChange={e => setForm({...form, total_lessons: e.target.value})} /></FormField>
            <FormField label="수강 완료수"><input type="number" style={inputStyle} value={form.completed_lessons} onChange={e => setForm({...form, completed_lessons: e.target.value})} /></FormField>
          </div>
          <FormField label="목표 완강일"><input type="date" style={inputStyle} value={form.target_date || ""} onChange={e => setForm({...form, target_date: e.target.value})} /></FormField>
          <FormField label="상태">
            <select style={selectStyle} value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
              <option>수강중</option><option>완강</option><option>중단</option>
            </select>
          </FormField>
          <button style={btnPrimary} onClick={save}>{modal === "add" ? "추가" : "저장"}</button>
        </Modal>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════
   SECTION: Notes
   ═══════════════════════════════════════════ */
function Notes({ notes }) {
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});

  const openAdd = () => { setForm({ title: "", related_course: "", tags: "", content: "" }); setModal("add"); };
  const openEdit = (item) => { setForm({ ...item }); setModal("edit"); };

  const save = async () => {
    if (!form.title) return alert("제목을 입력하세요");
    if (modal === "add") await notes.insert(form);
    else await notes.update(form.id, form);
    setModal(null);
  };

  return (
    <>
      <SectionCard title="✏️ 필기노트" desc="강의/자격증별 필기를 기록하세요" onAdd={openAdd}>
        {notes.data.length === 0 ? <EmptyState icon="✏️" text="필기노트를 추가해보세요!" /> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {notes.data.map(n => (
              <div key={n.id} onClick={() => openEdit(n)} style={{ border: "1px solid #eee", borderRadius: 10, padding: "16px 20px", cursor: "pointer", transition: "all 0.15s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#ccc"; }} onMouseLeave={e => { e.currentTarget.style.borderColor = "#eee"; }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                  <span style={{ fontWeight: 700, fontSize: 15, color: "#1a1a2e" }}>{n.title}</span>
                  <DeleteBtn onClick={() => notes.remove(n.id)} />
                </div>
                <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                  {n.related_course && <span style={{ fontSize: 12, color: "#666", backgroundColor: "#f0f0f5", padding: "2px 8px", borderRadius: 6 }}>📚 {n.related_course}</span>}
                  {n.tags && n.tags.split(",").map((t, i) => <span key={i} style={{ fontSize: 12, color: "#666", backgroundColor: "#f0f0f5", padding: "2px 8px", borderRadius: 6 }}>#{t.trim()}</span>)}
                </div>
                {n.content && <p style={{ margin: 0, fontSize: 13, color: "#888", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{n.content.slice(0, 120)}{n.content.length > 120 ? "..." : ""}</p>}
              </div>
            ))}
          </div>
        )}
      </SectionCard>
      {modal && (
        <Modal title={modal === "add" ? "필기노트 추가" : "필기노트 수정"} onClose={() => setModal(null)}>
          <FormField label="제목"><input style={inputStyle} value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="예) 문화기획 5강 - 공간기획" /></FormField>
          <FormField label="관련 강의"><input style={inputStyle} value={form.related_course || ""} onChange={e => setForm({...form, related_course: e.target.value})} placeholder="예) 문화기획 실무 마스터" /></FormField>
          <FormField label="태그 (쉼표로 구분)"><input style={inputStyle} value={form.tags || ""} onChange={e => setForm({...form, tags: e.target.value})} placeholder="예) 기획, 공간" /></FormField>
          <FormField label="내용"><textarea style={{ ...inputStyle, minHeight: 160, resize: "vertical" }} value={form.content || ""} onChange={e => setForm({...form, content: e.target.value})} placeholder="필기 내용을 작성하세요..." /></FormField>
          <button style={btnPrimary} onClick={save}>{modal === "add" ? "추가" : "저장"}</button>
        </Modal>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════
   SECTION: Reading Log
   ═══════════════════════════════════════════ */
function ReadingLog({ reading }) {
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});

  const openAdd = () => { setForm({ title: "", type: "책", category: "", insight: "", rating: 3, read_date: new Date().toISOString().slice(0, 10) }); setModal("add"); };
  const openEdit = (item) => { setForm({ ...item }); setModal("edit"); };

  const save = async () => {
    if (!form.title) return alert("제목을 입력하세요");
    if (modal === "add") await reading.insert({ ...form, rating: Number(form.rating) });
    else await reading.update(form.id, { ...form, rating: Number(form.rating) });
    setModal(null);
  };

  const stars = (n) => "⭐".repeat(n);

  return (
    <>
      <SectionCard title="📖 독서/콘텐츠 로그" desc="책, 아티클, 영상에서 얻은 인사이트를 기록하세요" onAdd={openAdd}>
        {reading.data.length === 0 ? <EmptyState icon="📖" text="콘텐츠를 추가해보세요!" /> : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
            {reading.data.map(item => (
              <div key={item.id} onClick={() => openEdit(item)} style={{ border: "1px solid #eee", borderRadius: 12, padding: "18px 20px", cursor: "pointer", transition: "box-shadow 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.06)"} onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: "#888" }}>{item.type === "책" ? "📕" : item.type === "아티클" ? "📄" : "🎬"} {item.type}</span>
                  <span style={{ fontSize: 12 }}>{stars(item.rating)}</span>
                </div>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#1a1a2e", marginBottom: 6 }}>{item.title}</div>
                {item.category && <span style={{ display: "inline-block", fontSize: 11, backgroundColor: "#f0f0f5", padding: "2px 8px", borderRadius: 6, color: "#666", marginBottom: 10 }}>#{item.category}</span>}
                {item.insight && <p style={{ margin: 0, fontSize: 13, color: "#777", lineHeight: 1.6 }}>💡 {item.insight}</p>}
                <div style={{ marginTop: 8, textAlign: "right" }}><DeleteBtn onClick={() => reading.remove(item.id)} /></div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
      {modal && (
        <Modal title={modal === "add" ? "콘텐츠 추가" : "콘텐츠 수정"} onClose={() => setModal(null)}>
          <FormField label="제목"><input style={inputStyle} value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="예) 트렌드 코리아 2025" /></FormField>
          <FormField label="유형">
            <select style={selectStyle} value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
              <option>책</option><option>아티클</option><option>영상</option><option>팟캐스트</option>
            </select>
          </FormField>
          <FormField label="카테고리"><input style={inputStyle} value={form.category || ""} onChange={e => setForm({...form, category: e.target.value})} placeholder="예) 트렌드, 문화" /></FormField>
          <FormField label="별점 (1~5)"><input type="number" min="1" max="5" style={inputStyle} value={form.rating} onChange={e => setForm({...form, rating: e.target.value})} /></FormField>
          <FormField label="읽은 날짜"><input type="date" style={inputStyle} value={form.read_date || ""} onChange={e => setForm({...form, read_date: e.target.value})} /></FormField>
          <FormField label="핵심 인사이트"><textarea style={{ ...inputStyle, minHeight: 100, resize: "vertical" }} value={form.insight || ""} onChange={e => setForm({...form, insight: e.target.value})} placeholder="한줄 요약 메모" /></FormField>
          <button style={btnPrimary} onClick={save}>{modal === "add" ? "추가" : "저장"}</button>
        </Modal>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════
   SECTION: Portfolio
   ═══════════════════════════════════════════ */
function Portfolio({ portfolio }) {
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const icons = { "기획": "📝", "디자인": "🎨", "데이터": "📊", "마케팅": "📸", "리서치": "📋", "기타": "📁" };

  const openAdd = () => { setForm({ title: "", category: "기획", description: "" }); setModal("add"); };
  const openEdit = (item) => { setForm({ ...item }); setModal("edit"); };

  const save = async () => {
    if (!form.title) return alert("작업명을 입력하세요");
    if (modal === "add") await portfolio.insert(form);
    else await portfolio.update(form.id, form);
    setModal(null);
  };

  return (
    <>
      <SectionCard title="🗂️ 포트폴리오 소스 아카이브" desc="학습 과정에서 만든 산출물을 모아두세요" onAdd={openAdd}>
        {portfolio.data.length === 0 ? <EmptyState icon="🗂️" text="산출물을 추가해보세요!" /> : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
            {portfolio.data.map(item => (
              <div key={item.id} onClick={() => openEdit(item)} style={{ border: "1px solid #eee", borderRadius: 12, padding: 20, textAlign: "center", cursor: "pointer", transition: "all 0.15s" }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.06)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>{icons[item.category] || "📁"}</div>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#1a1a2e", marginBottom: 4 }}>{item.title}</div>
                <div style={{ fontSize: 12, color: "#999", marginBottom: 8 }}>{item.description}</div>
                <span style={{ fontSize: 11, backgroundColor: "#f0f0f5", padding: "2px 8px", borderRadius: 6, color: "#666" }}>#{item.category}</span>
                <div style={{ marginTop: 10 }}><DeleteBtn onClick={() => portfolio.remove(item.id)} /></div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
      {modal && (
        <Modal title={modal === "add" ? "산출물 추가" : "산출물 수정"} onClose={() => setModal(null)}>
          <FormField label="작업명"><input style={inputStyle} value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="예) 전시 기획안 연습" /></FormField>
          <FormField label="분류">
            <select style={selectStyle} value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
              <option>기획</option><option>디자인</option><option>데이터</option><option>마케팅</option><option>리서치</option><option>기타</option>
            </select>
          </FormField>
          <FormField label="설명"><textarea style={{ ...inputStyle, minHeight: 80, resize: "vertical" }} value={form.description || ""} onChange={e => setForm({...form, description: e.target.value})} placeholder="간단한 설명" /></FormField>
          <button style={btnPrimary} onClick={save}>{modal === "add" ? "추가" : "저장"}</button>
        </Modal>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════
   SECTION: Weekly Review
   ═══════════════════════════════════════════ */
function WeeklyReview({ reviews }) {
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});

  const openAdd = () => {
    const now = new Date();
    const weekNum = Math.ceil(now.getDate() / 7);
    setForm({ title: `${now.getFullYear()}년 ${now.getMonth()+1}월 ${weekNum}주차 회고`, learned: "", good: "", improve: "", goals: "" });
    setModal("add");
  };
  const openEdit = (item) => { setForm({ ...item }); setModal("edit"); };

  const save = async () => {
    if (modal === "add") await reviews.insert(form);
    else await reviews.update(form.id, form);
    setModal(null);
  };

  return (
    <>
      <SectionCard title="🔄 주간/월간 회고" desc="매주 돌아보며 성장 방향을 점검하세요" onAdd={openAdd}>
        {reviews.data.length === 0 ? <EmptyState icon="🔄" text="첫 번째 회고를 작성해보세요!" /> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {reviews.data.map(rv => (
              <div key={rv.id} onClick={() => openEdit(rv)} style={{ border: "1px solid #eee", borderRadius: 12, padding: "20px 24px", cursor: "pointer", transition: "all 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "#ccc"} onMouseLeave={e => e.currentTarget.style.borderColor = "#eee"}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <span style={{ fontWeight: 700, fontSize: 16, color: "#1a1a2e" }}>{rv.title}</span>
                  <DeleteBtn onClick={() => reviews.remove(rv.id)} />
                </div>
                {[{ icon: "📗", label: "배운 것", val: rv.learned }, { icon: "🌟", label: "잘한 것", val: rv.good }, { icon: "🔧", label: "개선할 것", val: rv.improve }, { icon: "🎯", label: "목표", val: rv.goals }]
                  .filter(x => x.val)
                  .map((x, i) => (
                    <div key={i} style={{ marginBottom: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#555" }}>{x.icon} {x.label}</span>
                      <p style={{ margin: "4px 0 0 20px", fontSize: 13, color: "#777", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{x.val}</p>
                    </div>
                  ))}
              </div>
            ))}
          </div>
        )}
      </SectionCard>
      {modal && (
        <Modal title={modal === "add" ? "회고 작성" : "회고 수정"} onClose={() => setModal(null)}>
          <FormField label="제목"><input style={inputStyle} value={form.title} onChange={e => setForm({...form, title: e.target.value})} /></FormField>
          <FormField label="📗 이번 주 배운 것"><textarea style={{ ...inputStyle, minHeight: 80, resize: "vertical" }} value={form.learned || ""} onChange={e => setForm({...form, learned: e.target.value})} placeholder="새로 배운 지식, 완료한 강의 등" /></FormField>
          <FormField label="🌟 잘한 것"><textarea style={{ ...inputStyle, minHeight: 80, resize: "vertical" }} value={form.good || ""} onChange={e => setForm({...form, good: e.target.value})} placeholder="목표 달성, 꾸준히 유지한 습관 등" /></FormField>
          <FormField label="🔧 개선할 것"><textarea style={{ ...inputStyle, minHeight: 80, resize: "vertical" }} value={form.improve || ""} onChange={e => setForm({...form, improve: e.target.value})} placeholder="부족했던 점, 보완할 사항" /></FormField>
          <FormField label="🎯 다음 주 목표"><textarea style={{ ...inputStyle, minHeight: 80, resize: "vertical" }} value={form.goals || ""} onChange={e => setForm({...form, goals: e.target.value})} placeholder="구체적이고 실행 가능한 목표" /></FormField>
          <button style={btnPrimary} onClick={save}>{modal === "add" ? "작성" : "저장"}</button>
        </Modal>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════
   SECTION: Events
   ═══════════════════════════════════════════ */
function Events({ events }) {
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});

  const openAdd = () => { setForm({ name: "", event_date: "", place: "", type: "세미나", insight: "", contacts: "" }); setModal("add"); };
  const openEdit = (item) => { setForm({ ...item }); setModal("edit"); };

  const save = async () => {
    if (!form.name) return alert("행사명을 입력하세요");
    if (modal === "add") await events.insert(form);
    else await events.update(form.id, form);
    setModal(null);
  };

  return (
    <>
      <SectionCard title="🎪 네트워킹/세미나 기록" desc="참석한 행사와 인사이트를 기록하세요" onAdd={openAdd}>
        {events.data.length === 0 ? <EmptyState icon="🎪" text="세미나/행사를 추가해보세요!" /> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {events.data.map(ev => (
              <div key={ev.id} onClick={() => openEdit(ev)} style={{ border: "1px solid #eee", borderRadius: 10, padding: "14px 18px", cursor: "pointer", transition: "all 0.15s", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "#ccc"} onMouseLeave={e => e.currentTarget.style.borderColor = "#eee"}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15, color: "#1a1a2e", marginBottom: 4 }}>{ev.name}</div>
                  <div style={{ fontSize: 12, color: "#999" }}>{ev.event_date || ""} · {ev.place || ""} · {ev.type}</div>
                  {ev.insight && <div style={{ fontSize: 13, color: "#777", marginTop: 4 }}>💡 {ev.insight}</div>}
                </div>
                <DeleteBtn onClick={() => events.remove(ev.id)} />
              </div>
            ))}
          </div>
        )}
      </SectionCard>
      {modal && (
        <Modal title={modal === "add" ? "행사 추가" : "행사 수정"} onClose={() => setModal(null)}>
          <FormField label="행사명"><input style={inputStyle} value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="예) 2025 문화도시 포럼" /></FormField>
          <FormField label="날짜"><input type="date" style={inputStyle} value={form.event_date || ""} onChange={e => setForm({...form, event_date: e.target.value})} /></FormField>
          <FormField label="장소"><input style={inputStyle} value={form.place || ""} onChange={e => setForm({...form, place: e.target.value})} placeholder="예) 서울 DDP" /></FormField>
          <FormField label="유형">
            <select style={selectStyle} value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
              <option>세미나</option><option>컨퍼런스</option><option>포럼</option><option>밋업</option><option>전시</option><option>공연</option><option>기타</option>
            </select>
          </FormField>
          <FormField label="핵심 인사이트"><textarea style={{ ...inputStyle, minHeight: 80, resize: "vertical" }} value={form.insight || ""} onChange={e => setForm({...form, insight: e.target.value})} /></FormField>
          <FormField label="연결 인맥"><input style={inputStyle} value={form.contacts || ""} onChange={e => setForm({...form, contacts: e.target.value})} placeholder="만난 사람, 명함 교환 등" /></FormField>
          <button style={btnPrimary} onClick={save}>{modal === "add" ? "추가" : "저장"}</button>
        </Modal>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════
   SECTION: Habits
   ═══════════════════════════════════════════ */
function Habits({ habits }) {
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});

  const openAdd = () => { setForm({ date: new Date().toISOString().slice(0, 10), habit_name: "", completed: true }); setModal("add"); };

  const save = async () => {
    if (!form.habit_name) return alert("습관명을 입력하세요");
    await habits.insert({ ...form, completed: form.completed === true || form.completed === "true" });
    setModal(null);
  };

  // Group by date
  const grouped = {};
  habits.data.forEach(h => {
    if (!grouped[h.date]) grouped[h.date] = [];
    grouped[h.date].push(h);
  });
  const dates = Object.keys(grouped).sort().reverse().slice(0, 14);

  // Get unique habit names
  const habitNames = [...new Set(habits.data.map(h => h.habit_name))];

  return (
    <>
      <SectionCard title="✅ 습관 트래커" desc="매일 체크하며 꾸준함을 쌓아가요" onAdd={openAdd}>
        {habits.data.length === 0 ? <EmptyState icon="✅" text="습관을 추가해보세요!" /> : (
          <>
            {habitNames.length > 0 && (
              <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
                {habitNames.map(name => {
                  const total = habits.data.filter(h => h.habit_name === name).length;
                  const done = habits.data.filter(h => h.habit_name === name && h.completed).length;
                  const rate = total > 0 ? Math.round(done / total * 100) : 0;
                  return (
                    <div key={name} style={{ flex: "1 1 120px", textAlign: "center", padding: "14px 10px", backgroundColor: "#fafafa", borderRadius: 10 }}>
                      <div style={{ fontSize: 24, fontWeight: 800, color: rate >= 70 ? "#1a7f37" : rate >= 50 ? "#9a6700" : "#cf222e" }}>{rate}%</div>
                      <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>{name}</div>
                    </div>
                  );
                })}
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {dates.map(date => (
                <div key={date} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 12px", borderRadius: 8, backgroundColor: "#fafafa" }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#555", minWidth: 90 }}>{date}</span>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {grouped[date].map(h => (
                      <span key={h.id} style={{ fontSize: 12, padding: "3px 10px", borderRadius: 6, backgroundColor: h.completed ? "#dff5e3" : "#ffe0e0", color: h.completed ? "#1a7f37" : "#cf222e", cursor: "pointer" }}
                        onClick={() => { if(confirm(`"${h.habit_name}" 삭제하시겠습니까?`)) habits.remove(h.id); }}>
                        {h.completed ? "✓" : "✗"} {h.habit_name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </SectionCard>
      {modal && (
        <Modal title="습관 기록 추가" onClose={() => setModal(null)}>
          <FormField label="날짜"><input type="date" style={inputStyle} value={form.date} onChange={e => setForm({...form, date: e.target.value})} /></FormField>
          <FormField label="습관명"><input style={inputStyle} value={form.habit_name} onChange={e => setForm({...form, habit_name: e.target.value})} placeholder="예) 영어 공부 30분" list="habit-suggestions" />
            <datalist id="habit-suggestions">{habitNames.map(n => <option key={n} value={n} />)}</datalist>
          </FormField>
          <FormField label="완료 여부">
            <select style={selectStyle} value={form.completed.toString()} onChange={e => setForm({...form, completed: e.target.value})}>
              <option value="true">✅ 완료</option><option value="false">❌ 미완료</option>
            </select>
          </FormField>
          <button style={btnPrimary} onClick={save}>추가</button>
        </Modal>
      )}
    </>
  );
}


/* ═══════════════════════════════════════════
   SECTION: Job Overview Dashboard
   ═══════════════════════════════════════════ */
function JobOverview({ experiences, coverLetters, jobPostings, interviews }) {
  const expCount = experiences.data.length;
  const clCount = coverLetters.data.length;
  const clDone = coverLetters.data.filter(c => c.status === "완료").length;
  const jpTotal = jobPostings.data.length;
  const jpApplied = jobPostings.data.filter(j => !["관심", "서류준비"].includes(j.status)).length;
  const jpPassed = jobPostings.data.filter(j => ["서류통과", "면접예정", "최종합격"].includes(j.status)).length;
  const ivCount = interviews.data.length;
  const statusCounts = {};
  jobPostings.data.forEach(j => { statusCounts[j.status] = (statusCounts[j.status] || 0) + 1; });

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 24 }}>
        <StatCard icon="⭐" label="경험 정리" value={expCount} sub="STAR" color="#9333ea" />
        <StatCard icon="📝" label="자소서" value={`${clDone}/${clCount}`} sub="완료/전체" color="#2563eb" />
        <StatCard icon="📌" label="지원 현황" value={jpApplied} sub={`${jpTotal}개 중`} color="#059669" />
        <StatCard icon="🎤" label="면접" value={ivCount} sub={`${jpPassed}개 통과`} color="#d97706" />
      </div>
      {jpTotal > 0 && (
        <SectionCard title="📊 지원 현황 요약">
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {["관심", "서류준비", "지원완료", "서류통과", "면접예정", "최종합격", "불합격"].map(status => (
              <div key={status} style={{ flex: "1 1 100px", textAlign: "center", padding: "14px 10px", backgroundColor: "#fafafa", borderRadius: 10, minWidth: 90 }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: (STATUS_COLORS[status] || {}).text || "#555" }}>{statusCounts[status] || 0}</div>
                <Badge label={status} />
              </div>
            ))}
          </div>
        </SectionCard>
      )}
      {jobPostings.data.filter(j => j.deadline && new Date(j.deadline) >= new Date()).length > 0 && (
        <SectionCard title="⏰ 다가오는 마감일">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {jobPostings.data.filter(j => j.deadline && new Date(j.deadline) >= new Date()).sort((a, b) => new Date(a.deadline) - new Date(b.deadline)).slice(0, 5).map(j => {
              const daysLeft = Math.ceil((new Date(j.deadline) - new Date()) / 86400000);
              return (
                <div key={j.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderRadius: 8, backgroundColor: daysLeft <= 3 ? "#fff5f5" : "#fafafa" }}>
                  <div><span style={{ fontWeight: 600, fontSize: 14, color: "#1a1a2e" }}>{j.company}</span><span style={{ fontSize: 12, color: "#999", marginLeft: 8 }}>{j.position}</span></div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: daysLeft <= 3 ? "#cf222e" : daysLeft <= 7 ? "#9a6700" : "#059669" }}>D-{daysLeft}</span>
                </div>
              );
            })}
          </div>
        </SectionCard>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   SECTION: Experiences (STAR)
   ═══════════════════════════════════════════ */
function Experiences({ experiences }) {
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [expanded, setExpanded] = useState(null);
  const openAdd = () => { setForm({ title: "", company: "", category: "기획", situation: "", task: "", action: "", result: "", keywords: "" }); setModal("add"); };
  const openEdit = (item) => { setForm({ ...item }); setModal("edit"); };
  const save = async () => {
    if (!form.title) return alert("경험 제목을 입력하세요");
    if (modal === "add") await experiences.insert(form);
    else await experiences.update(form.id, form);
    setModal(null);
  };
  const starColors = { S: "#4f46e5", T: "#059669", A: "#d97706", R: "#dc2626" };
  return (
    <>
      <SectionCard title="⭐ 경험 정리 (STAR)" desc="경험을 STAR 방법론으로 정리하세요" onAdd={openAdd}>
        {experiences.data.length === 0 ? <EmptyState icon="⭐" text="경험을 추가해보세요!" /> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {experiences.data.map(exp => (
              <div key={exp.id} style={{ border: "1px solid #eee", borderRadius: 12, overflow: "hidden" }}>
                <div onClick={() => setExpanded(expanded === exp.id ? null : exp.id)} style={{ padding: "16px 20px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: expanded === exp.id ? "#f8f8ff" : "#fff" }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: "#1a1a2e", marginBottom: 4 }}>{exp.title}</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      {exp.company && <span style={{ fontSize: 12, color: "#666", backgroundColor: "#f0f0f5", padding: "2px 8px", borderRadius: 6 }}>🏢 {exp.company}</span>}
                      {exp.category && <span style={{ fontSize: 12, color: "#666", backgroundColor: "#f0f0f5", padding: "2px 8px", borderRadius: 6 }}>#{exp.category}</span>}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontSize: 18, transition: "transform 0.2s", transform: expanded === exp.id ? "rotate(180deg)" : "rotate(0)" }}>▾</span>
                    <DeleteBtn onClick={() => experiences.remove(exp.id)} />
                  </div>
                </div>
                {expanded === exp.id && (
                  <div className="fade-in" style={{ padding: "0 20px 20px", borderTop: "1px solid #f0f0f0" }}>
                    {[{ key: "S", label: "Situation (상황)", val: exp.situation }, { key: "T", label: "Task (과제)", val: exp.task }, { key: "A", label: "Action (행동)", val: exp.action }, { key: "R", label: "Result (결과)", val: exp.result }].map(item => (
                      <div key={item.key} style={{ marginTop: 14 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                          <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, borderRadius: 6, backgroundColor: starColors[item.key], color: "#fff", fontSize: 13, fontWeight: 800 }}>{item.key}</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "#555" }}>{item.label}</span>
                        </div>
                        <p style={{ margin: "0 0 0 32px", fontSize: 13, color: "#666", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{item.val || "(미작성)"}</p>
                      </div>
                    ))}
                    {exp.keywords && <div style={{ marginTop: 14, paddingLeft: 32 }}><span style={{ fontSize: 12, fontWeight: 600, color: "#888" }}>🔑 키워드: </span>{exp.keywords.split(",").map((k, i) => <span key={i} style={{ fontSize: 12, backgroundColor: "#e8e8f8", color: "#5b21b6", padding: "2px 8px", borderRadius: 6, marginLeft: 4 }}>{k.trim()}</span>)}</div>}
                    <div style={{ marginTop: 14, textAlign: "right" }}><button onClick={() => openEdit(exp)} style={{ padding: "6px 16px", borderRadius: 6, border: "1px solid #ddd", backgroundColor: "#fff", fontSize: 12, fontWeight: 600, color: "#4f46e5", cursor: "pointer" }}>✏️ 수정</button></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </SectionCard>
      {modal && (
        <Modal title={modal === "add" ? "경험 추가" : "경험 수정"} onClose={() => setModal(null)}>
          <FormField label="경험 제목"><input style={inputStyle} value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="예) BGM 온라인 채널 구축" /></FormField>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <FormField label="회사/단체"><input style={inputStyle} value={form.company || ""} onChange={e => setForm({...form, company: e.target.value})} placeholder="예) BGM" /></FormField>
            <FormField label="분류"><select style={selectStyle} value={form.category} onChange={e => setForm({...form, category: e.target.value})}><option>기획</option><option>운영</option><option>마케팅</option><option>고객서비스</option><option>봉사/멘토링</option><option>기타</option></select></FormField>
          </div>
          {[{ key: "situation", label: "S - Situation (상황)", ph: "어떤 상황이었나요?" }, { key: "task", label: "T - Task (과제)", ph: "어떤 과제가 있었나요?" }, { key: "action", label: "A - Action (행동)", ph: "구체적으로 무엇을 했나요?" }, { key: "result", label: "R - Result (결과)", ph: "결과/성과는? (수치 포함)" }].map(item => (
            <FormField key={item.key} label={item.label}><textarea style={{ ...inputStyle, minHeight: 80, resize: "vertical" }} value={form[item.key] || ""} onChange={e => setForm({...form, [item.key]: e.target.value})} placeholder={item.ph} /></FormField>
          ))}
          <FormField label="키워드 (쉼표 구분)"><input style={inputStyle} value={form.keywords || ""} onChange={e => setForm({...form, keywords: e.target.value})} placeholder="예) 매출증가, 온라인마케팅" /></FormField>
          <button style={btnPrimary} onClick={save}>{modal === "add" ? "추가" : "저장"}</button>
        </Modal>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════
   SECTION: Cover Letters
   ═══════════════════════════════════════════ */
function CoverLetters({ coverLetters }) {
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const openAdd = () => { setForm({ company: "", position: "", question: "", answer: "", max_chars: 500, category: "지원동기", status: "작성중" }); setModal("add"); };
  const openEdit = (item) => { setForm({ ...item }); setModal("edit"); };
  const save = async () => {
    if (!form.company || !form.question) return alert("기업명과 문항을 입력하세요");
    const d = { ...form, char_count: (form.answer || "").length, max_chars: Number(form.max_chars) };
    if (modal === "add") await coverLetters.insert(d);
    else await coverLetters.update(d.id, d);
    setModal(null);
  };
  const grouped = {};
  coverLetters.data.forEach(cl => { const key = `${cl.company} - ${cl.position || ""}`; if (!grouped[key]) grouped[key] = []; grouped[key].push(cl); });
  return (
    <>
      <SectionCard title="📝 자소서 관리" desc="기업별 문항과 답변을 관리하세요" onAdd={openAdd}>
        {coverLetters.data.length === 0 ? <EmptyState icon="📝" text="자소서를 추가해보세요!" /> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {Object.entries(grouped).map(([key, items]) => (
              <div key={key} style={{ border: "1px solid #eee", borderRadius: 12, overflow: "hidden" }}>
                <div style={{ padding: "14px 20px", backgroundColor: "#f8f8ff", borderBottom: "1px solid #eee" }}>
                  <span style={{ fontWeight: 700, fontSize: 15, color: "#1a1a2e" }}>🏢 {key}</span>
                  <span style={{ fontSize: 12, color: "#999", marginLeft: 8 }}>{items.length}개 문항</span>
                </div>
                {items.map(cl => {
                  const charPct = cl.max_chars > 0 ? Math.round((cl.answer || "").length / cl.max_chars * 100) : 0;
                  return (
                    <div key={cl.id} onClick={() => openEdit(cl)} style={{ padding: "14px 20px", borderBottom: "1px solid #f5f5f5", cursor: "pointer" }} onMouseEnter={e => e.currentTarget.style.backgroundColor = "#fafafa"} onMouseLeave={e => e.currentTarget.style.backgroundColor = "#fff"}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                        <div style={{ flex: 1 }}><span style={{ fontSize: 12, color: "#888", marginRight: 8 }}>{cl.category}</span><span style={{ fontSize: 14, fontWeight: 600, color: "#333" }}>{cl.question}</span></div>
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}><Badge label={cl.status} /><DeleteBtn onClick={() => coverLetters.remove(cl.id)} /></div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                        <div style={{ flex: 1, height: 4, backgroundColor: "#eee", borderRadius: 100, overflow: "hidden" }}><div style={{ width: `${Math.min(charPct, 100)}%`, height: "100%", backgroundColor: charPct > 95 ? "#cf222e" : charPct > 70 ? "#d97706" : "#4f46e5", borderRadius: 100 }} /></div>
                        <span style={{ fontSize: 11, color: charPct > 95 ? "#cf222e" : "#999", fontWeight: 600 }}>{(cl.answer || "").length}/{cl.max_chars}자</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </SectionCard>
      {modal && (
        <Modal title={modal === "add" ? "자소서 문항 추가" : "자소서 수정"} onClose={() => setModal(null)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <FormField label="기업명"><input style={inputStyle} value={form.company} onChange={e => setForm({...form, company: e.target.value})} placeholder="예) 롯데월드" /></FormField>
            <FormField label="포지션"><input style={inputStyle} value={form.position || ""} onChange={e => setForm({...form, position: e.target.value})} /></FormField>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <FormField label="문항 유형"><select style={selectStyle} value={form.category} onChange={e => setForm({...form, category: e.target.value})}><option>지원동기</option><option>성장과정</option><option>장단점</option><option>경험/역량</option><option>입사 후 포부</option><option>기타</option></select></FormField>
            <FormField label="글자수 제한"><input type="number" style={inputStyle} value={form.max_chars} onChange={e => setForm({...form, max_chars: e.target.value})} /></FormField>
          </div>
          <FormField label="문항"><input style={inputStyle} value={form.question || ""} onChange={e => setForm({...form, question: e.target.value})} placeholder="예) 지원 동기를 작성해주세요" /></FormField>
          <FormField label={`답변 (${(form.answer || "").length}/${form.max_chars}자)`}><textarea style={{ ...inputStyle, minHeight: 200, resize: "vertical" }} value={form.answer || ""} onChange={e => setForm({...form, answer: e.target.value})} placeholder="답변을 작성하세요..." /></FormField>
          <FormField label="상태"><select style={selectStyle} value={form.status} onChange={e => setForm({...form, status: e.target.value})}><option>작성중</option><option>완료</option></select></FormField>
          <button style={btnPrimary} onClick={save}>{modal === "add" ? "추가" : "저장"}</button>
        </Modal>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════
   SECTION: Job Postings
   ═══════════════════════════════════════════ */
function JobPostings({ jobPostings }) {
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [filter, setFilter] = useState("전체");
  const openAdd = () => { setForm({ company: "", position: "", status: "관심", deadline: "", url: "", platform: "", notes: "", applied_date: "", result: "대기중" }); setModal("add"); };
  const openEdit = (item) => { setForm({ ...item }); setModal("edit"); };
  const save = async () => {
    if (!form.company) return alert("기업명을 입력하세요");
    if (modal === "add") await jobPostings.insert(form);
    else await jobPostings.update(form.id, form);
    setModal(null);
  };
  const statuses = ["전체", "관심", "서류준비", "지원완료", "서류통과", "면접예정", "최종합격", "불합격"];
  const filtered = filter === "전체" ? jobPostings.data : jobPostings.data.filter(j => j.status === filter);
  return (
    <>
      <SectionCard title="📌 공고 관리" desc="지원 현황을 한눈에 추적하세요" onAdd={openAdd}>
        <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
          {statuses.map(s => (<button key={s} onClick={() => setFilter(s)} style={{ padding: "6px 14px", borderRadius: 20, border: filter === s ? "none" : "1px solid #ddd", backgroundColor: filter === s ? "#4f46e5" : "#fff", color: filter === s ? "#fff" : "#666", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{s} ({s === "전체" ? jobPostings.data.length : jobPostings.data.filter(j => j.status === s).length})</button>))}
        </div>
        {filtered.length === 0 ? <EmptyState icon="📌" text="공고를 추가해보세요!" /> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filtered.map(j => {
              const daysLeft = j.deadline ? Math.ceil((new Date(j.deadline) - new Date()) / 86400000) : null;
              return (
                <div key={j.id} onClick={() => openEdit(j)} style={{ border: "1px solid #eee", borderRadius: 10, padding: "16px 20px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }} onMouseEnter={e => e.currentTarget.style.borderColor = "#ccc"} onMouseLeave={e => e.currentTarget.style.borderColor = "#eee"}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: "#1a1a2e", marginBottom: 4 }}>{j.company}</div>
                    <div style={{ fontSize: 12, color: "#999" }}>{j.position || ""}{j.platform ? ` · ${j.platform}` : ""}{daysLeft !== null ? ` · 마감 D${daysLeft > 0 ? `-${daysLeft}` : daysLeft === 0 ? "-Day" : `+${Math.abs(daysLeft)}`}` : ""}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}><Badge label={j.status} /><DeleteBtn onClick={() => jobPostings.remove(j.id)} /></div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>
      {modal && (
        <Modal title={modal === "add" ? "공고 추가" : "공고 수정"} onClose={() => setModal(null)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <FormField label="기업명"><input style={inputStyle} value={form.company} onChange={e => setForm({...form, company: e.target.value})} placeholder="예) 롯데월드" /></FormField>
            <FormField label="포지션"><input style={inputStyle} value={form.position || ""} onChange={e => setForm({...form, position: e.target.value})} /></FormField>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <FormField label="진행 상태"><select style={selectStyle} value={form.status} onChange={e => setForm({...form, status: e.target.value})}><option>관심</option><option>서류준비</option><option>지원완료</option><option>서류통과</option><option>면접예정</option><option>최종합격</option><option>불합격</option></select></FormField>
            <FormField label="마감일"><input type="date" style={inputStyle} value={form.deadline || ""} onChange={e => setForm({...form, deadline: e.target.value})} /></FormField>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <FormField label="플랫폼"><input style={inputStyle} value={form.platform || ""} onChange={e => setForm({...form, platform: e.target.value})} placeholder="예) 사람인" /></FormField>
            <FormField label="지원일"><input type="date" style={inputStyle} value={form.applied_date || ""} onChange={e => setForm({...form, applied_date: e.target.value})} /></FormField>
          </div>
          <FormField label="공고 링크"><input style={inputStyle} value={form.url || ""} onChange={e => setForm({...form, url: e.target.value})} placeholder="https://..." /></FormField>
          <FormField label="메모"><textarea style={{ ...inputStyle, minHeight: 80, resize: "vertical" }} value={form.notes || ""} onChange={e => setForm({...form, notes: e.target.value})} /></FormField>
          <button style={btnPrimary} onClick={save}>{modal === "add" ? "추가" : "저장"}</button>
        </Modal>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════
   SECTION: Resume
   ═══════════════════════════════════════════ */
function ResumeSection({ resume }) {
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const openAdd = () => { setForm({ category: "경력", company: "", position: "", period_start: "", period_end: "", description: "", is_current: false }); setModal("add"); };
  const openEdit = (item) => { setForm({ ...item }); setModal("edit"); };
  const save = async () => {
    if (!form.company) return alert("기관명을 입력하세요");
    if (modal === "add") await resume.insert(form);
    else await resume.update(form.id, form);
    setModal(null);
  };
  const categories = ["경력", "학력", "자격증", "교육", "대외활동", "수상"];
  const catIcons = { "경력": "💼", "학력": "🎓", "자격증": "📜", "교육": "📚", "대외활동": "🌍", "수상": "🏆" };
  return (
    <>
      <SectionCard title="📄 이력서/경력 정리" desc="경력 사항을 시간순으로 정리하세요" onAdd={openAdd}>
        {resume.data.length === 0 ? <EmptyState icon="📄" text="경력을 추가해보세요!" /> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {categories.filter(cat => resume.data.some(r => r.category === cat)).map(cat => (
              <div key={cat}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#555", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}><span>{catIcons[cat]}</span>{cat}</div>
                <div style={{ borderLeft: "2px solid #e0e0e0", paddingLeft: 20, display: "flex", flexDirection: "column", gap: 10 }}>
                  {resume.data.filter(r => r.category === cat).map(item => (
                    <div key={item.id} onClick={() => openEdit(item)} style={{ position: "relative", padding: "14px 18px", border: "1px solid #eee", borderRadius: 10, cursor: "pointer", backgroundColor: "#fff" }} onMouseEnter={e => e.currentTarget.style.borderColor = "#ccc"} onMouseLeave={e => e.currentTarget.style.borderColor = "#eee"}>
                      <div style={{ position: "absolute", left: -27, top: 18, width: 10, height: 10, borderRadius: "50%", backgroundColor: item.is_current ? "#4f46e5" : "#ccc" }} />
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 15, color: "#1a1a2e" }}>{item.company}</div>
                          <div style={{ fontSize: 13, color: "#666", marginTop: 2 }}>{item.position}</div>
                          <div style={{ fontSize: 12, color: "#999", marginTop: 4 }}>{item.period_start} ~ {item.is_current ? "현재" : item.period_end}</div>
                        </div>
                        <DeleteBtn onClick={() => resume.remove(item.id)} />
                      </div>
                      {item.description && <p style={{ margin: "10px 0 0", fontSize: 13, color: "#777", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{item.description}</p>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
      {modal && (
        <Modal title={modal === "add" ? "항목 추가" : "항목 수정"} onClose={() => setModal(null)}>
          <FormField label="분류"><select style={selectStyle} value={form.category} onChange={e => setForm({...form, category: e.target.value})}>{categories.map(c => <option key={c}>{c}</option>)}</select></FormField>
          <FormField label="기관/회사명"><input style={inputStyle} value={form.company} onChange={e => setForm({...form, company: e.target.value})} placeholder="예) BGM" /></FormField>
          <FormField label="직위/역할"><input style={inputStyle} value={form.position || ""} onChange={e => setForm({...form, position: e.target.value})} /></FormField>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <FormField label="시작"><input style={inputStyle} value={form.period_start || ""} onChange={e => setForm({...form, period_start: e.target.value})} placeholder="예) 2020.03" /></FormField>
            <FormField label="종료"><input style={inputStyle} value={form.period_end || ""} onChange={e => setForm({...form, period_end: e.target.value})} placeholder="예) 2024.02" disabled={form.is_current} /></FormField>
          </div>
          <FormField label=""><label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, cursor: "pointer" }}><input type="checkbox" checked={form.is_current || false} onChange={e => setForm({...form, is_current: e.target.checked})} /> 현재 재직/재학 중</label></FormField>
          <FormField label="설명"><textarea style={{ ...inputStyle, minHeight: 100, resize: "vertical" }} value={form.description || ""} onChange={e => setForm({...form, description: e.target.value})} placeholder="주요 업무, 성과 등" /></FormField>
          <button style={btnPrimary} onClick={save}>{modal === "add" ? "추가" : "저장"}</button>
        </Modal>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════
   SECTION: Interviews
   ═══════════════════════════════════════════ */
function Interviews({ interviews }) {
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const openAdd = () => { setForm({ company: "", position: "", interview_date: "", interview_type: "1차", questions: "", my_answers: "", feedback: "", result: "대기중" }); setModal("add"); };
  const openEdit = (item) => { setForm({ ...item }); setModal("edit"); };
  const save = async () => {
    if (!form.company) return alert("기업명을 입력하세요");
    if (modal === "add") await interviews.insert(form);
    else await interviews.update(form.id, form);
    setModal(null);
  };
  return (
    <>
      <SectionCard title="🎤 면접 기록" desc="면접 질문과 답변, 후기를 기록하세요" onAdd={openAdd}>
        {interviews.data.length === 0 ? <EmptyState icon="🎤" text="면접 기록을 추가해보세요!" /> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {interviews.data.map(iv => (
              <div key={iv.id} onClick={() => openEdit(iv)} style={{ border: "1px solid #eee", borderRadius: 12, padding: "18px 22px", cursor: "pointer" }} onMouseEnter={e => e.currentTarget.style.borderColor = "#ccc"} onMouseLeave={e => e.currentTarget.style.borderColor = "#eee"}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div><span style={{ fontWeight: 700, fontSize: 15, color: "#1a1a2e" }}>{iv.company}</span><span style={{ fontSize: 12, color: "#999", marginLeft: 8 }}>{iv.position}</span></div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}><Badge label={iv.interview_type} /><Badge label={iv.result} /><DeleteBtn onClick={() => interviews.remove(iv.id)} /></div>
                </div>
                <div style={{ fontSize: 12, color: "#999", marginBottom: 8 }}>📅 {iv.interview_date || "날짜 미정"}</div>
                {iv.questions && <div style={{ marginBottom: 8 }}><span style={{ fontSize: 12, fontWeight: 600, color: "#555" }}>❓ 질문</span><p style={{ margin: "4px 0 0 16px", fontSize: 13, color: "#666", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{iv.questions.slice(0, 100)}{iv.questions.length > 100 ? "..." : ""}</p></div>}
                {iv.feedback && <div><span style={{ fontSize: 12, fontWeight: 600, color: "#555" }}>💡 후기</span><p style={{ margin: "4px 0 0 16px", fontSize: 13, color: "#666", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{iv.feedback.slice(0, 100)}{iv.feedback.length > 100 ? "..." : ""}</p></div>}
              </div>
            ))}
          </div>
        )}
      </SectionCard>
      {modal && (
        <Modal title={modal === "add" ? "면접 기록 추가" : "면접 기록 수정"} onClose={() => setModal(null)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <FormField label="기업명"><input style={inputStyle} value={form.company} onChange={e => setForm({...form, company: e.target.value})} /></FormField>
            <FormField label="포지션"><input style={inputStyle} value={form.position || ""} onChange={e => setForm({...form, position: e.target.value})} /></FormField>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <FormField label="면접일"><input type="date" style={inputStyle} value={form.interview_date || ""} onChange={e => setForm({...form, interview_date: e.target.value})} /></FormField>
            <FormField label="면접 유형"><select style={selectStyle} value={form.interview_type} onChange={e => setForm({...form, interview_type: e.target.value})}><option>1차</option><option>2차</option><option>최종</option><option>실무</option><option>임원</option></select></FormField>
          </div>
          <FormField label="면접 질문"><textarea style={{ ...inputStyle, minHeight: 100, resize: "vertical" }} value={form.questions || ""} onChange={e => setForm({...form, questions: e.target.value})} placeholder="받은 질문들" /></FormField>
          <FormField label="내 답변"><textarea style={{ ...inputStyle, minHeight: 100, resize: "vertical" }} value={form.my_answers || ""} onChange={e => setForm({...form, my_answers: e.target.value})} placeholder="실제로 한 답변" /></FormField>
          <FormField label="후기/피드백"><textarea style={{ ...inputStyle, minHeight: 80, resize: "vertical" }} value={form.feedback || ""} onChange={e => setForm({...form, feedback: e.target.value})} placeholder="느낀 점, 개선할 점" /></FormField>
          <FormField label="결과"><select style={selectStyle} value={form.result} onChange={e => setForm({...form, result: e.target.value})}><option>대기중</option><option>합격</option><option>불합격</option></select></FormField>
          <button style={btnPrimary} onClick={save}>{modal === "add" ? "추가" : "저장"}</button>
        </Modal>
      )}
    </>
  );
}
/* ═══════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════ */
export default function App() {
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const certs = useSupabaseTable("certifications");
  const skills = useSupabaseTable("skills");
  const courses = useSupabaseTable("courses");
  const notes = useSupabaseTable("notes");
  const reading = useSupabaseTable("reading_log");
  const portfolio = useSupabaseTable("portfolio");
  const reviews = useSupabaseTable("weekly_reviews");
  const events = useSupabaseTable("events");
  const habits = useSupabaseTable("habits", "date");

  const experiences = useSupabaseTable("experiences");
  const coverLetters = useSupabaseTable("cover_letters");
  const jobPostings = useSupabaseTable("job_postings");
  const resume = useSupabaseTable("resume_items");
  const interviewsData = useSupabaseTable("interviews");

  const switchTab = (id) => { setActiveTab(id); setSidebarOpen(false); };

  const renderContent = () => {
    switch (activeTab) {
      case "overview": return <Overview certs={certs} courses={courses} skills={skills} reading={reading} habits={habits} />;
      case "certs": return <Certifications certs={certs} />;
      case "skills": return <Skills skills={skills} />;
      case "courses": return <Courses courses={courses} />;
      case "notes": return <Notes notes={notes} />;
      case "reading": return <ReadingLog reading={reading} />;
      case "portfolio": return <Portfolio portfolio={portfolio} />;
      case "review": return <WeeklyReview reviews={reviews} />;
      case "events": return <Events events={events} />;
      case "habits": return <Habits habits={habits} />;
      case "job_overview": return <JobOverview experiences={experiences} coverLetters={coverLetters} jobPostings={jobPostings} interviews={interviewsData} />;
      case "experiences": return <Experiences experiences={experiences} />;
      case "cover_letters": return <CoverLetters coverLetters={coverLetters} />;
      case "job_postings": return <JobPostings jobPostings={jobPostings} />;
      case "resume": return <ResumeSection resume={resume} />;
      case "interviews": return <Interviews interviews={interviewsData} />;
      default: return null;
    }
  };

  return (
    <>
      <style>{globalStyles}</style>
      <div style={{ display: "flex", minHeight: "100vh" }}>

        {/* Mobile Header */}
        <div className="mobile-only" style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 900, backgroundColor: "#fff", borderBottom: "1px solid #e8e8ec", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer" }}>☰</button>
          <span style={{ fontWeight: 700, fontSize: 16, color: "#1a1a2e" }}>📱 My Dashboard</span>
          <div style={{ width: 24 }} />
        </div>

        {/* Mobile Overlay */}
        {sidebarOpen && <div className="mobile-only" style={{ position: "fixed", inset: 0, zIndex: 950, backgroundColor: "rgba(0,0,0,0.3)" }} onClick={() => setSidebarOpen(false)} />}

        {/* Mobile Sidebar (slide-in) */}
        <div className="mobile-sidebar" style={{
          width: 240, backgroundColor: "#fafafa", borderRight: "1px solid #e8e8ec", padding: "28px 16px", display: "flex", flexDirection: "column", flexShrink: 0,
          position: "fixed", top: 0, bottom: 0, left: sidebarOpen ? 0 : "-260px", zIndex: 960, transition: "left 0.25s ease",
        }}>
          <div style={{ marginBottom: 20, padding: "0 8px" }}>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#1a1a2e" }}>My Dashboard</h1>
          </div>
          <nav style={{ display: "flex", flexDirection: "column", gap: 2, overflowY: "auto", flex: 1 }}>
            {TAB_GROUPS.map(group => (
              <div key={group.group}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#bbb", letterSpacing: "0.06em", padding: "14px 12px 6px", userSelect: "none" }}>{group.group}</div>
                {group.tabs.map(tab => (
                  <button key={tab.id} onClick={() => switchTab(tab.id)}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", border: "none", borderRadius: 8, width: "100%",
                      backgroundColor: activeTab === tab.id ? "#e8e8f0" : "transparent", color: activeTab === tab.id ? "#1a1a2e" : "#777",
                      fontWeight: activeTab === tab.id ? 700 : 500, fontSize: 13, cursor: "pointer", transition: "all 0.15s", textAlign: "left", fontFamily: "inherit" }}>
                    <span style={{ fontSize: 15 }}>{tab.icon}</span>{tab.label}
                  </button>
                ))}
              </div>
            ))}
          </nav>
        </div>

        {/* Desktop Sidebar (always visible) */}
        <div className="desktop-only" style={{ width: 240, backgroundColor: "#fafafa", borderRight: "1px solid #e8e8ec", padding: "28px 16px", display: "flex", flexDirection: "column", flexShrink: 0 }}>
          <div style={{ marginBottom: 20, padding: "0 8px" }}>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#1a1a2e" }}>My Dashboard</h1>
          </div>
          <nav style={{ display: "flex", flexDirection: "column", gap: 2, overflowY: "auto", flex: 1 }}>
            {TAB_GROUPS.map(group => (
              <div key={group.group}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#bbb", letterSpacing: "0.06em", padding: "14px 12px 6px", userSelect: "none" }}>{group.group}</div>
                {group.tabs.map(tab => (
                  <button key={tab.id} onClick={() => switchTab(tab.id)}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", border: "none", borderRadius: 8, width: "100%",
                      backgroundColor: activeTab === tab.id ? "#e8e8f0" : "transparent", color: activeTab === tab.id ? "#1a1a2e" : "#777",
                      fontWeight: activeTab === tab.id ? 700 : 500, fontSize: 13, cursor: "pointer", transition: "all 0.15s", textAlign: "left", fontFamily: "inherit" }}>
                    <span style={{ fontSize: 15 }}>{tab.icon}</span>{tab.label}
                  </button>
                ))}
              </div>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="main-content" style={{ flex: 1, padding: "32px 40px", overflowY: "auto", maxHeight: "100vh" }}>
          {renderContent()}
        </div>
      </div>
    </>
  );
}
