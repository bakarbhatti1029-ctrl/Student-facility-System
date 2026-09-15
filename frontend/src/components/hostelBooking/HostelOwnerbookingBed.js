import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FaBed, FaCheckCircle, FaSearch, FaSortAmountDown, FaTrashAlt, FaUserClock, FaWallet } from 'react-icons/fa';
import { toast } from 'react-toastify';
import HostelNavbar from './HostelOwnerNavbar';
import { archiveBooking, completeBooking, decideBooking, fetchBookings } from '../../store/bookingsSlice';
import ErrorState from '../common/ErrorState';
import ResponseCountdown from '../common/ResponseCountdown';

const statusClass = {
  Pending: 'border-[#5a5548] bg-[#292820] text-[#d4c99d]',
  Approved: 'border-[#43534a] bg-[#222c27] text-[#adc0b5]',
  Booked: 'border-[#43534a] bg-[#222c27] text-[#adc0b5]',
  Completed: 'border-[#46515d] bg-[#252c34] text-[#b5c0cb]',
  Rejected: 'border-[#60494b] bg-[#302426] text-[#d1aaad]',
  Cancelled: 'border-slate-600 bg-slate-800 text-slate-300',
};

const statusLabel = {
  Pending: 'Awaiting review',
  Approved: 'Approved',
  Booked: 'Confirmed',
  Completed: 'Completed',
  Rejected: 'Rejected',
  Cancelled: 'Cancelled',
};

const Detail = ({ label, value, mono }) => (
  <div className="min-w-0">
    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
    <p className={`truncate text-sm text-slate-200 ${mono ? 'font-mono text-xs' : ''}`} title={value}>{value || 'N/A'}</p>
  </div>
);

const StudentAvatar = ({ name, src }) => (
  <div className="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-amber-400 font-bold text-slate-950 ring-2 ring-slate-700">
    <span>{(name || '?')[0].toUpperCase()}</span>
    {src && (
      <img
        src={src}
        alt={`${name || 'Student'} profile`}
        className="absolute inset-0 h-full w-full object-cover"
        onError={event => { event.currentTarget.style.display = 'none'; }}
      />
    )}
  </div>
);

