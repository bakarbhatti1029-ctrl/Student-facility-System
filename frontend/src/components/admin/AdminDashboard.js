import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import ImageUploadField from '../common/ImageUploadField';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  FaUsers, FaHome, FaUtensils, FaBuilding, FaList, FaChartBar,
  FaSignOutAlt, FaBan, FaTrash, FaCheck, FaTimes,
  FaUnlock, FaUserPlus, FaUserShield,
  FaExclamationTriangle, FaKey, FaLock, FaBell, FaCamera,
  FaBoxOpen, FaChevronRight,
  FaEnvelopeOpenText, FaEnvelope, FaCheckDouble, FaPhone, FaWhatsapp, FaReply,
  FaCalendarAlt, FaCheckCircle, FaCalendarCheck, FaShoppingBag, FaSearch, FaBars,
} from 'react-icons/fa';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const MAX_MINI_ADMINS = 4;

// ── Design tokens ──────────────────────────────────────────────────────────
// Light, clean SaaS-dashboard identity built around the site's real brand
// green (#697565) - white cards on a soft green-tinted canvas, dark
// readable text, and the brand color reserved for accents/actions rather
// than covering the whole UI. Matches the actual public-facing site instead
// of an unrelated dark "console" theme.
const sans = { fontFamily: "'Space Grotesk', system-ui, sans-serif" };
const body = { fontFamily: "system-ui, -apple-system, sans-serif" };

const ink = {
  bg:        '#F0F3EE',
  surface:   '#FFFFFF',
  panel:     '#F5F7F1',
  line:      '#E1E7DB',
  lineSoft:  '#EBEFE6',
  text:      '#1A1A1A',
  sub:       '#5A5A5A',
  faint:     '#8A9086',
  brand:     '#697565',
  brandLight:'#8BA188',
  brandDark: '#4A5347',
  brandDim:  '#E6EBE1',
  onBrand:   '#FFFFFF',
  amber:     '#9C6B12',
  amberDim:  '#FBF0D9',
  amberLine: '#EAD9AE',
  rust:      '#B3452F',
  side:      '#1B2B21',
  sideLine:  'rgba(255,255,255,0.08)',
  sideText:  '#D7DFD8',
  sideFaint: '#8CA094',
  sideActive:'#375243',
  rustDim:   '#FBEAE6',
  rustLine:  '#F0C7BC',
};

// Fixed-order categorical hues for multi-series charts (colorblind-safe, validated
// against this dashboard's white chart surface — see dataviz skill palette check).
// Never reassign per-filter; the order is what keeps the CVD separation valid.
const series = { blue: '#2a78d6', orange: '#eb6834', aqua: '#1baf7a' };

const thCls = 'px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em]';
const tdCls = 'px-5 py-4 text-[13.5px]';
const inputCls = 'w-full px-4 py-2.5 rounded-lg text-sm placeholder-[#8A9086] focus:outline-none focus:ring-2 transition';
const inputStyle = { background: ink.surface, border: `1px solid ${ink.line}`, color: ink.text, '--tw-ring-color': ink.brandLight };

// ── Shared building blocks ─────────────────────────────────────────────────
// Defined at module scope on purpose - defining a component inline inside
// another component's function body makes React treat it as a brand-new
// component type on every render, forcing a full unmount/remount of
// anything inside it (including <input> fields, which then lose focus
// after every keystroke). Keeping these stable is what makes typing in the
// filter box and every form field actually work.

const Pill = ({ tone='neutral', children }) => {
  const styles = {
    neutral: { background: '#F5F7F1', color: ink.sub, border: `1px solid ${ink.line}` },
    strong:  { background: ink.brand, color: '#FFFFFF' },
    amber:   { background: '#8A6D3B', color: '#FFFFFF' },
    muted:   { background: '#3C3D37', color: '#D6D6D2' },
    danger:  { background: '#8F3B28', color: '#FFFFFF' },
  };
  return (
    <span style={{ ...styles[tone], ...body, fontSize: 11, letterSpacing: '0.03em' }}
      className="px-2.5 py-1 rounded-full uppercase font-semibold whitespace-nowrap inline-block">
      {children}
    </span>
  );
};

const StatusPill = ({ status }) => {
  if (status === 'banned') return <Pill tone="muted">Banned</Pill>;
  if (status === 'pending') return <Pill tone="amber">Pending</Pill>;
  if (status === 'approved' || status === 'active') return <Pill tone="strong">Active</Pill>;
  if (status === 'resolved') return <Pill tone="muted">Resolved</Pill>;
  if (status === 'read') return <Pill tone="neutral">Read</Pill>;
  if (status === 'new') return <Pill tone="amber">New</Pill>;
  return <Pill tone="neutral">{status}</Pill>;
};

// KYC turnaround target is 48h from registration; badge only applies while still pending.
const PendingAge = ({ createdAt }) => {
  if (!createdAt) return null;
  const hours = (Date.now() - new Date(createdAt).getTime()) / 3600000;
  if (hours < 0) return null;
  const label = hours >= 48 ? `${Math.floor(hours/24)}d ${Math.floor(hours%24)}h` : `${Math.floor(hours)}h`;
  if (hours >= 48) return <Pill tone="danger">Overdue {label}</Pill>;
  if (hours >= 36) return <Pill tone="amber">{label} · due soon</Pill>;
  return <Pill tone="neutral">{label} waiting</Pill>;
};

const Avatar = ({ name, size='md', src }) => {
  const [failed, setFailed] = useState(false);
  const dims = size==='sm' ? 'w-6 h-6 text-[10.5px]' : 'w-9 h-9 text-[13px]';
  if (src && !failed) {
    return <img src={src} alt="" className={`${dims} rounded-full object-cover flex-shrink-0`} onError={() => setFailed(true)}/>;
  }
  return (
    <span className={`${dims} rounded-full inline-flex items-center justify-center font-bold flex-shrink-0`}
      style={{ background: ink.brandDim, color: ink.brandDark, ...sans }}>
      {((name||'?').trim()[0]||'?').toUpperCase()}
    </span>
  );
};

const Action = ({ onClick, icon, label, tone='default' }) => {
  const tones = {
    default: { background: ink.surface, color: '#3C3D37', border: `1px solid ${ink.line}` },
    go:      { background: ink.brand, color: '#FFFFFF' },
    danger:  { background: '#8F3B28', color: '#FFFFFF' },
  };
  return (
    <button onClick={onClick}
      className="inline-flex items-center gap-1.5 text-[12px] font-semibold px-3 py-2 rounded-lg transition hover:opacity-75"
      style={tones[tone]}>
      <span className="text-[11px]">{icon}</span>
      <span>{label}</span>
    </button>
  );
};

// `level` picks the semantic heading tag: "h1" for a tab's main page title,
// "h2" (default) for a sub-panel title within a tab.
const PanelHeader = ({ title, count, action, level = 'h2' }) => {
  const HeadingTag = level;
  return (
    <div className="px-4 md:px-6 py-4 md:py-5 flex items-center justify-between flex-wrap gap-3" style={{ borderBottom: `1px solid ${ink.line}` }}>
      <div className="flex items-center gap-3">
        {title && <HeadingTag style={sans} className={level === 'h1' ? "text-[24px] font-bold tracking-tight" : "text-[17px] font-semibold tracking-tight"} >{title}</HeadingTag>}
        {count !== undefined && (
          <span style={{ background: ink.brandDim, color: ink.brandDark, ...body }} className="text-[11px] font-semibold px-2.5 py-1 rounded-full">
            {count} record{count!==1?'s':''}
          </span>
        )}
      </div>
      {action}
    </div>
  );
};

const TableFilter = ({ value, onChange, placeholder }) => (
  <div className="relative">
    <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[11px]" style={{ color: ink.faint }}/>
    <input
      value={value}
      onChange={e=>onChange(e.target.value)}
      placeholder={placeholder}
      className={inputCls + ' w-full sm:w-64 !pl-9 text-[12.5px]'}
      style={inputStyle}
    />
  </div>
);

const LoadingRows = ({ cols }) => (
  <tbody>{Array(5).fill(0).map((_,i)=>
    <tr key={i} style={{ borderBottom: `1px solid ${ink.lineSoft}` }}>
      {Array(cols).fill(0).map((_,j)=><td key={j} className="px-5 py-4"><div className="h-3 rounded animate-pulse" style={{ background: ink.line, width: `${40+Math.random()*40}%` }}/></td>)}
    </tr>
  )}</tbody>
);

const EmptyRow = ({ cols, message }) => (
  <tr><td colSpan={cols} className="text-center py-20" style={{ color: ink.faint }}>
    <FaBoxOpen className="mx-auto text-2xl mb-3 opacity-30"/>
    <p className="text-sm" style={body}>{message}</p>
  </td></tr>
);

