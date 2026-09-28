// Payment Options Component with JazzCash and EasyPaisa (Locked)
// Author: AQIB AWAN
//
// ─────────────────────────────────────────────────────────────────────────────
// HOW TO ENABLE JazzCash or EasyPaisa LATER (one-line change):
//   In the PAYMENT_METHODS array below, change that method's
//        status: 'pending'   →   status: 'active'
//   That's it. No other wiring needed — the button view AND the dropdown both
//   read from this same config, so a single flip unlocks the method everywhere
//   (removes the "Locked" badge, enables selection, updates the dropdown label).
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import { FaLock, FaCheckCircle, FaCreditCard, FaMobileAlt, FaMoneyBillWave } from 'react-icons/fa';

// Single source of truth for both the button view and the dropdown variant.
// status: 'active'  → selectable, works.
// status: 'pending' → shown as "Locked" (not yet integrated). Flip to 'active' to enable.
export const PAYMENT_METHODS = [
  {
    id: 'stripe',
    name: 'Stripe',
    icon: FaCreditCard,
    status: 'active',
    description: 'Credit / Debit Card',
    color: 'green' },
  {
    id: 'jazzcash',
    name: 'JazzCash',
    icon: FaMobileAlt,
    status: 'pending',
    description: 'Mobile Wallet - Locked',
    color: 'gray' },
  {
    id: 'easypaisa',
    name: 'EasyPaisa',
    icon: FaMobileAlt,
    status: 'pending',
    description: 'Mobile Wallet - Locked',
    color: 'gray' },
];

const PaymentOptions = ({ selectedMethod, onMethodChange, showModal = false }) => {
  const [showNotification, setShowNotification] = useState(false);

  const paymentMethods = PAYMENT_METHODS;

  const handleSelect = (method) => {
    if (method.status !== 'active') {
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
      return;
    }
    onMethodChange(method.id);
  };

  return (
    <div className="w-full">
      {/* Title */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <FaMoneyBillWave style={{verticalAlign:"middle",marginRight:"6px"}} />Payment Method
        </h3>
        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
          Stripe Active
        </span>
      </div>

      {/* Payment Options */}
      <div className="space-y-3 mb-4">
        {paymentMethods.map((method) => {
          const Icon = method.icon;
          const isActive = method.status === 'active';
          const isSelected = selectedMethod === method.id;

          return (
            <button
              key={method.id}
              onClick={() => handleSelect(method)}
              disabled={!isActive}
              type="button"
              className={`
                w-full flex items-center justify-between p-4 rounded-xl border-2
                transition-all duration-200
                ${
                  isActive
                    ? isSelected
                      ? 'border-green-600 bg-green-50'
                      : 'border-green-400 bg-green-50 hover:bg-green-100 hover:border-green-500'
                    : 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                }
                ${isActive && !isSelected ? 'hover:shadow-md' : ''}
              `}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    ${isActive ? 'bg-green-200 text-green-700' : 'bg-gray-200 text-gray-400'}
                  `}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-800 flex items-center gap-2">
                    {method.name}
                    {isActive && isSelected && (
                      <FaCheckCircle className="w-4 h-4 text-green-600" />
                    )}
                  </p>
                  <p className="text-sm text-gray-500">{method.description}</p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2">
                {!isActive ? (
                  <>
                    <FaLock className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-medium text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                      Locked
                    </span>
                  </>
                ) : (
                  isSelected && (
                    <span className="text-xs font-medium text-green-600 bg-green-200 px-2 py-1 rounded-full">
                      Selected
                    </span>
                  )
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Info Notice */}
      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 flex items-start gap-2">
        <FaLock className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-700">
          <span className="font-medium">JazzCash &amp; EasyPaisa</span> are
          currently locked and not available yet. Please use Stripe to pay.
        </p>
      </div>

      {/* Notification Toast */}
      {showNotification && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded shadow-lg max-w-sm">
            <div className="flex items-start gap-3">
              <FaLock className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm">Locked</p>
                <p className="text-xs mt-1">
                  JazzCash & EasyPaisa are locked right now. For now, please use Stripe.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Simple Payment Method Dropdown (for minimal integration).
// Reads from the same PAYMENT_METHODS config above, so flipping a method's
// status to 'active' unlocks it here too — no separate edit needed.
export const PaymentMethodDropdown = ({ value, onChange }) => {
  const [showNotification, setShowNotification] = useState(false);

  const handleChange = (e) => {
    const selectedValue = e.target.value;
    const method = PAYMENT_METHODS.find((m) => m.id === selectedValue);

    if (!method || method.status !== 'active') {
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
      return;
    }

    onChange(e);
  };

  return (
    <div className="relative">
      <select
        value={value}
        onChange={handleChange}
        className="shadow appearance-none border rounded w-full py-2 px-3 bg-[#25292e] text-white leading-tight focus:outline-none focus:shadow-outline"
      >
        {PAYMENT_METHODS.map((method) => {
          const isActive = method.status === 'active';
          const label =
            method.id === 'stripe'
              ? `Stripe - Credit/Debit Card${isActive ? ' (Active)' : ' (Locked)'}`
              : `${method.name}${isActive ? ' (Active)' : ' (Locked)'}`;
          return (
            <option
              key={method.id}
              value={method.id}
              disabled={!isActive}
              className={isActive ? '' : 'text-gray-400'}
            >
              {label}
            </option>
          );
        })}
      </select>

      {showNotification && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-yellow-50 border border-yellow-300 rounded-lg p-2 text-xs text-yellow-700 shadow-md z-10">
          <span className="font-medium flex items-center gap-2"><FaLock /> This payment method is locked.</span>
        </div>
      )}
    </div>
  );
};

export default PaymentOptions;