const SelectionCircle = ({ checked, onChange, label }) => (
  <button
    type="button"
    role="checkbox"
    aria-checked={checked}
    aria-label={label}
    onClick={onChange}
    className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border transition ${checked ? 'border-[#c8aa5a] bg-[#29271f]' : 'border-slate-600 bg-[#111827] hover:border-slate-400'}`}
  >
    <span className={`h-2.5 w-2.5 rounded-full transition ${checked ? 'bg-[#c8aa5a]' : 'bg-transparent'}`} />
  </button>
);

const HostelOwnerBookingBed = () => {
  const dispatch = useDispatch();
  const { bookings = [], loading, error } = useSelector(state => state.bookings);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [sortBy, setSortBy] = useState('date');
  const [direction, setDirection] = useState('desc');
  const [busyId, setBusyId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkRemoving, setBulkRemoving] = useState(false);

  useEffect(() => { dispatch(fetchBookings()); }, [dispatch]);

  const counts = useMemo(() => ({
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'Pending').length,
    approved: bookings.filter(b => ['Approved', 'Booked'].includes(b.status)).length,
    paid: bookings.filter(b => b.paymentStatus === 'completed').length,
  }), [bookings]);

  const filteredBookings = useMemo(() => {
    const term = search.trim().toLowerCase();
    const result = bookings.filter(booking => {
      const text = [booking.studentName, booking.bookingId, booking.cnic, booking.email, booking.phoneNumber, booking.roomNumber, booking.bedNumber]
        .filter(value => value !== null && value !== undefined).join(' ').toLowerCase();
      const statusMatches = statusFilter === 'All'
        || (statusFilter === 'Approved' && ['Approved', 'Booked'].includes(booking.status))
        || booking.status === statusFilter;
      return (!term || text.includes(term))
        && statusMatches
        && (paymentFilter === 'All' || booking.paymentStatus === paymentFilter);
    });

    return [...result].sort((a, b) => {
      let left;
      let right;
      if (sortBy === 'student') [left, right] = [a.studentName || '', b.studentName || ''];
      else if (sortBy === 'room') [left, right] = [Number(a.roomNumber) || 0, Number(b.roomNumber) || 0];
      else if (sortBy === 'bed') [left, right] = [Number(a.bedNumber) || 0, Number(b.bedNumber) || 0];
      else [left, right] = [new Date(a.bookingDate || 0).getTime(), new Date(b.bookingDate || 0).getTime()];
      const compared = typeof left === 'string' ? left.localeCompare(right) : left - right;
      return direction === 'asc' ? compared : -compared;
    });
  }, [bookings, direction, paymentFilter, search, sortBy, statusFilter]);

  const handleDecision = async (bookingId, decision) => {
    if (decision === 'reject' && !window.confirm('Reject this booking? The bed will be freed and the payment refunded.')) return;
    setBusyId(bookingId);
    try {
      const result = await dispatch(decideBooking({ bookingId, decision })).unwrap();
      toast.success(result.message);
      if (!result.notificationSent) {
        toast.warning(result.notificationMessage);
      }
    } catch (err) {
      toast.error(err?.message || 'Could not update the booking.');
    } finally { setBusyId(null); }
  };

  const handleCheckout = async bookingId => {
    if (!window.confirm('Mark this student as checked out? The bed will become available and booking history will be kept.')) return;
    setBusyId(bookingId);
    try {
      const result = await dispatch(completeBooking(bookingId)).unwrap();
      toast.success(result.message);
    } catch (err) {
      toast.error(err?.message || 'Could not complete the booking.');
    } finally { setBusyId(null); }
  };

  const handleArchive = async bookingId => {
    if (!window.confirm('Remove this item from your history view? The booking record will remain safely stored and no bed will be affected.')) return;
    setBusyId(bookingId);
    try {
      const result = await dispatch(archiveBooking(bookingId)).unwrap();
      toast.success(result.message);
      setSelectedIds(ids => ids.filter(id => id !== bookingId));
    } catch (err) {
      toast.error(err?.message || 'Could not remove this history record.');
    } finally { setBusyId(null); }
  };

  const removableBookings = filteredBookings.filter(booking =>
    ['Completed', 'Rejected', 'Cancelled'].includes(booking.status)
  );
  const allVisibleSelected = removableBookings.length > 0
    && removableBookings.every(booking => selectedIds.includes(booking.bookingId));

  const toggleSelection = bookingId => {
    setSelectedIds(ids => ids.includes(bookingId)
      ? ids.filter(id => id !== bookingId)
      : [...ids, bookingId]);
  };

  const toggleAllVisible = () => {
    const visibleIds = removableBookings.map(booking => booking.bookingId);
    setSelectedIds(ids => allVisibleSelected
      ? ids.filter(id => !visibleIds.includes(id))
      : [...new Set([...ids, ...visibleIds])]);
  };

  const handleBulkArchive = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Remove ${selectedIds.length} selected history record${selectedIds.length === 1 ? '' : 's'} from this view? Beds and audit records will not be affected.`)) return;
    setBulkRemoving(true);
    const results = await Promise.allSettled(
      selectedIds.map(bookingId => dispatch(archiveBooking(bookingId)).unwrap())
    );
    const failedIds = selectedIds.filter((_, index) => results[index].status === 'rejected');
    const removedCount = selectedIds.length - failedIds.length;
    setSelectedIds(failedIds);
    setBulkRemoving(false);
    if (removedCount) toast.success(`${removedCount} history record${removedCount === 1 ? '' : 's'} removed from view.`);
    if (failedIds.length) toast.error(`${failedIds.length} record${failedIds.length === 1 ? '' : 's'} could not be removed.`);
  };

  const clearFilters = () => { setSearch(''); setStatusFilter('All'); setPaymentFilter('All'); };
  const controlClass = 'h-11 rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-slate-200 outline-none transition focus:border-amber-400';

  return (
    <div className="min-h-screen bg-[#111714] md:flex">
      <HostelNavbar />
      <main className="min-w-0 flex-1 px-4 pb-12 pt-20 sm:px-6 md:px-8 md:pt-8 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <header className="mb-7 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-1 text-sm font-semibold uppercase tracking-[0.2em] text-amber-400">Hostel management</p>
              <h1 className="text-3xl font-bold text-white sm:text-4xl">Booking requests</h1>
              <p className="mt-2 text-sm text-slate-400">Review reservations, verify payments, and manage occupied beds.</p>
            </div>
            <p className="text-sm text-slate-500">Showing {filteredBookings.length} of {bookings.length}</p>
          </header>

          <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              ['Total requests', counts.total, <FaBed />, 'bg-blue-400/10 text-blue-300'],
              ['Awaiting review', counts.pending, <FaUserClock />, 'bg-amber-400/10 text-amber-300'],
              ['Approved', counts.approved, <FaCheckCircle />, 'bg-emerald-400/10 text-emerald-300'],
              ['Payments complete', counts.paid, <FaWallet />, 'bg-violet-400/10 text-violet-300'],
            ].map(([label, value, icon, color]) => (
              <div key={label} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-lg shadow-black/10 sm:p-5">
                <div className="flex items-center justify-between gap-2">
                  <div><p className="text-xs text-slate-400 sm:text-sm">{label}</p><p className="mt-1 text-2xl font-bold text-white">{value}</p></div>
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${color}`}>{icon}</span>
                </div>
              </div>
            ))}
          </section>

          <section className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(250px,1fr)_165px_165px_160px_48px]">
              <label className="relative block">
                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, CNIC, email or ID" className="h-11 w-full rounded-xl border border-slate-700 bg-slate-950 pl-11 pr-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-amber-400" />
              </label>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={controlClass} aria-label="Filter by status">
                <option value="All">All statuses</option><option value="Pending">Pending</option><option value="Approved">Approved</option><option value="Completed">Completed</option><option value="Rejected">Rejected</option><option value="Cancelled">Cancelled</option>
              </select>
              <select value={paymentFilter} onChange={e => setPaymentFilter(e.target.value)} className={controlClass} aria-label="Filter by payment">
                <option value="All">All payments</option><option value="completed">Paid</option><option value="pending">Payment pending</option><option value="refunded">Refunded</option>
              </select>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} className={controlClass} aria-label="Sort bookings">
                <option value="date">Sort by date</option><option value="student">Sort by student</option><option value="room">Sort by room</option><option value="bed">Sort by bed</option>
              </select>
              <button onClick={() => setDirection(value => value === 'asc' ? 'desc' : 'asc')} className="grid h-11 place-items-center rounded-xl border border-slate-700 bg-slate-950 text-slate-300 hover:border-amber-400 hover:text-amber-300" title={direction === 'asc' ? 'Ascending' : 'Descending'} aria-label={`Sort ${direction}`}>
                <FaSortAmountDown className={direction === 'asc' ? 'rotate-180' : ''} />
              </button>
            </div>
          </section>

          {!loading && removableBookings.length > 0 && (
            <div className="mb-4 flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3 text-sm text-slate-300">
                <SelectionCircle checked={allVisibleSelected} onChange={toggleAllVisible} label="Select all visible history" />
                <button type="button" onClick={toggleAllVisible} className="text-left hover:text-white">Select all visible history ({removableBookings.length})</button>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500">{selectedIds.length} selected</span>
                <button
                  disabled={selectedIds.length === 0 || bulkRemoving}
                  onClick={handleBulkArchive}
                  className="flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-500/5 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <FaTrashAlt /> {bulkRemoving ? 'Removing...' : 'Remove selected'}
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="grid gap-4">{[1, 2, 3].map(i => <div key={i} className="h-52 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/70" />)}</div>
          ) : error && bookings.length === 0 ? (
            <ErrorState message={error} onRetry={() => dispatch(fetchBookings())} />
          ) : filteredBookings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 px-6 py-16 text-center">
              <FaSearch className="mx-auto mb-4 text-3xl text-slate-600" /><h2 className="text-lg font-semibold text-white">No matching bookings</h2>
              <p className="mt-1 text-sm text-slate-500">Try changing your search or filters.</p>
              <button onClick={clearFilters} className="mt-5 rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-300">Clear filters</button>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredBookings.map(booking => {
                const pending = booking.status === 'Pending';
                const busy = busyId === booking.bookingId;
                const removable = ['Completed', 'Rejected', 'Cancelled'].includes(booking.status);
                const selected = selectedIds.includes(booking.bookingId);
                return (
                  <article key={`${booking.bookingId}-${booking.bedNumber}`} className={`overflow-hidden rounded-2xl border bg-slate-900/80 shadow-xl shadow-black/10 transition ${selected ? 'border-amber-400/60 ring-1 ring-amber-400/20' : 'border-slate-800 hover:border-slate-700'}`}>
                    <div className="flex flex-col gap-4 border-b border-slate-800 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-center gap-3">
                        {removable && (
                          <SelectionCircle
                            checked={selected}
                            onChange={() => toggleSelection(booking.bookingId)}
                            label={`Select ${booking.studentName} booking history`}
                          />
                        )}
                        <StudentAvatar name={booking.studentName} src={booking.profilePicture} />
                        <div className="min-w-0"><h2 className="truncate text-lg font-bold text-white">{booking.studentName}</h2><p className="text-xs text-slate-500">Requested {booking.bookingDate ? new Date(booking.bookingDate).toLocaleString() : 'recently'}</p><ResponseCountdown deadline={booking.responseDeadline} pending={pending} label="Respond before" /></div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className={`rounded-full border px-3 py-1 text-xs font-medium ${statusClass[booking.status] || 'border-slate-600 bg-slate-800 text-slate-300'}`}>{statusLabel[booking.status] || 'Unknown'}</span>
                        <span className={`rounded-full border px-3 py-1 text-xs font-medium ${booking.paymentStatus === 'completed' ? 'border-[#46515d] bg-[#252c34] text-[#b5c0cb]' : booking.paymentStatus === 'refunded' ? 'border-[#5b5364] bg-[#2b2730] text-[#c0b3c9]' : 'border-slate-600 bg-slate-800 text-slate-300'}`}>
                          {booking.paymentStatus === 'completed' ? 'Paid' : booking.paymentStatus === 'refunded' ? 'Refunded' : 'Payment pending'}
                        </span>
                      </div>
                    </div>
                    <div className="grid gap-5 px-5 py-5 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
                      <Detail label="Booking ID" value={booking.bookingId} mono /><Detail label="CNIC" value={booking.cnic} /><Detail label="Email" value={booking.email} /><Detail label="Phone" value={booking.phoneNumber} /><Detail label="Room" value={String(booking.roomNumber ?? 'N/A')} /><Detail label="Bed" value={String(booking.bedNumber ?? 'N/A')} />
                    </div>
                    <div className="flex flex-col gap-3 bg-slate-950/40 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xs text-slate-500">{pending ? 'This request is waiting for your decision.' : ['Approved', 'Booked'].includes(booking.status) ? 'The student currently holds this bed.' : 'Saved booking history.'}</p>
                      {pending ? <div className="flex gap-3">
                        <button disabled={busy} onClick={() => handleDecision(booking.bookingId, 'approve')} className="rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-400 disabled:opacity-50">Approve</button>
                        <button disabled={busy} onClick={() => handleDecision(booking.bookingId, 'reject')} className="rounded-lg border border-red-500/50 bg-red-500/10 px-5 py-2.5 text-sm font-bold text-red-300 hover:bg-red-500 hover:text-white disabled:opacity-50">{busy ? 'Updating...' : 'Reject'}</button>
                      </div> : ['Approved', 'Booked'].includes(booking.status) ? (
                        <button disabled={busy} onClick={() => handleCheckout(booking.bookingId)} className="rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-amber-400/60 hover:text-amber-200 disabled:opacity-50">{busy ? 'Updating...' : 'Mark as checked out'}</button>
                      ) : (
                        <button disabled={busy} onClick={() => handleArchive(booking.bookingId)} className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-400 hover:border-red-500/50 hover:text-red-300 disabled:opacity-50">{busy ? 'Removing...' : 'Remove from history'}</button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default HostelOwnerBookingBed;