// Multi-series line-chart tooltip; matches the card surface instead of recharts' default.
const GrowthTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-lg px-3.5 py-2.5" style={{ background: ink.surface, border: `1px solid ${ink.line}`, boxShadow: '0 8px 24px rgba(26,26,26,0.12)' }}>
      <p style={{ ...body, color: ink.sub }} className="text-[11px] font-semibold uppercase tracking-[0.06em] mb-1.5">{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-0.5 last:mb-0">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }}/>
          <span style={{ ...body, color: ink.sub }} className="text-[11.5px]">{p.name}</span>
          <span style={{ ...sans, color: ink.text }} className="text-[12.5px] font-bold ml-auto">{p.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
};

const Modal = ({ onClose, title, icon, children }) => (
  <div className="fixed inset-0 flex items-center justify-center z-50 px-4" style={{ background: 'rgba(26,26,26,0.45)', backdropFilter: 'blur(2px)' }}>
    <div className="rounded-2xl w-full max-w-sm p-6" style={{ background: ink.surface, border: `1px solid ${ink.line}`, boxShadow: '0 20px 50px rgba(26,26,26,0.18)' }}>
      <div className="flex items-center justify-between mb-5">
        <h2 style={{ ...sans, color: ink.text }} className="text-[16px] font-bold flex items-center gap-2">{icon}{title}</h2>
        <button onClick={onClose} className="p-1.5 rounded-lg transition hover:bg-black/5" style={{ color: ink.faint }}><FaTimes/></button>
      </div>
      {children}
    </div>
  </div>
);

const FormField = ({ label, ...props }) => (
  <div>
    <label className="block text-[11px] font-semibold uppercase tracking-[0.06em] mb-1.5" style={{ color: ink.sub }}>{label}</label>
    <input className={inputCls} style={inputStyle} {...props}/>
  </div>
);

const PrimaryBtn = ({ children, ...props }) => (
  <button {...props}
    className="flex-1 py-2.5 rounded-lg font-semibold text-[13.5px] transition hover:opacity-90 disabled:opacity-40"
    style={{ background: ink.brand, color: ink.onBrand }}>
    {children}
  </button>
);
const GhostBtn = ({ children, ...props }) => (
  <button {...props}
    className="flex-1 py-2.5 rounded-lg font-semibold text-[13.5px] transition hover:bg-black/5"
    style={{ background: 'transparent', border: `1px solid ${ink.line}`, color: ink.sub }}>
    {children}
  </button>
);

const DangerBtn = ({ children, ...props }) => (
  <button {...props}
    className="flex-1 py-2.5 rounded-lg font-semibold text-[13.5px] transition hover:opacity-90 disabled:opacity-40"
    style={{ background: ink.rust, color: '#fff' }}>
    {children}
  </button>
);

// Styled replacement for window.confirm() — matches the dashboard theme.
const ConfirmDialog = ({ box, onClose }) => {
  if (!box) return null;
  const danger = box.tone === 'danger';
  return (
    <Modal onClose={onClose} title={box.title || 'Please confirm'}
      icon={<FaExclamationTriangle style={{ color: danger ? '#8F3B28' : '#8A6D3B', fontSize: 13 }}/>}>
      <p style={{ color: ink.sub }} className="text-[13.5px] leading-relaxed mb-5">{box.message}</p>
      <div className="flex gap-2.5">
        <GhostBtn onClick={onClose}>Cancel</GhostBtn>
        {danger
          ? <DangerBtn onClick={() => { onClose(); box.onConfirm(); }}>{box.confirmLabel || 'Yes, continue'}</DangerBtn>
          : <PrimaryBtn onClick={() => { onClose(); box.onConfirm(); }}>{box.confirmLabel || 'Yes, continue'}</PrimaryBtn>}
      </div>
    </Modal>
  );
};

const DetailItem = ({ label, value }) => value !== undefined && value !== null && value !== '' ? (
  <div>
    <p className="text-[10px] font-semibold uppercase tracking-[0.07em] mb-1" style={{ color: ink.faint }}>{label}</p>
    <p className="text-[13px] break-words" style={{ color: ink.text }}>{String(value)}</p>
  </div>
) : null;

const ListingDetails = ({ listing, onClose }) => {
  if (!listing) return null;
  const { type, data } = listing;
  const isHostel = type === 'hostel';
  const title = isHostel ? (data.hostelName || data.hostel_name) : data.kitchen_name;
  const picture = isHostel ? (data.hostelPicture || data.hostel_picture || '/images/hostel.jpg') : (data.kitchen_picture || '/images/kitchens.png');
  const owner = isHostel
    ? `${data.hostel_owner_id?.first_name || ''} ${data.hostel_owner_id?.last_name || ''}`.trim()
    : `${data.first_name || ''} ${data.last_name || ''}`.trim();
  const email = isHostel ? data.hostel_owner_id?.email : data.email;
  const phone = isHostel ? data.hostel_owner_id?.phone_number : data.phone_number;
  const id = isHostel ? data.hostel_owner_id?.owner_id : data.provider_id;
  const entries = isHostel ? (data.rooms || []) : (data.dishes || []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6" role="dialog" aria-modal="true" aria-labelledby="listing-details-title" onMouseDown={e=>{ if(e.target===e.currentTarget) onClose(); }} style={{ background: 'rgba(26,26,26,0.55)', backdropFilter: 'blur(3px)' }}>
      <div className="w-full max-w-3xl max-h-full overflow-y-auto rounded-2xl" style={{ background: ink.surface, border: `1px solid ${ink.line}`, boxShadow: '0 24px 60px rgba(26,26,26,0.22)' }}>
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4" style={{ background: ink.surface, borderBottom: `1px solid ${ink.line}` }}>
          <div><p className="text-[10px] uppercase font-bold tracking-wider" style={{ color: ink.brand }}>{isHostel ? 'Hostel details' : 'Kitchen details'}</p><h2 id="listing-details-title" className="text-xl font-bold" style={sans}>{title}</h2></div>
          <button onClick={onClose} aria-label="Close details" className="p-2 rounded-lg hover:bg-black/5" style={{ color: ink.faint }}><FaTimes/></button>
        </div>
        <div className="p-5 md:p-6">
          <img src={picture} alt={title} className="w-full h-56 md:h-72 rounded-xl object-cover mb-6" onError={e=>{e.currentTarget.style.display='none'}}/>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
            <DetailItem label="Owner" value={owner}/><DetailItem label="Provider ID" value={id}/>
            <DetailItem label="Email" value={email}/><DetailItem label="Phone" value={phone}/>
            <DetailItem label="Address" value={data.address || data.hostel_address}/>
            {isHostel && <DetailItem label="Hostel type" value={data.hostelType || data.hostel_type}/>} 
          </div>
          <DetailItem label="Description" value={isHostel ? (data.description || data.hostel_description) : data.kitchen_description}/>
          {isHostel && data.facilities?.length > 0 && <div className="mt-6"><p className="text-[10px] font-semibold uppercase tracking-[0.07em] mb-2" style={{ color: ink.faint }}>Facilities</p><div className="flex flex-wrap gap-2">{data.facilities.map((f,i)=><Pill key={`${f}-${i}`}>{f}</Pill>)}</div></div>}
          <div className="mt-7 pt-6" style={{ borderTop: `1px solid ${ink.line}` }}>
            <h3 className="font-bold text-[16px] mb-3" style={sans}>{isHostel ? `Rooms (${entries.length})` : `Menu (${entries.length})`}</h3>
            {entries.length === 0 ? <p className="text-sm" style={{ color: ink.faint }}>No {isHostel ? 'rooms' : 'dishes'} have been added.</p> : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{entries.map((item,i)=>{
                const availableBeds = isHostel ? (item.beds || []).filter(b=>!b.isBooked).length : null;
                return <div key={item._id || i} className="rounded-xl p-4" style={{ background: ink.panel, border: `1px solid ${ink.line}` }}>
                  <div className="flex justify-between gap-3"><h4 className="font-semibold text-sm">{item.name}</h4><Pill tone={item.availability === false ? 'muted' : 'strong'}>{item.availability === false ? 'Unavailable' : 'Available'}</Pill></div>
                  <p className="text-[13px] font-bold mt-2" style={{ color: ink.brandDark }}>Rs. {Number(item.price || 0).toLocaleString()}</p>
                  {isHostel ? <p className="text-xs mt-1" style={{ color: ink.sub }}>Capacity: {item.capacity || 0} · Beds available: {availableBeds}/{(item.beds || []).length}</p> : <p className="text-xs mt-1" style={{ color: ink.sub }}>{item.category}</p>}
                  {item.description && <p className="text-xs mt-2 line-clamp-3" style={{ color: ink.faint }}>{item.description}</p>}
                </div>;
              })}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const navigate  = useNavigate();
  const token     = localStorage.getItem('adminToken');
  const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
  const isSuperAdmin = adminData.role === 'super_admin';

  const [stats,        setStats]        = useState({});
  const [growth,       setGrowth]       = useState([]);
  const [activeTab,    setActiveTab]    = useState('overview');
  const [students,     setStudents]     = useState([]);
  const [hostelOwners, setHostelOwners] = useState([]);
  const [kitchenOwners,setKitchenOwners]= useState([]);
  const [hostels,      setHostels]      = useState([]);
  const [kitchens,     setKitchens]     = useState([]);
  const [miniAdmins,   setMiniAdmins]   = useState([]);
  const [messages,     setMessages]     = useState([]);
  const [subjectFilter, setSubjectFilter] = useState('');
  const [loading,      setLoading]      = useState(false);
  const [sidebarOpen,  setSidebarOpen]  = useState(false);
  const [confirmBox,   setConfirmBox]   = useState(null);
  const [selectedListing, setSelectedListing] = useState(null);
  const askConfirm = (message, onConfirm, tone = 'danger', confirmLabel, title) =>
    setConfirmBox({ message, onConfirm, tone, confirmLabel, title });

  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [regForm,  setRegForm]  = useState({ first_name:'', last_name:'', email:'', password:'', confirmPassword:'' });
  const [regError, setRegError] = useState('');
  const [regSuccess,setRegSuccess]=useState('');
  const [regLoading,setRegLoading]=useState(false);
  const [pendingAdminEmail, setPendingAdminEmail] = useState('');
  const [newAdminOtp, setNewAdminOtp] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);

  const [resetTarget, setResetTarget] = useState(null);
  const [resetForm,   setResetForm]   = useState({ newPassword:'', confirmPassword:'' });
  const [resetError,  setResetError]  = useState('');
  const [resetSuccess,setResetSuccess]= useState('');
  const [resetLoading,setResetLoading]= useState(false);

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [cpForm,   setCpForm]   = useState({ currentPassword:'', newPassword:'', confirmPassword:'' });
  const [cpError,  setCpError]  = useState('');
  const [cpSuccess,setCpSuccess]= useState('');
  const [cpLoading,setCpLoading]= useState(false);

  const [showEditProfilePic, setShowEditProfilePic] = useState(false);
  const [myProfilePic, setMyProfilePic] = useState(adminData.profile_picture || '');
  const [ppInput,   setPpInput]   = useState(adminData.profile_picture || '');
  const [ppError,   setPpError]   = useState('');
  const [ppLoading, setPpLoading] = useState(false);

  const [search, setSearch] = useState('');

  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => { if (!token) navigate('/admin/login'); }, [token, navigate]);
  useEffect(() => { if (token) { fetchStats(); fetchGrowth(); fetchMessages(); if (isSuperAdmin) fetchMiniAdmins(); } }, [token]);
  useEffect(() => {
    if (!token) return;
    setSubjectFilter('');
    if (activeTab === 'students')      fetchStudents();
    else if (activeTab === 'hostelOwners')  fetchHostelOwners();
    else if (activeTab === 'kitchenOwners') fetchKitchenOwners();
    else if (activeTab === 'hostels')   fetchHostels();
    else if (activeTab === 'kitchens')  fetchKitchens();
    else if (activeTab === 'admins' && isSuperAdmin) fetchMiniAdmins();
    else if (activeTab === 'messages') fetchMessages();
  }, [activeTab]);

  const fetchStats        = async () => { try { const r = await axios.get(`${API_BASE_URL}/api/admin/stats`, authHeaders); setStats(r.data); } catch(e){} };
  const fetchGrowth       = async () => { try { const r = await axios.get(`${API_BASE_URL}/api/admin/growth-stats`, authHeaders); setGrowth(r.data.data||[]); } catch(e){} };
  const fetchMiniAdmins   = async () => { try { const r = await axios.get(`${API_BASE_URL}/api/admin/list`, authHeaders); setMiniAdmins((r.data||[]).filter(a=>a.role==='admin')); } catch(e){} };
  const fetchStudents     = async () => { setLoading(true); try { const r = await axios.get(`${API_BASE_URL}/api/admin/students`, authHeaders); setStudents(r.data); } catch(e){} setLoading(false); };
  const fetchHostelOwners = async () => { setLoading(true); try { const r = await axios.get(`${API_BASE_URL}/api/admin/hostel-owners`, authHeaders); setHostelOwners(r.data); } catch(e){} setLoading(false); };
  const fetchKitchenOwners= async () => { setLoading(true); try { const r = await axios.get(`${API_BASE_URL}/api/admin/kitchen-owners`, authHeaders); setKitchenOwners(r.data); } catch(e){} setLoading(false); };
  const fetchHostels      = async () => { setLoading(true); try { const r = await axios.get(`${API_BASE_URL}/api/admin/hostels`, authHeaders); setHostels(r.data); } catch(e){} setLoading(false); };
  const fetchKitchens     = async () => { setLoading(true); try { const r = await axios.get(`${API_BASE_URL}/api/admin/kitchens`, authHeaders); setKitchens(r.data); } catch(e){} setLoading(false); };
  const fetchMessages     = async () => { setLoading(true); try { const r = await axios.get(`${API_BASE_URL}/api/contact/all`, authHeaders); setMessages(r.data); } catch(e){} setLoading(false); };

  const approveHostelOwner  = async (id) => { try { await axios.patch(`${API_BASE_URL}/api/admin/hostel-owners/${id}/approve`,{},authHeaders); toast.success('Hostel owner approved'); fetchHostelOwners(); fetchStats(); } catch(e){toast.error('Failed to approve');} };
  const rejectHostelOwner   = (id) => askConfirm('Reject this hostel owner? Their registration will be removed.', async () => { try { await axios.delete(`${API_BASE_URL}/api/admin/hostel-owners/${id}/reject`,authHeaders); toast.success('Registration rejected'); fetchHostelOwners(); fetchStats(); } catch(e){toast.error('Failed to reject');} }, 'danger', 'Reject');
  const approveKitchenOwner = async (id) => { try { await axios.patch(`${API_BASE_URL}/api/admin/kitchen-owners/${id}/approve`,{},authHeaders); toast.success('Kitchen owner approved'); fetchKitchenOwners(); fetchStats(); } catch(e){toast.error('Failed to approve');} };
  const rejectKitchenOwner  = (id) => askConfirm('Reject this kitchen owner? Their registration will be removed.', async () => { try { await axios.delete(`${API_BASE_URL}/api/admin/kitchen-owners/${id}/reject`,authHeaders); toast.success('Registration rejected'); fetchKitchenOwners(); fetchStats(); } catch(e){toast.error('Failed to reject');} }, 'danger', 'Reject');

  const banUser   = (id, type) => askConfirm(`Ban this ${type}? They will no longer be able to log in.`, async () => { try { await axios.patch(`${API_BASE_URL}/api/admin/${type}s/${id}/ban`,{},authHeaders); toast.success('User banned'); if(type==='student') fetchStudents(); else if(type==='hostel-owner') fetchHostelOwners(); else fetchKitchenOwners(); } catch(e){toast.error('Failed to ban');} }, 'danger', 'Ban user');
  const unbanUser = (id, type) => askConfirm(`Unban this ${type}? They will regain access to their account.`, async () => { try { await axios.patch(`${API_BASE_URL}/api/admin/${type}s/${id}/unban`,{},authHeaders); toast.success('User unbanned'); if(type==='student') fetchStudents(); else if(type==='hostel-owner') fetchHostelOwners(); else fetchKitchenOwners(); } catch(e){toast.error('Failed to unban');} }, 'default', 'Unban');
  const deleteUser= (id, type) => askConfirm(`Permanently delete this ${type}? This cannot be undone.`, async () => { try { await axios.delete(`${API_BASE_URL}/api/admin/${type}s/${id}`,authHeaders); toast.success('User deleted'); if(type==='student') fetchStudents(); else if(type==='hostel-owner') fetchHostelOwners(); else fetchKitchenOwners(); fetchStats(); } catch(e){toast.error('Failed to delete');} }, 'danger', 'Delete permanently');
  const removeHostel  = (id) => askConfirm('Remove this hostel listing? Students will no longer see it.', async () => { try { await axios.delete(`${API_BASE_URL}/api/admin/hostels/${id}`,authHeaders); toast.success('Hostel removed'); fetchHostels(); fetchStats(); } catch(e){toast.error('Failed to remove');} }, 'danger', 'Remove hostel');
  const removeKitchen = (id) => askConfirm('Remove this kitchen listing? Students will no longer see it.', async () => { try { await axios.delete(`${API_BASE_URL}/api/admin/kitchens/${id}`,authHeaders); toast.success('Kitchen removed'); fetchKitchens(); fetchStats(); } catch(e){toast.error('Failed to remove');} }, 'danger', 'Remove kitchen');
  const updateMessageStatus = async (id, status) => { try { await axios.patch(`${API_BASE_URL}/api/contact/${id}/status`,{status},authHeaders); setMessages(prev=>prev.map(m=>m._id===id?{...m,status}:m)); } catch(e){toast.error('Failed to update message');} };
  const deleteMessage = (id) => askConfirm('Delete this message permanently?', async () => { try { await axios.delete(`${API_BASE_URL}/api/contact/${id}`,authHeaders); toast.success('Message deleted'); setMessages(prev=>prev.filter(m=>m._id!==id)); } catch(e){toast.error('Failed to delete message');} }, 'danger', 'Delete');
  const deleteMiniAdmin = (id, name) => askConfirm(`Remove admin "${name}"? They will lose dashboard access immediately.`, async () => { try { await axios.delete(`${API_BASE_URL}/api/admin/${id}/delete`,authHeaders); toast.success('Admin removed'); setMiniAdmins(prev=>prev.filter(a=>a._id!==id)); } catch(e){ toast.error(e.response?.data?.message||'Failed to delete admin'); } }, 'danger', 'Remove admin');

  const handleAddAdmin = async (e) => {
    e.preventDefault(); setRegError(''); setRegSuccess('');
    if(miniAdmins.length>=MAX_MINI_ADMINS){setRegError(`This account can have up to ${MAX_MINI_ADMINS} additional administrators.`);return;}
    if(regForm.password!==regForm.confirmPassword){setRegError('Passwords do not match.');return;}
    if(regForm.password.length<6){setRegError('Password must be at least 6 characters.');return;}
    setRegLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/admin/register`,{...regForm,role:'admin'},authHeaders);
      if (res.data.requiresVerification) {
        setPendingAdminEmail(regForm.email);
        setRegSuccess(res.data.message || `Verification code sent to ${regForm.email}.`);
      }
    }
    catch(err){setRegError(err.response?.data?.message||'Failed to create admin.');}
    setRegLoading(false);
  };

  const handleVerifyNewAdmin = async (e) => {
    e.preventDefault(); setRegError('');
    if (!newAdminOtp.trim()) { setRegError('Enter the verification code.'); return; }
    setVerifyLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/admin/verify-new-admin`, { email: pendingAdminEmail, otp: newAdminOtp }, authHeaders);
      toast.success(res.data.message || 'Admin created!');
      setShowAddAdmin(false); setPendingAdminEmail(''); setNewAdminOtp('');
      setRegForm({first_name:'',last_name:'',email:'',password:'',confirmPassword:''}); setRegSuccess('');
      fetchMiniAdmins();
    } catch(err){ setRegError(err.response?.data?.message||'Verification failed.'); }
    setVerifyLoading(false);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault(); setResetError(''); setResetSuccess('');
    if(resetForm.newPassword!==resetForm.confirmPassword){setResetError('Passwords do not match.');return;}
    if(resetForm.newPassword.length<6){setResetError('Password must be at least 6 characters.');return;}
    setResetLoading(true);
    try { await axios.patch(`${API_BASE_URL}/api/admin/${resetTarget._id}/reset-password`,{newPassword:resetForm.newPassword},authHeaders); setResetSuccess(`Password for "${resetTarget.name}" reset.`); setResetForm({newPassword:'',confirmPassword:''}); setTimeout(()=>{setResetTarget(null);setResetSuccess('');},2500); }
    catch(err){setResetError(err.response?.data?.message||'Failed.');}
    setResetLoading(false);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault(); setCpError(''); setCpSuccess('');
    if(cpForm.newPassword!==cpForm.confirmPassword){setCpError('New passwords do not match.');return;}
    if(cpForm.newPassword.length<6){setCpError('Min. 6 characters.');return;}
    if(cpForm.currentPassword===cpForm.newPassword){setCpError('New password must differ from current.');return;}
    setCpLoading(true);
    try { await axios.patch(`${API_BASE_URL}/api/admin/change-password`,{currentPassword:cpForm.currentPassword,newPassword:cpForm.newPassword,confirmPassword:cpForm.confirmPassword},authHeaders); setCpSuccess('Password changed! Logging you out...'); setCpForm({currentPassword:'',newPassword:'',confirmPassword:''}); setTimeout(()=>handleLogout(),3000); }
    catch(err){setCpError(err.response?.data?.message||'Failed.');}
    setCpLoading(false);
  };

  const handleUpdateProfilePicture = async (e) => {
    e.preventDefault(); setPpError('');
    setPpLoading(true);
    try {
      const res = await axios.patch(`${API_BASE_URL}/api/admin/profile-picture`, { profile_picture: ppInput }, authHeaders);
      const updatedAdmin = { ...adminData, profile_picture: res.data.admin.profile_picture };
      localStorage.setItem('adminData', JSON.stringify(updatedAdmin));
      setMyProfilePic(res.data.admin.profile_picture);
      toast.success('Profile picture updated!');
      setShowEditProfilePic(false);
    } catch(err){ setPpError(err.response?.data?.message||'Failed to update profile picture.'); }
    setPpLoading(false);
  };

  const handleLogout = () => { localStorage.removeItem('adminToken'); localStorage.removeItem('adminData'); navigate('/admin/login'); };

  const tabs = [
    { key:'overview',     label:'Overview',        icon:<FaChartBar />,    count: null },
    { key:'students',     label:'Students',        icon:<FaUsers />,       count: stats.totalStudents||0 },
    { key:'hostelOwners', label:'Hostel Owners',   icon:<FaHome />,        count: stats.pendingHostelOwners||0, urgent: (stats.pendingHostelOwners||0)>0 },
    { key:'kitchenOwners',label:'Kitchen Owners',  icon:<FaUtensils />,    count: stats.pendingKitchenOwners||0, urgent: (stats.pendingKitchenOwners||0)>0 },
    { key:'hostels',      label:'Hostels',         icon:<FaBuilding />,    count: stats.totalHostels||0 },
    { key:'kitchens',     label:'Kitchens',        icon:<FaList />,        count: stats.totalKitchens||0 },
    { key:'messages',     label:'Messages',        icon:<FaEnvelopeOpenText />, count: messages.filter(m=>m.status==='new').length, urgent: messages.filter(m=>m.status==='new').length>0 },
    ...(isSuperAdmin?[{ key:'admins', label:'Admins', icon:<FaUserShield />, count: miniAdmins.length }]:[]),
  ];

  const newMessageCount = messages.filter(m=>m.status==='new').length;

  const UserActions = ({ item, type }) => (
    <div className="flex gap-4 flex-wrap items-center">
      {type==='hostel-owner'&&!item.isApproved&&!item.isBanned&&<><Action onClick={()=>approveHostelOwner(item._id)} icon={<FaCheck/>} label="Approve" tone="go"/><Action onClick={()=>rejectHostelOwner(item._id)} icon={<FaTimes/>} label="Reject" tone="danger"/></>}
      {type==='kitchen-owner'&&!item.isApproved&&!item.isBanned&&<><Action onClick={()=>approveKitchenOwner(item._id)} icon={<FaCheck/>} label="Approve" tone="go"/><Action onClick={()=>rejectKitchenOwner(item._id)} icon={<FaTimes/>} label="Reject" tone="danger"/></>}
      {!item.isBanned&&(type==='student'||item.isApproved)&&<Action onClick={()=>banUser(item._id,type)} icon={<FaBan/>} label="Ban"/>}
      {item.isBanned&&<Action onClick={()=>unbanUser(item._id,type)} icon={<FaUnlock/>} label="Unban" tone="go"/>}
      <Action onClick={()=>deleteUser(item._id,type)} icon={<FaTrash/>} label="Delete" tone="danger"/>
    </div>
  );

  const filterRows = (rows, fields) => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter(r => fields.some(f => {
      const value = typeof f === 'function' ? f(r) : r[f];
      return String(value||'').toLowerCase().includes(q);
    }));
  };
  const ownerStatus = (owner) => owner.isBanned ? 'banned' : owner.isApproved ? 'approved active' : 'pending';
  // Surfaces the longest-waiting pending owners first so the 48h KYC target is actually achievable, not just claimed.
  const sortPendingFirst = (rows) => [...rows].sort((a,b) => {
    const aPending = !a.isApproved && !a.isBanned, bPending = !b.isApproved && !b.isBanned;
    if (aPending !== bPending) return aPending ? -1 : 1;
    return aPending ? new Date(a.createdAt||0) - new Date(b.createdAt||0) : 0;
  });
  const hostelTitle = (hostel) => hostel.hostelName || hostel.hostel_name;
  const hostelType = (hostel) => hostel.hostelType || hostel.hostel_type || 'Hostel';
  const hostelOwnerName = (hostel) => `${hostel.hostel_owner_id?.first_name || ''} ${hostel.hostel_owner_id?.last_name || ''}`;
  const hostelAddress = (hostel) => hostel.hostelAddress || hostel.hostel_address || hostel.address || hostel.location;
  const kitchenOwnerName = (kitchen) => `${kitchen.first_name || ''} ${kitchen.last_name || ''}`;
  const currentLabel = tabs.find(t=>t.key===activeTab)?.label || 'Overview';
  const sectionDescriptions = {
    overview: 'A current summary of users, services, and items awaiting review.',
    students: 'Search student accounts and manage access.',
    hostelOwners: 'Review applications and manage registered hostel providers.',
    kitchenOwners: 'Review applications and manage registered food providers.',
    hostels: 'View accommodation currently listed on the platform.',
    kitchens: 'View food services currently listed on the platform.',
    messages: 'Read and respond to enquiries submitted through the website.',
    admins: 'Manage staff accounts with access to this dashboard.',
  };
  const dateStr = new Date().toLocaleDateString('en-PK',{ weekday:'long', day:'numeric', month:'long', timeZone:'Asia/Karachi' });

  return (
    <div className="min-h-screen flex" style={{ background: ink.bg, color: ink.text, ...body }}>

      <aside className={`fixed inset-y-0 left-0 z-40 flex flex-col transition-all duration-200 ${sidebarOpen ? 'w-64' : 'w-0 md:w-64'} overflow-hidden md:sticky md:top-0 md:h-screen`}
        style={{ background: ink.side, borderRight: `1px solid ${ink.sideLine}` }}>

        <div className="flex items-center gap-2.5 px-5 h-16 flex-shrink-0" style={{ borderBottom: `1px solid ${ink.sideLine}` }}>
          <div className="w-8 h-8 flex items-center justify-center flex-shrink-0 overflow-hidden">
            <img src="/images/logo.png" alt="" className="w-full h-full object-contain"/>
          </div>
          <div className="min-w-0">
            <p style={{ ...sans, color: '#FFFFFF' }} className="font-semibold text-[15px] leading-tight tracking-tight truncate">SFS Administration</p>
            <p className="mt-0.5 text-[10px] uppercase tracking-[0.12em]" style={{ color: ink.sideFaint }}>Operations portal</p>
          </div>
          <button className="ml-auto md:hidden flex-shrink-0" style={{ color: ink.sideFaint }} onClick={()=>setSidebarOpen(false)}><FaTimes/></button>
        </div>

        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
          {tabs.map(({ key, label, icon, count, urgent }) => {
            const active = activeTab === key;
            return (
              <button key={key} onClick={() => { setActiveTab(key); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-lg text-left transition-colors duration-150 ${active ? '' : 'hover:bg-white/5'}`}
                style={{
                  background: active ? ink.sideActive : undefined,
                  color: active ? '#FFFFFF' : ink.sideText,
                }}>
                <span className="text-[15px] flex-shrink-0 w-5 text-center" style={{ color: active ? '#FFFFFF' : ink.sideFaint }}>{icon}</span>
                <span className="text-[14.5px] font-semibold flex-1 truncate">{label}</span>
                {count !== null && count > 0 && (
                  <span
                    className="text-[11px] font-bold px-2 py-0.5 rounded-full min-w-[22px] text-center"
                    style={{
                      ...body,
                      color: urgent ? '#3C3D37' : ink.sideText,
                      background: urgent ? '#ECDFCC' : 'rgba(255,255,255,0.10)',
                    }}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="px-3 py-3 flex-shrink-0" style={{ borderTop: `1px solid ${ink.sideLine}` }}>
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg mb-1" style={{ background: 'rgba(255,255,255,0.06)' }}>
            {myProfilePic ? (
              <img src={myProfilePic} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                onError={()=>setMyProfilePic('')}/>
            ) : (
              <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold" style={{ background: ink.brandLight, color: '#1B2B21' }}>
                {(adminData.email||'A')[0].toUpperCase()}
              </div>
            )}
            <p style={{ ...body, color: ink.sideText }} className="text-[12px] truncate flex-1">{adminData.email||'admin'}</p>
            <span style={{ background: 'rgba(255,255,255,0.12)', color: '#FFFFFF', ...body }} className="text-[9.5px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 uppercase">{isSuperAdmin?'Super admin':'Admin'}</span>
          </div>
          <button onClick={() => { setShowEditProfilePic(true); setPpError(''); setPpInput(myProfilePic); }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition hover:bg-white/5" style={{ color: ink.sideText }}>
            <FaCamera className="text-[12px] flex-shrink-0" style={{ color: ink.sideFaint }}/>
            <span className="text-[13.5px] font-medium">Edit profile picture</span>
          </button>
          <button onClick={() => { setShowChangePassword(true); setCpError(''); setCpSuccess(''); setCpForm({ currentPassword:'', newPassword:'', confirmPassword:'' }); }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition hover:bg-white/5" style={{ color: ink.sideText }}>
            <FaLock className="text-[12px] flex-shrink-0" style={{ color: ink.sideFaint }}/>
            <span className="text-[13.5px] font-medium">Change password</span>
          </button>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition hover:bg-white/5" style={{ color: '#D6C4B0' }}>
            <FaSignOutAlt className="text-[12px] flex-shrink-0"/>
            <span className="text-[13.5px] font-medium">Sign out</span>
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 z-30 md:hidden" style={{ background: 'rgba(26,26,26,0.4)' }} onClick={()=>setSidebarOpen(false)}/>}

      <div className="flex-1 flex flex-col min-w-0">

        <header className="sticky top-0 z-20 flex items-center justify-between gap-4 px-5 md:px-8 h-16" style={{ background: 'rgba(255,255,255,0.96)', borderBottom: `1px solid ${ink.line}`, backdropFilter: 'blur(8px)' }}>
          <div className="flex items-center gap-3 min-w-0">
            <button className="md:hidden flex-shrink-0" onClick={()=>setSidebarOpen(o=>!o)} style={{ color: ink.text }}><FaBars/></button>
            <h1 style={{ ...sans, color: ink.text }} className="text-[18px] md:text-[20px] font-semibold tracking-tight truncate">{currentLabel}</h1>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0" style={{ color: ink.sub }}>
            <FaCalendarAlt className="text-[13px]" style={{ color: ink.brand }}/>
            <span style={body} className="text-[12.5px] md:text-[13px] font-medium hidden sm:inline">{dateStr}</span>
          </div>
        </header>

        <main className="flex-1 p-5 md:p-8 overflow-auto">

          <div className="mb-6">
            <p className="text-[13px] leading-5" style={{ color: ink.sub }}>{sectionDescriptions[activeTab]}</p>
          </div>

          {activeTab === 'overview' && (
            <div>
              {(stats.pendingHostelOwners||0) + (stats.pendingKitchenOwners||0) + newMessageCount > 0 && (
                <button onClick={()=>setActiveTab((stats.pendingHostelOwners||0)>0 ? 'hostelOwners' : (stats.pendingKitchenOwners||0)>0 ? 'kitchenOwners' : 'messages')}
                  className="w-full flex items-center gap-3 px-5 py-3.5 rounded-xl mb-6 text-left transition hover:opacity-90" style={{ background: '#ECDFCC', border: '1px solid #D6C4B0' }}>
                  <FaBell className="text-[13px] flex-shrink-0" style={{ color: '#3C3D37' }}/>
                  <span style={{ ...body, color: '#3C3D37' }} className="text-[12.5px] font-semibold">
                    {(stats.pendingHostelOwners||0) + (stats.pendingKitchenOwners||0) + newMessageCount} item{((stats.pendingHostelOwners||0) + (stats.pendingKitchenOwners||0) + newMessageCount)!==1?'s':''} need attention
                  </span>
                  <FaChevronRight className="ml-auto text-[11px] flex-shrink-0" style={{ color: '#3C3D37' }}/>
                </button>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Students', value: stats.totalStudents||0, icon: <FaUsers/> },
                  { label: 'Hostel Owners', value: stats.totalHostelOwners||0, icon: <FaHome/> },
                  { label: 'Kitchen Owners', value: stats.totalKitchenOwners||0, icon: <FaUtensils/> },
                  { label: 'Hostels', value: stats.totalHostels||0, icon: <FaBuilding/> },
                  { label: 'Kitchens', value: stats.totalKitchens||0, icon: <FaList/> },
                  { label: 'Bookings', value: stats.totalBookings||0, icon: <FaCalendarCheck/> },
                  { label: 'Orders', value: stats.totalOrders||0, icon: <FaShoppingBag/> },
                ].map((s) => (
                  <div key={s.label} className="rounded-lg p-5 shadow-sm"
                    style={{ background: ink.surface, border: `1px solid ${ink.line}` }}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-[12px] font-medium" style={{ color: ink.sub }}>{s.label}</h3>
                        <p style={{ ...sans, color: ink.text }} className="mt-2 text-[28px] font-semibold leading-none tracking-tight">{s.value.toLocaleString()}</p>
                      </div>
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center text-[14px]" style={{ background: ink.brandDim, color: ink.brandDark }}>
                        {s.icon}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${ink.line}`, background: ink.surface, boxShadow: '0 1px 3px rgba(26,26,26,0.05)' }}>
                  <PanelHeader title="User growth" />
                  <div className="px-2 md:px-4 pt-4 pb-2">
                    <ResponsiveContainer width="100%" height={260}>
                      <LineChart data={growth} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                        <CartesianGrid vertical={false} stroke={ink.line} strokeDasharray="0" />
                        <XAxis dataKey="month" tick={{ fill: ink.sub, fontSize: 11.5 }} axisLine={{ stroke: ink.line }} tickLine={false} />
                        <YAxis allowDecimals={false} tick={{ fill: ink.sub, fontSize: 11.5 }} axisLine={false} tickLine={false} width={30} />
                        <Tooltip content={<GrowthTooltip />} />
                        <Legend wrapperStyle={{ fontSize: 12, color: ink.sub }} iconType="circle" iconSize={8} />
                        <Line type="monotone" dataKey="students" name="Students" stroke={series.blue} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 5, stroke: ink.surface, strokeWidth: 2 }} />
                        <Line type="monotone" dataKey="hostelOwners" name="Hostel Owners" stroke={series.orange} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 5, stroke: ink.surface, strokeWidth: 2 }} />
                        <Line type="monotone" dataKey="kitchenOwners" name="Kitchen Owners" stroke={series.aqua} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 5, stroke: ink.surface, strokeWidth: 2 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${ink.line}`, background: ink.surface, boxShadow: '0 1px 3px rgba(26,26,26,0.05)' }}>
                  <PanelHeader title="Bookings & orders" />
                  <div className="px-2 md:px-4 pt-4 pb-2">
                    <ResponsiveContainer width="100%" height={260}>
                      <LineChart data={growth} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                        <CartesianGrid vertical={false} stroke={ink.line} strokeDasharray="0" />
                        <XAxis dataKey="month" tick={{ fill: ink.sub, fontSize: 11.5 }} axisLine={{ stroke: ink.line }} tickLine={false} />
                        <YAxis allowDecimals={false} tick={{ fill: ink.sub, fontSize: 11.5 }} axisLine={false} tickLine={false} width={30} />
                        <Tooltip content={<GrowthTooltip />} />
                        <Legend wrapperStyle={{ fontSize: 12, color: ink.sub }} iconType="circle" iconSize={8} />
                        <Line type="monotone" dataKey="bookings" name="Bookings" stroke={series.blue} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 5, stroke: ink.surface, strokeWidth: 2 }} />
                        <Line type="monotone" dataKey="orders" name="Orders" stroke={series.orange} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 5, stroke: ink.surface, strokeWidth: 2 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {((stats.pendingHostelOwners||0) + (stats.pendingKitchenOwners||0) + newMessageCount) > 0 ? (
                <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${ink.line}`, background: ink.surface, boxShadow: '0 1px 3px rgba(26,26,26,0.05)' }}>
                  <PanelHeader title="Needs your attention" />
                  <div>
                    {(stats.pendingHostelOwners||0) > 0 && (
                      <button onClick={()=>setActiveTab('hostelOwners')} className="w-full flex items-center justify-between px-6 py-4 transition text-left hover:bg-black/[0.02]" style={{ borderBottom: `1px solid ${ink.lineSoft}` }}>
                        <div className="flex items-center gap-3">
                          <FaHome style={{ color: '#8A6D3B' }} className="text-sm"/>
                          <span className="text-[13.5px] font-medium">{stats.pendingHostelOwners} hostel owner{stats.pendingHostelOwners!==1?'s':''} awaiting approval</span>
                          {(stats.overdueHostelOwners||0) > 0 && (
                            <span className="text-[10.5px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full" style={{ background:'#F8D7DA', color:'#842029' }}>
                              {stats.overdueHostelOwners} over 48h
                            </span>
                          )}
                        </div>
                        <FaChevronRight className="text-[11px]" style={{ color: ink.faint }}/>
                      </button>
                    )}
                    {(stats.pendingKitchenOwners||0) > 0 && (
                      <button onClick={()=>setActiveTab('kitchenOwners')} className="w-full flex items-center justify-between px-6 py-4 transition text-left hover:bg-black/[0.02]" style={{ borderBottom: `1px solid ${ink.lineSoft}` }}>
                        <div className="flex items-center gap-3">
                          <FaUtensils style={{ color: '#8A6D3B' }} className="text-sm"/>
                          <span className="text-[13.5px] font-medium">{stats.pendingKitchenOwners} kitchen owner{stats.pendingKitchenOwners!==1?'s':''} awaiting approval</span>
                          {(stats.overdueKitchenOwners||0) > 0 && (
                            <span className="text-[10.5px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full" style={{ background:'#F8D7DA', color:'#842029' }}>
                              {stats.overdueKitchenOwners} over 48h
                            </span>
                          )}
                        </div>
                        <FaChevronRight className="text-[11px]" style={{ color: ink.faint }}/>
                      </button>
                    )}
                    {newMessageCount > 0 && (
                      <button onClick={()=>setActiveTab('messages')} className="w-full flex items-center justify-between px-6 py-4 transition text-left hover:bg-black/[0.02]">
                        <div className="flex items-center gap-3">
                          <FaEnvelopeOpenText style={{ color: '#8A6D3B' }} className="text-sm"/>
                          <span className="text-[13.5px] font-medium">{newMessageCount} unread contact message{newMessageCount!==1?'s':''}</span>
                        </div>
                        <FaChevronRight className="text-[11px]" style={{ color: ink.faint }}/>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl py-12 px-6 flex flex-col items-center justify-center text-center gap-2" style={{ border: `1px solid ${ink.line}`, background: ink.brandDim }}>
                  <FaCheckCircle className="text-2xl" style={{ color: ink.brand }}/>
                  <p style={{ ...body, color: ink.brandDark }} className="text-[13.5px] font-semibold">Queue is clear</p>
                  <p style={{ color: ink.sub }} className="text-[12px]">Nothing needs your attention right now.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'students' && (
            <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${ink.line}`, background: ink.surface, boxShadow: '0 1px 3px rgba(26,26,26,0.05)' }}>
              <PanelHeader count={students.length}
                action={
                  <TableFilter value={search} onChange={setSearch} placeholder="Filter by name or email..." />
                } />
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead style={{ background: ink.panel }}><tr>{['ID','Name','Email','Phone','Status',''].map(h=><th key={h} className={thCls} style={{ borderBottom: `1px solid ${ink.line}`, color: ink.sub }}>{h}</th>)}</tr></thead>
                  {loading ? <LoadingRows cols={6}/> : (
                    <tbody>
                      {(() => { const rows = filterRows(students, ['first_name','last_name','email']); return rows.length===0 ? <EmptyRow cols={6} message="No matching students"/> : rows.map((s,i)=>(
                        <tr key={s._id} className={`transition-colors duration-150 ${i%2===1 ? 'bg-[#F5F7F1]' : ''} hover:bg-[#EBEFE6]`} style={{ borderBottom: `1px solid ${ink.lineSoft}` }}>
                          <td className={tdCls} style={{ ...body, color: ink.faint }}>{s.student_id}</td>
                          <td className={tdCls}><span className="flex items-center gap-3"><Avatar name={s.first_name} src={s.profile_picture}/><span className="font-semibold" style={{ color: ink.text }}>{s.first_name} {s.last_name}</span></span></td>
                          <td className={tdCls} style={{ color: ink.sub }}>{s.email}</td>
                          <td className={tdCls} style={{ color: ink.sub, ...body }}>{s.phone_number}</td>
                          <td className={tdCls}><StatusPill status={s.isBanned?'banned':'active'}/></td>
                          <td className="px-5 py-3"><UserActions item={s} type="student"/></td>
                        </tr>
                      )); })()}
                    </tbody>
                  )}
                </table>
              </div>
            </div>
          )}

          {activeTab === 'hostelOwners' && (
            <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${ink.line}`, background: ink.surface, boxShadow: '0 1px 3px rgba(26,26,26,0.05)' }}>
              <PanelHeader count={hostelOwners.length}
                action={
                  <TableFilter value={search} onChange={setSearch} placeholder="Filter by owner, hostel, email, status..." />
                } />
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead style={{ background: ink.panel }}><tr>{['ID','Name','Hostel','Email','Status',''].map(h=><th key={h} className={thCls} style={{ borderBottom: `1px solid ${ink.line}`, color: ink.sub }}>{h}</th>)}</tr></thead>
                  {loading ? <LoadingRows cols={6}/> : (
                    <tbody>
                      {(() => { const rows = sortPendingFirst(filterRows(hostelOwners, ['owner_id','first_name','last_name','email','hostel_name',ownerStatus])); return rows.length===0 ? <EmptyRow cols={6} message="No matching hostel owners"/> : rows.map((o,i)=>(
                        <tr key={o._id} className={`transition-colors duration-150 ${i%2===1 ? 'bg-[#F5F7F1]' : ''} hover:bg-[#EBEFE6]`} style={{ borderBottom: `1px solid ${ink.lineSoft}` }}>
                          <td className={tdCls} style={{ ...body, color: ink.faint }}>{o.owner_id}</td>
                          <td className={tdCls}><span className="flex items-center gap-3"><Avatar name={o.first_name} src={o.profile_picture}/><span className="font-semibold" style={{ color: ink.text }}>{o.first_name} {o.last_name}</span></span></td>
                          <td className={tdCls} style={{ color: ink.brandDark, fontWeight: 600 }}>{o.hostel_name}</td>
                          <td className={tdCls} style={{ color: ink.sub }}>{o.email}</td>
                          <td className={tdCls}><span className="flex items-center gap-2 flex-wrap"><StatusPill status={o.isBanned?'banned':o.isApproved?'approved':'pending'}/>{!o.isApproved && !o.isBanned && <PendingAge createdAt={o.createdAt}/>}</span></td>
                          <td className="px-5 py-3"><UserActions item={o} type="hostel-owner"/></td>
                        </tr>
                      )); })()}
                    </tbody>
                  )}
                </table>
              </div>
            </div>
          )}

          {activeTab === 'kitchenOwners' && (
            <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${ink.line}`, background: ink.surface, boxShadow: '0 1px 3px rgba(26,26,26,0.05)' }}>
              <PanelHeader count={kitchenOwners.length}
                action={
                  <TableFilter value={search} onChange={setSearch} placeholder="Filter by owner, kitchen, email, status..." />
                } />
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead style={{ background: ink.panel }}><tr>{['ID','Name','Kitchen','Email','Status',''].map(h=><th key={h} className={thCls} style={{ borderBottom: `1px solid ${ink.line}`, color: ink.sub }}>{h}</th>)}</tr></thead>
                  {loading ? <LoadingRows cols={6}/> : (
                    <tbody>
                      {(() => { const rows = sortPendingFirst(filterRows(kitchenOwners, ['provider_id','first_name','last_name','email','kitchen_name',ownerStatus])); return rows.length===0 ? <EmptyRow cols={6} message="No matching kitchen owners"/> : rows.map((o,i)=>(
                        <tr key={o._id} className={`transition-colors duration-150 ${i%2===1 ? 'bg-[#F5F7F1]' : ''} hover:bg-[#EBEFE6]`} style={{ borderBottom: `1px solid ${ink.lineSoft}` }}>
                          <td className={tdCls} style={{ ...body, color: ink.faint }}>{o.provider_id}</td>
                          <td className={tdCls}><span className="flex items-center gap-3"><Avatar name={o.first_name} src={o.profile_picture}/><span className="font-semibold" style={{ color: ink.text }}>{o.first_name} {o.last_name}</span></span></td>
                          <td className={tdCls} style={{ color: ink.brandDark, fontWeight: 600 }}>{o.kitchen_name}</td>
                          <td className={tdCls} style={{ color: ink.sub }}>{o.email}</td>
                          <td className={tdCls}><span className="flex items-center gap-2 flex-wrap"><StatusPill status={o.isBanned?'banned':o.isApproved?'approved':'pending'}/>{!o.isApproved && !o.isBanned && <PendingAge createdAt={o.createdAt}/>}</span></td>
                          <td className="px-5 py-3"><UserActions item={o} type="kitchen-owner"/></td>
                        </tr>
                      )); })()}
                    </tbody>
                  )}
                </table>
              </div>
            </div>
          )}

          {activeTab === 'hostels' && (
            <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${ink.line}`, background: ink.surface, boxShadow: '0 1px 3px rgba(26,26,26,0.05)' }}>
              <PanelHeader count={hostels.length}
                action={
                  <TableFilter value={search} onChange={setSearch} placeholder="Filter by hostel, owner, type, location..." />
                } />
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
                  {Array(6).fill(0).map((_,i)=><div key={i} className="h-52 rounded-xl animate-pulse" style={{ background: ink.panel }}/>)}
                </div>
              ) : hostels.length === 0 ? (
                <div className="text-center py-20" style={{ color: ink.faint }}><FaBoxOpen className="mx-auto text-2xl mb-3 opacity-30"/><p className="text-sm" style={body}>No hostels listed</p></div>
              ) : (
                (() => {
                  const rows = filterRows(hostels, [hostelTitle, hostelType, hostelOwnerName, hostelAddress]);
                  return rows.length === 0 ? (
                    <div className="text-center py-20" style={{ color: ink.faint }}><FaBoxOpen className="mx-auto text-2xl mb-3 opacity-30"/><p className="text-sm" style={body}>No matching hostels</p></div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
                      {rows.map(h=>(
                        <div key={h._id} role="button" tabIndex={0} aria-label={`View details for ${hostelTitle(h)}`} onClick={()=>setSelectedListing({type:'hostel',data:h})} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setSelectedListing({type:'hostel',data:h});}}} className="rounded-xl p-4 cursor-pointer focus:outline-none focus:ring-2 transition-all duration-150 hover:-translate-y-0.5 shadow-sm hover:shadow-md" style={{ background: ink.surface, border: `1px solid ${ink.line}`, '--tw-ring-color': ink.brandLight }}>
                          <div className="relative h-32 rounded-lg overflow-hidden mb-3" style={{ background: ink.panel }}>
                            <img src={h.hostelPicture||h.hostel_picture||'/images/hostel.jpg'} alt={hostelTitle(h)} className="w-full h-full object-cover" onError={e=>{e.target.style.display='none'}}/>
                          </div>
                          <p style={{ ...body, color: ink.brand }} className="text-[10px] font-bold uppercase tracking-wider mb-1" >{hostelType(h)}</p>
                          <h3 className="font-bold text-[15px] leading-tight mb-1" style={{ color: ink.text }}>{hostelTitle(h)}</h3>
                          <p className="text-[12px] mb-4" style={{ color: ink.faint }}>{hostelOwnerName(h)}</p>
                          <div onClick={e=>e.stopPropagation()} onKeyDown={e=>e.stopPropagation()}><Action onClick={()=>removeHostel(h._id)} icon={<FaTrash/>} label="Remove" tone="danger"/></div>
                        </div>
                      ))}
                    </div>
                  );
                })()
              )}
            </div>
          )}

          {activeTab === 'kitchens' && (
            <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${ink.line}`, background: ink.surface, boxShadow: '0 1px 3px rgba(26,26,26,0.05)' }}>
              <PanelHeader count={kitchens.length}
                action={
                  <TableFilter value={search} onChange={setSearch} placeholder="Filter by kitchen, owner, description..." />
                } />
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
                  {Array(6).fill(0).map((_,i)=><div key={i} className="h-52 rounded-xl animate-pulse" style={{ background: ink.panel }}/>)}
                </div>
              ) : kitchens.length === 0 ? (
                <div className="text-center py-20" style={{ color: ink.faint }}><FaBoxOpen className="mx-auto text-2xl mb-3 opacity-30"/><p className="text-sm" style={body}>No kitchens listed</p></div>
              ) : (
                (() => {
                  const rows = filterRows(kitchens, ['kitchen_name','kitchen_description',kitchenOwnerName]);
                  return rows.length === 0 ? (
                    <div className="text-center py-20" style={{ color: ink.faint }}><FaBoxOpen className="mx-auto text-2xl mb-3 opacity-30"/><p className="text-sm" style={body}>No matching kitchens</p></div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
                      {rows.map(k=>(
                        <div key={k._id} role="button" tabIndex={0} aria-label={`View details for ${k.kitchen_name}`} onClick={()=>setSelectedListing({type:'kitchen',data:k})} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setSelectedListing({type:'kitchen',data:k});}}} className="rounded-xl p-4 cursor-pointer focus:outline-none focus:ring-2 transition-all duration-150 hover:-translate-y-0.5 shadow-sm hover:shadow-md" style={{ background: ink.surface, border: `1px solid ${ink.line}`, '--tw-ring-color': ink.brandLight }}>
                          <div className="relative h-32 rounded-lg overflow-hidden mb-3" style={{ background: ink.panel }}>
                            <img src={k.kitchen_picture||'/images/kitchens.png'} alt={k.kitchen_name} className="w-full h-full object-cover" onError={e=>{e.target.style.display='none'}}/>
                          </div>
                          <h3 className="font-bold text-[15px] leading-tight mb-1" style={{ color: ink.text }}>{k.kitchen_name}</h3>
                          <p className="text-[12px] mb-4 line-clamp-2" style={{ color: ink.faint }}>{k.kitchen_description}</p>
                          <div onClick={e=>e.stopPropagation()} onKeyDown={e=>e.stopPropagation()}><Action onClick={()=>removeKitchen(k._id)} icon={<FaTrash/>} label="Remove" tone="danger"/></div>
                        </div>
                      ))}
                    </div>
                  );
                })()
              )}
            </div>
          )}

          {activeTab === 'messages' && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <p style={{ ...body, color: ink.faint }} className="text-[12.5px]">Contact Us submissions</p>
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium" style={{ color: ink.text }}>Filter by Subject:</label>
                  <select
                    value={subjectFilter}
                    onChange={(e) => setSubjectFilter(e.target.value)}
                    style={{ ...inputStyle }}
                    className="px-3 py-2 rounded-lg text-sm"
                  >
                    <option value="">All Subjects</option>
                    {[...new Set(messages.map(m => m.subject || 'General Inquiry'))].sort().map(subject => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </select>
                </div>
              </div>

              {loading ? (
                <div className="space-y-2">{Array(4).fill(0).map((_,i)=><div key={i} className="h-24 rounded-xl animate-pulse" style={{ background: ink.surface, border: `1px solid ${ink.line}` }}/>)}</div>
              ) : messages.length === 0 ? (
                <div className="rounded-xl text-center py-20" style={{ border: `1px solid ${ink.line}`, background: ink.surface, color: ink.faint }}>
                  <FaBoxOpen className="mx-auto text-2xl mb-3 opacity-30"/><p className="text-sm" style={body}>No messages yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.filter(m => subjectFilter === '' || (m.subject || 'General Inquiry') === subjectFilter).map(m => {
                    const digitsOnly = (m.phone || '').replace(/\D/g, '');
                    const whatsappNumber = digitsOnly.startsWith('92') ? digitsOnly : digitsOnly.startsWith('0') ? '92' + digitsOnly.slice(1) : digitsOnly;
                    const whatsappText = encodeURIComponent(`Hi ${m.name}, this is the SFS support team replying to your message about "${m.subject || 'your inquiry'}".`);
                    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappText}`;
                    const gmailSubject = encodeURIComponent(`Re: ${m.subject || 'Your message to SFS'}`);
                    const gmailBody = encodeURIComponent(`Hi ${m.name},\n\nThank you for reaching out about "${m.subject || 'your inquiry'}".\n\n`);
                    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${m.email}&su=${gmailSubject}&body=${gmailBody}`;

                    return (
                    <div key={m._id} className="rounded-xl p-5" style={{ background: ink.surface, border: `1px solid ${m.status==='new' ? '#D6C4B0' : ink.line}`, boxShadow: '0 1px 3px rgba(26,26,26,0.05)' }}>
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold flex-shrink-0" style={{ background: ink.brandDim, color: ink.brandDark }}>
                            {(m.name||'?')[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-[14px]" style={{ color: ink.text }}>{m.name}</p>
                            {m.userRole && (
                              <p className="text-[11px] mb-1" style={{ color: ink.faint }}>
                                Registered {m.userRole.replace(/([A-Z])/g, ' $1').trim()}
                                {m.userId ? ` • ${m.userId}` : ''}
                              </p>
                            )}
                            <p style={{ ...body, color: ink.faint }} className="text-[11px]">{new Date(m.createdAt).toLocaleString('en-PK',{ timeZone:'Asia/Karachi', dateStyle:'medium', timeStyle:'short' })}</p>
                          </div>
                        </div>
                        <StatusPill status={m.status}/>
                      </div>

                      <div className="mb-3">
                        <Pill tone="neutral">{m.subject || 'General Inquiry'}</Pill>
                      </div>

                      <div className="flex flex-wrap gap-x-5 gap-y-1 mb-3 text-[12px]" style={{ color: ink.sub, ...body }}>
                        <a href={`mailto:${m.email}`} className="flex items-center gap-1.5 transition hover:opacity-70"><FaEnvelope className="text-[10px]"/>{m.email}</a>
                        <a href={`tel:${m.phone}`} className="flex items-center gap-1.5 transition hover:opacity-70"><FaPhone className="text-[10px]"/>{m.phone}</a>
                        {!m.emailSent && <span className="flex items-center gap-1.5" style={{ color: '#8A6D3B' }}><FaExclamationTriangle className="text-[10px]"/>Notify email failed</span>}
                      </div>

                      <p className="text-[13.5px] rounded-lg p-3.5 mb-4 leading-relaxed whitespace-pre-wrap" style={{ background: ink.panel, color: ink.sub, border: `1px solid ${ink.lineSoft}` }}>{m.message}</p>

                      <div className="flex gap-2 flex-wrap items-center">
                        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[12px] font-semibold transition hover:opacity-80 px-2.5 py-1.5 rounded-lg" style={{ background: ink.brandDim, color: ink.brandDark }}>
                          <FaWhatsapp className="text-[12px]"/>Reply on WhatsApp
                        </a>
                        <a href={gmailUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[12px] font-semibold transition hover:opacity-80 px-2.5 py-1.5 rounded-lg" style={{ background: ink.panel, color: ink.sub }}>
                          <FaReply className="text-[11px]"/>Reply via Gmail
                        </a>
                        {m.status!=='read' && m.status!=='resolved' && <Action onClick={()=>updateMessageStatus(m._id,'read')} icon={<FaEnvelopeOpenText/>} label="Mark read"/>}
                        {m.status!=='resolved' && <Action onClick={()=>updateMessageStatus(m._id,'resolved')} icon={<FaCheckDouble/>} label="Resolve" tone="go"/>}
                        <Action onClick={()=>deleteMessage(m._id)} icon={<FaTrash/>} label="Delete" tone="danger"/>
                      </div>
                    </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'admins' && isSuperAdmin && (
            <div className="space-y-4">
              <p style={{ ...body, color: ink.faint }} className="text-[12.5px] -mt-1 mb-1">Manage administrator accounts and dashboard access.</p>

              <div className="rounded-xl p-5 flex items-center gap-4" style={{ background: ink.surface, border: `1px solid ${miniAdmins.length>=MAX_MINI_ADMINS ? '#3C3D37' : ink.line}`, boxShadow: '0 1px 3px rgba(26,26,26,0.05)' }}>
                <div className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: miniAdmins.length>=MAX_MINI_ADMINS ? '#E4E4E1' : ink.brandDim }}>
                  <FaUserShield style={{ color: miniAdmins.length>=MAX_MINI_ADMINS ? ink.rust : ink.brand }}/>
                </div>
                <div className="flex-1">
                  <h3 style={{ ...body, color: ink.text  }} className="text-[14px] font-bold" >{miniAdmins.length} of {MAX_MINI_ADMINS} administrator accounts in use</h3>
                  <p className="text-[12px] mt-0.5" style={{ color: ink.faint }}>
                    {miniAdmins.length>=MAX_MINI_ADMINS ? 'Limit reached — remove one to add another.' : `${MAX_MINI_ADMINS-miniAdmins.length} slot${MAX_MINI_ADMINS-miniAdmins.length!==1?'s':''} remaining`}
                  </p>
                </div>
                {miniAdmins.length<MAX_MINI_ADMINS && (
                  <button onClick={()=>{setShowAddAdmin(true);setRegError('');setRegSuccess('');}}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-semibold transition hover:opacity-90" style={{ background: ink.brand, color: ink.onBrand }}>
                    <FaUserPlus className="text-[11px]"/>Add admin
                  </button>
                )}
              </div>

              <div className="rounded-xl p-4 flex items-start gap-3" style={{ background: '#ECDFCC', border: '1px solid #D6C4B0' }}>
                <FaExclamationTriangle className="mt-0.5 flex-shrink-0 text-[13px]" style={{ color: '#8A6D3B' }}/>
                <p className="text-[12.5px] leading-relaxed" style={{ color: '#8A6D3B' }}>
                  A super admin account is created once via <code style={{ ...body, background: 'rgba(0,0,0,0.06)' }} className="px-1.5 py-0.5 rounded text-[11.5px]">POST /api/admin/register</code> before any admin exists (see <code style={{ ...body, background: 'rgba(0,0,0,0.06)' }} className="px-1.5 py-0.5 rounded text-[11.5px]">DEPLOYMENT_GUIDE.md</code>).
                  Only additional administrator accounts can be managed here. The primary administrator account cannot be removed.
                </p>
              </div>

              {showAddAdmin && (
                <div className="rounded-xl p-6" style={{ background: ink.surface, border: `1px solid ${ink.line}`, boxShadow: '0 1px 3px rgba(26,26,26,0.05)' }}>
                  <div className="flex items-center justify-between mb-5">
                    <h2 style={sans} className="font-bold text-[15px] flex items-center gap-2"><FaUserPlus style={{color:ink.brand}}/>{pendingAdminEmail ? 'Verify email address' : 'Add administrator'}</h2>
                    <button onClick={()=>{setShowAddAdmin(false);setPendingAdminEmail('');setNewAdminOtp('');setRegSuccess('');}} style={{ color: ink.faint }}><FaTimes/></button>
                  </div>
                  {pendingAdminEmail ? (
                    <form onSubmit={handleVerifyNewAdmin} className="space-y-4">
                      <p className="text-[12.5px]" style={{ color: ink.sub }}>A verification code was sent to <strong>{pendingAdminEmail}</strong>. Enter it below to confirm this is a real, reachable email and activate the account.</p>
                      <FormField label="Verification code" type="text" required value={newAdminOtp} onChange={e=>setNewAdminOtp(e.target.value)} placeholder="6-digit code"/>
                      {regError && <div className="p-3 rounded-lg text-[12.5px]" style={{ background: '#8F3B28', color: '#FFFFFF' }}>{regError}</div>}
                      <div className="flex gap-3 pt-1">
                        <PrimaryBtn type="submit" disabled={verifyLoading}>{verifyLoading?'Verifying…':'Confirm & activate'}</PrimaryBtn>
                        <GhostBtn type="button" onClick={()=>{setPendingAdminEmail('');setRegSuccess('');setRegError('');}}>Back</GhostBtn>
                      </div>
                    </form>
                  ) : (
                    <form onSubmit={handleAddAdmin} className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <FormField label="First name" type="text" required value={regForm.first_name} onChange={e=>setRegForm({...regForm,first_name:e.target.value})} placeholder="Ali"/>
                        <FormField label="Last name" type="text" required value={regForm.last_name} onChange={e=>setRegForm({...regForm,last_name:e.target.value})} placeholder="Khan"/>
                      </div>
                      <FormField label="Email" type="email" required value={regForm.email} onChange={e=>setRegForm({...regForm,email:e.target.value})} placeholder="admin@sfs.com"/>
                      <div className="grid grid-cols-2 gap-3">
                        <FormField label="Password" type="password" required value={regForm.password} onChange={e=>setRegForm({...regForm,password:e.target.value})} placeholder="Min. 6 chars"/>
                        <FormField label="Confirm" type="password" required value={regForm.confirmPassword} onChange={e=>setRegForm({...regForm,confirmPassword:e.target.value})} placeholder="Repeat"/>
                      </div>
                      {regError && <div className="p-3 rounded-lg text-[12.5px]" style={{ background: '#8F3B28', color: '#FFFFFF' }}>{regError}</div>}
                      {regSuccess && <div className="p-3 rounded-lg text-[12.5px]" style={{ background: ink.brandDim, border: `1px solid ${ink.line}`, color: ink.brandDark }}>{regSuccess}</div>}
                      <div className="flex gap-3 pt-1">
                        <PrimaryBtn type="submit" disabled={regLoading}>{regLoading?'Sending code…':'Create admin'}</PrimaryBtn>
                        <GhostBtn type="button" onClick={()=>setShowAddAdmin(false)}>Cancel</GhostBtn>
                      </div>
                    </form>
                  )}
                </div>
              )}

              <div className="rounded-xl overflow-hidden" style={{ background: ink.surface, border: `1px solid ${ink.line}`, boxShadow: '0 1px 3px rgba(26,26,26,0.05)' }}>
                <PanelHeader title="Administrators" count={miniAdmins.length}/>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead style={{ background: ink.panel }}><tr>{['Name','Email','Role',''].map(h=><th key={h} className={thCls} style={{ borderBottom: `1px solid ${ink.line}`, color: ink.sub }}>{h}</th>)}</tr></thead>
                    <tbody>
                      {miniAdmins.length===0 ? <EmptyRow cols={4} message="No additional administrators have been added"/> : miniAdmins.map((a,i)=>(
                        <tr key={a._id} className={`transition-colors duration-150 ${i%2===1 ? 'bg-[#F5F7F1]' : ''} hover:bg-[#EBEFE6]`} style={{ borderBottom: `1px solid ${ink.lineSoft}` }}>
                          <td className={tdCls}><span className="flex items-center gap-3"><Avatar name={a.first_name} src={a.profile_picture}/><span className="font-semibold" style={{ color: ink.text }}>{a.first_name} {a.last_name}</span></span></td>
                          <td className={tdCls} style={{ color: ink.sub }}><span className="flex items-center gap-2"><Avatar name={a.email} size="sm"/>{a.email}</span></td>
                          <td className={tdCls}><Pill tone="neutral">Admin</Pill></td>
                          <td className="px-5 py-3">
                            <div className="flex gap-2">
                              <Action onClick={()=>{setResetTarget({_id:a._id,name:`${a.first_name} ${a.last_name}`});setResetForm({newPassword:'',confirmPassword:''});setResetError('');setResetSuccess('');}} icon={<FaKey/>} label="Reset password"/>
                              <Action onClick={()=>deleteMiniAdmin(a._id,`${a.first_name} ${a.last_name}`)} icon={<FaTrash/>} label="Remove" tone="danger"/>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>

        <footer className="px-5 md:px-8 py-5" style={{ background: ink.surface, borderTop: `1px solid ${ink.line}` }}>
          <div className="flex flex-col gap-2 text-[11.5px] sm:flex-row sm:items-center sm:justify-between" style={{ color: ink.faint }}>
            <p>© {new Date().getFullYear()} Student Facility System</p>
            <div className="flex items-center gap-4">
              <a href="/" className="font-medium hover:underline" style={{ color: ink.sub }}>Open public website</a>
              <a href="mailto:aqibawan0102@gmail.com" className="font-medium hover:underline" style={{ color: ink.sub }}>Technical support</a>
            </div>
          </div>
        </footer>
      </div>

      {showChangePassword && (
        <Modal onClose={()=>setShowChangePassword(false)} title="Change my password" icon={<FaLock style={{color:ink.brand, fontSize: 13}}/>}>
          <p className="text-[12px] mb-4" style={{ color: ink.faint }}>Logged in as <span style={{ color: ink.text, fontWeight: 600 }}>{adminData.email}</span></p>
          <form onSubmit={handleChangePassword} className="space-y-3">
            <FormField label="Current password" type="password" required value={cpForm.currentPassword} onChange={e=>setCpForm({...cpForm,currentPassword:e.target.value})} placeholder="Your current password"/>
            <FormField label="New password" type="password" required value={cpForm.newPassword} onChange={e=>setCpForm({...cpForm,newPassword:e.target.value})} placeholder="Min. 6 characters"/>
            <FormField label="Confirm new password" type="password" required value={cpForm.confirmPassword} onChange={e=>setCpForm({...cpForm,confirmPassword:e.target.value})} placeholder="Repeat new password"/>
            {cpError && <div className="p-3 rounded-lg text-[12.5px]" style={{ background: '#8F3B28', color: '#FFFFFF' }}>{cpError}</div>}
            {cpSuccess && <div className="p-3 rounded-lg text-[12.5px]" style={{ background: ink.brandDim, border: `1px solid ${ink.line}`, color: ink.brandDark }}>{cpSuccess}<p className="mt-1 opacity-70">Signing out in 3 seconds…</p></div>}
            <div className="flex gap-3 pt-1">
              <PrimaryBtn type="submit" disabled={cpLoading||!!cpSuccess}>{cpLoading?'Changing…':'Change password'}</PrimaryBtn>
              <GhostBtn type="button" onClick={()=>setShowChangePassword(false)}>Cancel</GhostBtn>
            </div>
          </form>
        </Modal>
      )}

      {showEditProfilePic && (
        <Modal onClose={()=>setShowEditProfilePic(false)} title="Edit profile picture" icon={<FaCamera style={{color:ink.brand, fontSize: 13}}/>}>
          <p className="text-[12px] mb-4" style={{ color: ink.faint }}>Logged in as <span style={{ color: ink.text, fontWeight: 600 }}>{adminData.email}</span></p>
          <form onSubmit={handleUpdateProfilePicture} className="space-y-3">
            <ImageUploadField label="Profile picture" name="admin_profile_picture" value={ppInput} onChange={setPpInput} uploadType="profile" darkMode={false}/>
            {ppError && <div className="p-3 rounded-lg text-[12.5px]" style={{ background: '#8F3B28', color: '#FFFFFF' }}>{ppError}</div>}
            <div className="flex gap-3 pt-1">
              <PrimaryBtn type="submit" disabled={ppLoading}>{ppLoading?'Saving…':'Save picture'}</PrimaryBtn>
              <GhostBtn type="button" onClick={()=>setShowEditProfilePic(false)}>Cancel</GhostBtn>
            </div>
          </form>
        </Modal>
      )}

      {resetTarget && (
        <Modal onClose={()=>setResetTarget(null)} title="Reset password" icon={<FaKey style={{color:'#8A6D3B', fontSize: 13}}/>}>
          <p className="text-[12.5px] mb-4" style={{ color: ink.faint }}>Setting new password for <span style={{ color: ink.text, fontWeight: 600 }}>{resetTarget.name}</span></p>
          <form onSubmit={handleResetPassword} className="space-y-3">
            <FormField label="New password" type="password" required value={resetForm.newPassword} onChange={e=>setResetForm({...resetForm,newPassword:e.target.value})} placeholder="Min. 6 characters"/>
            <FormField label="Confirm new password" type="password" required value={resetForm.confirmPassword} onChange={e=>setResetForm({...resetForm,confirmPassword:e.target.value})} placeholder="Repeat new password"/>
            {resetError && <div className="p-3 rounded-lg text-[12.5px]" style={{ background: '#8F3B28', color: '#FFFFFF' }}>{resetError}</div>}
            {resetSuccess && <div className="p-3 rounded-lg text-[12.5px]" style={{ background: ink.brandDim, border: `1px solid ${ink.line}`, color: ink.brandDark }}>{resetSuccess}</div>}
            <div className="flex gap-3 pt-1">
              <PrimaryBtn type="submit" disabled={resetLoading}>{resetLoading?'Resetting…':'Reset password'}</PrimaryBtn>
              <GhostBtn type="button" onClick={()=>setResetTarget(null)}>Cancel</GhostBtn>
            </div>
          </form>
        </Modal>
      )}

      <ListingDetails listing={selectedListing} onClose={()=>setSelectedListing(null)}/>
      <ConfirmDialog box={confirmBox} onClose={()=>setConfirmBox(null)}/>
    </div>
  );
};

export default AdminDashboard;
