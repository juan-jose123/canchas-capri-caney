import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { PSE_BANKS } from '../utils/constants';
import { formatCurrency } from '../utils/helpers';
import { X, Loader2, CheckCircle, Building2, Lock, ShieldCheck } from 'lucide-react';

export default function PaymentModal({ bookingData, totalAmount, advanceAmount, onSuccess, onClose }) {
  const { darkMode, addNotification } = useApp();
  const [step, setStep] = useState('bank'); // bank -> processing -> bank-page -> confirming -> done
  const [selectedBank, setSelectedBank] = useState('');
  const [paymentId, setPaymentId] = useState(null);
  const [docType, setDocType] = useState('CC');
  const [docNumber, setDocNumber] = useState('');
  const [email, setEmail] = useState('');

  // Initiate payment - reserve the slot temporarily
  const initiatePayment = async () => {
    if (!selectedBank || !docNumber.trim() || !email.trim()) {
      addNotification('Completa los datos PSE', 'error');
      return;
    }

    setStep('processing');
    try {
      const res = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...bookingData, bank: selectedBank })
      });
      const data = await res.json();
      if (data.success) {
        setPaymentId(data.paymentId);
        // Simulate redirect to bank
        setTimeout(() => setStep('bank-page'), 1500);
      } else {
        addNotification(data.message || 'Error iniciando pago', 'error');
        setStep('bank');
      }
    } catch {
      addNotification('Error de conexión', 'error');
      setStep('bank');
    }
  };

  // Approve payment in simulated bank page
  const approvePayment = async () => {
    setStep('confirming');
    try {
      const res = await fetch(`/api/payments/${paymentId}/confirm`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        setStep('done');
        setTimeout(() => onSuccess(data.reservation), 1500);
      } else {
        addNotification(data.message || 'Pago rechazado', 'error');
        onClose();
      }
    } catch {
      addNotification('Error procesando pago', 'error');
      onClose();
    }
  };

  // Reject payment
  const rejectPayment = async () => {
    if (paymentId) {
      await fetch(`/api/payments/${paymentId}/reject`, { method: 'POST' });
    }
    addNotification('Pago cancelado', 'warning');
    onClose();
  };

  const cardBg = darkMode ? 'bg-gray-800' : 'bg-white';
  const textColor = darkMode ? 'text-white' : 'text-gray-800';
  const subtleText = darkMode ? 'text-gray-400' : 'text-gray-500';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className={`${cardBg} w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border ${
        darkMode ? 'border-gray-700' : 'border-turf-100'
      }`}>
        {/* ============ STEP: SELECT BANK + INFO ============ */}
        {step === 'bank' && (
          <>
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-5 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <Building2 size={22} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg leading-tight">Pago PSE</h3>
                    <p className="text-xs text-white/80">Pago seguro en línea</p>
                  </div>
                </div>
                <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg">
                  <X size={20} />
                </button>
              </div>
              <div className="mt-3 bg-white/10 rounded-xl p-3">
                <p className="text-xs text-white/80">Total a pagar (anticipo)</p>
                <p className="text-2xl font-bold">{formatCurrency(advanceAmount)}</p>
                <p className="text-[10px] text-white/70 mt-1">
                  Reserva total: {formatCurrency(totalAmount)} | Resta: {formatCurrency(totalAmount - advanceAmount)}
                </p>
              </div>
            </div>

            {/* Form */}
            <div className="p-5 space-y-3 max-h-[55vh] overflow-y-auto">
              <div>
                <label className={`text-xs font-bold ${subtleText}`}>Banco</label>
                <select
                  value={selectedBank}
                  onChange={e => setSelectedBank(e.target.value)}
                  className={`w-full mt-1 px-3 py-3 rounded-xl border-2 text-sm font-medium ${
                    darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-800'
                  }`}
                >
                  <option value="">-- Selecciona tu banco --</option>
                  {PSE_BANKS.map(b => (
                    <option key={b.code} value={b.code}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1">
                  <label className={`text-xs font-bold ${subtleText}`}>Tipo doc.</label>
                  <select
                    value={docType}
                    onChange={e => setDocType(e.target.value)}
                    className={`w-full mt-1 px-2 py-3 rounded-xl border-2 text-sm font-medium ${
                      darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-200'
                    }`}
                  >
                    <option value="CC">CC</option>
                    <option value="CE">CE</option>
                    <option value="NIT">NIT</option>
                    <option value="PA">PA</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className={`text-xs font-bold ${subtleText}`}>Número</label>
                  <input
                    type="text"
                    value={docNumber}
                    onChange={e => setDocNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder="1023456789"
                    className={`w-full mt-1 px-3 py-3 rounded-xl border-2 text-sm font-medium ${
                      darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-200'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`text-xs font-bold ${subtleText}`}>Correo electrónico</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  className={`w-full mt-1 px-3 py-3 rounded-xl border-2 text-sm font-medium ${
                    darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-200'
                  }`}
                />
              </div>

              <div className={`text-[11px] ${subtleText} flex items-start gap-1.5 mt-2`}>
                <ShieldCheck size={14} className="mt-0.5 flex-shrink-0 text-turf-500" />
                <span>El horario se reserva temporalmente mientras realizas el pago. Si no completas el pago en 10 minutos, se libera.</span>
              </div>
            </div>

            <div className={`p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'} flex gap-2`}>
              <button
                onClick={onClose}
                className={`flex-1 py-3 rounded-xl text-sm font-bold ${
                  darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                }`}
              >
                Cancelar
              </button>
              <button
                onClick={initiatePayment}
                disabled={!selectedBank || !docNumber || !email}
                className="flex-[2] py-3 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 transition-all"
              >
                Continuar al banco
              </button>
            </div>
          </>
        )}

        {/* ============ STEP: PROCESSING (creating pending payment) ============ */}
        {step === 'processing' && (
          <div className="p-10 text-center">
            <Loader2 size={48} className="animate-spin text-blue-600 mx-auto mb-4" />
            <h3 className={`font-bold ${textColor}`}>Conectando con tu banco...</h3>
            <p className={`text-sm ${subtleText} mt-2`}>Espera un momento</p>
          </div>
        )}

        {/* ============ STEP: BANK PAGE (simulated) ============ */}
        {step === 'bank-page' && (
          <>
            <div className="bg-gradient-to-br from-slate-700 to-slate-900 p-5 text-white">
              <div className="flex items-center gap-2">
                <Lock size={20} />
                <p className="font-bold text-sm">PORTAL SEGURO - {PSE_BANKS.find(b => b.code === selectedBank)?.name}</p>
              </div>
              <p className="text-[10px] text-white/70 mt-1">https://pagos.bancolombia.com.co (simulación)</p>
            </div>
            <div className="p-6 space-y-4">
              <div className={`p-4 rounded-2xl ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
                <p className={`text-xs ${subtleText}`}>Comercio</p>
                <p className={`font-bold ${textColor}`}>Canchas Capri & Caney</p>
                <p className={`text-xs mt-2 ${subtleText}`}>Concepto</p>
                <p className={`text-sm ${textColor}`}>
                  Reserva {bookingData.court} - {bookingData.date} {String(bookingData.startHour).padStart(2,'0')}:00
                </p>
                <p className={`text-xs mt-2 ${subtleText}`}>Valor a pagar</p>
                <p className="font-bold text-2xl text-blue-600">{formatCurrency(advanceAmount)}</p>
              </div>

              <div className={`p-3 rounded-xl text-xs ${darkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-50 text-blue-700'}`}>
                Esta es una simulación de PSE. En producción aquí se redirige al banco real.
              </div>

              <div className="flex gap-2">
                <button
                  onClick={rejectPayment}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold ${
                    darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  Rechazar pago
                </button>
                <button
                  onClick={approvePayment}
                  className="flex-1 py-3 rounded-xl text-sm font-bold bg-turf-500 hover:bg-turf-600 text-white"
                >
                  Aprobar pago
                </button>
              </div>
            </div>
          </>
        )}

        {/* ============ STEP: CONFIRMING ============ */}
        {step === 'confirming' && (
          <div className="p-10 text-center">
            <Loader2 size={48} className="animate-spin text-turf-500 mx-auto mb-4" />
            <h3 className={`font-bold ${textColor}`}>Confirmando pago...</h3>
            <p className={`text-sm ${subtleText} mt-2`}>Casi listo</p>
          </div>
        )}

        {/* ============ STEP: DONE ============ */}
        {step === 'done' && (
          <div className="p-10 text-center animate-fade-in">
            <div className="w-20 h-20 mx-auto rounded-full bg-turf-100 flex items-center justify-center mb-4">
              <CheckCircle size={48} className="text-turf-500" />
            </div>
            <h3 className={`font-bold text-lg ${textColor}`}>¡Pago aprobado!</h3>
            <p className={`text-sm ${subtleText} mt-1`}>Tu reserva está confirmada</p>
          </div>
        )}
      </div>
    </div>
  );
}
