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
const TABS = [
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
];

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
          <span style={{ fontWeight: 700, fontSize: 16, color: "#1a1a2e" }}>🌱 자기계발</span>
          <div style={{ width: 24 }} />
        </div>

        {/* Mobile Overlay */}
        {sidebarOpen && <div className="mobile-only" style={{ position: "fixed", inset: 0, zIndex: 950, backgroundColor: "rgba(0,0,0,0.3)" }} onClick={() => setSidebarOpen(false)} />}

        {/* Mobile Sidebar (slide-in) */}
        <div className="mobile-sidebar" style={{
          width: 240, backgroundColor: "#fafafa", borderRight: "1px solid #e8e8ec", padding: "28px 16px", display: "flex", flexDirection: "column", flexShrink: 0,
          position: "fixed", top: 0, bottom: 0, left: sidebarOpen ? 0 : "-260px", zIndex: 960, transition: "left 0.25s ease",
        }}>
          <div style={{ marginBottom: 32, padding: "0 8px" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#bbb", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Self-Development</div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#1a1a2e" }}>🌱 자기계발</h1>
          </div>
          <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => switchTab(tab.id)}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", border: "none", borderRadius: 8,
                  backgroundColor: activeTab === tab.id ? "#e8e8f0" : "transparent", color: activeTab === tab.id ? "#1a1a2e" : "#777",
                  fontWeight: activeTab === tab.id ? 700 : 500, fontSize: 14, cursor: "pointer", transition: "all 0.15s", textAlign: "left", fontFamily: "inherit" }}>
                <span style={{ fontSize: 16 }}>{tab.icon}</span>{tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Desktop Sidebar (always visible) */}
        <div className="desktop-only" style={{ width: 240, backgroundColor: "#fafafa", borderRight: "1px solid #e8e8ec", padding: "28px 16px", display: "flex", flexDirection: "column", flexShrink: 0 }}>
          <div style={{ marginBottom: 32, padding: "0 8px" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#bbb", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Self-Development</div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#1a1a2e" }}>🌱 자기계발</h1>
          </div>
          <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => switchTab(tab.id)}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", border: "none", borderRadius: 8,
                  backgroundColor: activeTab === tab.id ? "#e8e8f0" : "transparent", color: activeTab === tab.id ? "#1a1a2e" : "#777",
                  fontWeight: activeTab === tab.id ? 700 : 500, fontSize: 14, cursor: "pointer", transition: "all 0.15s", textAlign: "left", fontFamily: "inherit" }}>
                <span style={{ fontSize: 16 }}>{tab.icon}</span>{tab.label}
              </button>
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
