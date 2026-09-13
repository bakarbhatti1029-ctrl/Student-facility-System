import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FaEdit, FaPlus, FaTrashAlt, FaUtensils } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { fetchAllDishes, fetchItem, deleteItem } from '../../store/kitchenSlice';
import KitchenOwnerNavbar from './KitchenOwnerNavbar';
import { AddOrUpdateItemModal } from './AddOrUpdateItemModal';
import ErrorState from '../common/ErrorState';

const DishSkeleton = () => (
  <div className="animate-pulse overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
    <div className="h-52 bg-slate-800" />
    <div className="space-y-3 p-5">
      <div className="h-5 w-2/3 rounded bg-slate-700" />
      <div className="h-4 w-1/3 rounded bg-slate-800" />
      <div className="h-12 rounded bg-slate-800" />
    </div>
  </div>
);

const Dishes = () => {
  const dispatch = useDispatch();
  const { dishes = [], loading, error } = useSelector(state => state.kitchenItems);
  const [deletingId, setDeletingId] = useState(null);
  const [modalState, setModalState] = useState({ isOpen: false, action: 'Add', payload: {} });

  useEffect(() => { dispatch(fetchAllDishes()); }, [dispatch]);

  const closeModal = () => setModalState({ isOpen: false, action: 'Add', payload: {} });

  const handleEdit = async dishId => {
    try {
      const dish = await dispatch(fetchItem(dishId)).unwrap();
      setModalState({ isOpen: true, action: 'Edit', payload: dish });
    } catch (err) {
      toast.error(err?.message || 'Could not load this dish.');
    }
  };

  const handleDelete = async dish => {
    if (!window.confirm(`Delete ${dish.name}? This cannot be undone.`)) return;
    setDeletingId(dish._id);
    try {
      await dispatch(deleteItem(dish._id)).unwrap();
      toast.success(`${dish.name} deleted.`);
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Could not delete this dish.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#111714] md:flex">
      <KitchenOwnerNavbar />
      <main className="min-w-0 flex-1 px-4 pb-12 pt-20 sm:px-6 md:px-8 md:pt-8 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-1 text-sm font-semibold uppercase tracking-[0.2em] text-amber-400">Kitchen management</p>
              <h1 className="text-3xl font-bold text-white sm:text-4xl">Your menu</h1>
              <p className="mt-2 text-sm text-slate-400">Manage dishes, prices, and availability from one place.</p>
            </div>
            <button
              onClick={() => setModalState({ isOpen: true, action: 'Add', payload: {} })}
              className="flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-amber-300"
            >
              <FaPlus /> Add dish
            </button>
          </header>

          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{[1, 2, 3].map(i => <DishSkeleton key={i} />)}</div>
          ) : error ? (
            <ErrorState message={error} onRetry={() => dispatch(fetchAllDishes())} />
          ) : dishes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 px-6 py-20 text-center">
              <FaUtensils className="mx-auto mb-4 text-4xl text-slate-600" />
              <h2 className="text-xl font-semibold text-white">Your menu is empty</h2>
              <p className="mt-2 text-sm text-slate-500">Add your first dish to make it visible to customers.</p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {dishes.map(item => (
                <article key={item._id} className="group flex min-h-full flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 shadow-xl shadow-black/10 transition hover:-translate-y-1 hover:border-slate-700">
                  <div className="relative h-52 overflow-hidden bg-slate-800">
                    {item.imageUrls?.[0] ? (
                      <img src={item.imageUrls[0]} alt={item.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                    ) : (
                      <div className="grid h-full place-items-center"><FaUtensils className="text-4xl text-slate-600" /></div>
                    )}
                    <span className={`absolute right-3 top-3 rounded-full border px-3 py-1 text-xs font-medium backdrop-blur ${item.availability ? 'border-[#43534a] bg-[#222c27]/90 text-[#adc0b5]' : 'border-[#60494b] bg-[#302426]/90 text-[#d1aaad]'}`}>
                      {item.availability ? 'Available' : 'Unavailable'}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">{item.category || 'Uncategorized'}</p>
                        <h2 className="truncate text-xl font-bold capitalize text-white" title={item.name}>{item.name}</h2>
                      </div>
                      <p className="shrink-0 text-lg font-bold text-amber-300">PKR {Number(item.price).toLocaleString()}</p>
                    </div>
                    <p className="mb-5 line-clamp-3 flex-1 text-sm leading-6 text-slate-400">{item.description || 'No description provided.'}</p>

                    <div className="flex gap-3 border-t border-slate-800 pt-4">
                      <button onClick={() => handleEdit(item._id)} className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-amber-400/60 hover:text-amber-300">
                        <FaEdit /> Edit
                      </button>
                      <button disabled={deletingId === item._id} onClick={() => handleDelete(item)} className="flex items-center justify-center gap-2 rounded-lg border border-red-500/40 bg-red-500/5 px-4 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500 hover:text-white disabled:opacity-50">
                        <FaTrashAlt /> {deletingId === item._id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>

      {modalState.isOpen && (
        <AddOrUpdateItemModal action={modalState.action} payload={modalState.payload} handleClose={closeModal} />
      )}
    </div>
  );
};

export default Dishes;
