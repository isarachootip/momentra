'use client';

import React, { useState } from 'react';
import type { SubscriptionPlan, PaymentInvoice } from '@/types/personal-hub';
import { CreditCard, QrCode, CheckCircle, Shield, AlertCircle, ArrowUpRight, Check, X } from 'lucide-react';

const PLANS: SubscriptionPlan[] = [
  { plan_code: 'free', name: 'Free Starter', price_thb_monthly: 0, max_links: 5, max_km_items: 20, max_storage_bytes: 524288000, features: {} },
  { plan_code: 'pro', name: 'Pro Personal Hub', price_thb_monthly: 199, max_links: -1, max_km_items: -1, max_storage_bytes: 21474836480, features: { stats: true } },
  { plan_code: 'organization', name: 'Organization Suite', price_thb_monthly: 990, max_links: -1, max_km_items: -1, max_storage_bytes: 214748364800, features: { stats: true, multi_admin: true, custom_domain: true } },
];

export default function HubBillingPage() {
  const [currentPlan, setCurrentPlan] = useState<'free' | 'pro' | 'organization'>('pro');
  const [paymentMethod, setPaymentMethod] = useState<'promptpay' | 'card'>('promptpay');
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [selectedUpgradePlan, setSelectedUpgradePlan] = useState<SubscriptionPlan | null>(null);

  const usage = {
    links: { used: 5, limit: currentPlan === 'free' ? 5 : -1 },
    km: { used: 4, limit: currentPlan === 'free' ? 20 : -1 },
    storageMb: { used: 128, limit: currentPlan === 'free' ? 500 : currentPlan === 'pro' ? 20480 : 204800 },
  };

  const invoices: PaymentInvoice[] = [
    { id: 'inv_101', amount_thb: 199, currency: 'THB', payment_method: 'promptpay', status: 'paid', paid_at: '2026-10-01T10:15:00Z', created_at: '2026-10-01T10:14:00Z' },
    { id: 'inv_100', amount_thb: 199, currency: 'THB', payment_method: 'promptpay', status: 'paid', paid_at: '2026-09-01T09:20:00Z', created_at: '2026-09-01T09:18:00Z' },
  ];

  const handleOpenUpgrade = (plan: SubscriptionPlan) => {
    setSelectedUpgradePlan(plan);
    setIsQrModalOpen(true);
  };

  const handleConfirmPayment = () => {
    if (selectedUpgradePlan) setCurrentPlan(selectedUpgradePlan.plan_code);
    setIsQrModalOpen(false);
  };

  return (
    <div className="space-y-8">
      {/* Current Subscription Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-5">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">แพ็กเกจปัจจุบันของคุณ</span>
            <div className="flex items-center gap-2 mt-1">
              <h2 className="text-xl font-extrabold text-slate-900 capitalize">
                {currentPlan === 'free' ? 'Free Starter (฿0)' : currentPlan === 'pro' ? 'Pro Personal Hub (฿199/เดือน)' : 'Organization Suite (฿990/เดือน)'}
              </h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                <CheckCircle className="h-3 w-3" /> ใช้งานอยู่ (Active)
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">รอบบิลถัดไป: 1 พฤศจิกายน 2569 (ต่ออายุอัตโนมัติ)</p>
          </div>
        </div>

        {/* Quota Progress Bars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-700">โควตาลิงก์โซเชียล</span>
              <span className="text-slate-900">{usage.links.used} / {usage.links.limit === -1 ? '∞' : usage.links.limit} ลิงก์</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full bg-rose-800 rounded-full" style={{ width: `${usage.links.limit === -1 ? 15 : (usage.links.used / usage.links.limit) * 100}%` }}></div>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-700">โควตาคลังความรู้ (KM)</span>
              <span className="text-slate-900">{usage.km.used} / {usage.km.limit === -1 ? '∞' : usage.km.limit} รายการ</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full bg-sky-600 rounded-full" style={{ width: `${usage.km.limit === -1 ? 10 : (usage.km.used / usage.km.limit) * 100}%` }}></div>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-700">พื้นที่จัดเก็บไฟล์</span>
              <span className="text-slate-900">{usage.storageMb.used} MB / {usage.storageMb.limit >= 1024 ? `${usage.storageMb.limit / 1024} GB` : `${usage.storageMb.limit} MB`}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${(usage.storageMb.used / usage.storageMb.limit) * 100}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Plan Selection Grid */}
      <div>
        <h3 className="text-sm font-bold text-slate-900 mb-4">เลือกแพ็กเกจสมาชิกรายเดือน</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => {
            const isCurrent = currentPlan === plan.plan_code;
            return (
              <div key={plan.plan_code} className={`rounded-2xl border p-6 bg-white shadow-xs flex flex-col justify-between ${isCurrent ? 'border-rose-900 ring-2 ring-rose-900/10' : 'border-slate-200'}`}>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-extrabold text-base text-slate-900">{plan.name}</h4>
                    {isCurrent && <span className="text-[10px] font-bold bg-rose-100 text-rose-900 px-2 py-0.5 rounded-full">แผนของคุณ</span>}
                  </div>
                  <div className="text-2xl font-black text-slate-900">
                    ฿{plan.price_thb_monthly} <span className="text-xs font-normal text-slate-500">/เดือน</span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                    <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-600" /> {plan.max_links === -1 ? 'ลิงก์โซเชียลไม่จำกัด' : `ลิงก์โซเชียลสูงสุด ${plan.max_links} ลิงก์`}</li>
                    <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-600" /> {plan.max_km_items === -1 ? 'คลังความรู้ (KM) ไม่จำกัด' : `คลังความรู้สูงสุด ${plan.max_km_items} รายการ`}</li>
                    <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-600" /> พื้นที่ {plan.max_storage_bytes >= 1073741824 ? `${plan.max_storage_bytes / 1073741824} GB` : '500 MB'}</li>
                    {plan.features.stats && <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-600" /> สถิติผู้เข้าชมเชิงลึก</li>}
                    {plan.features.multi_admin && <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-600" /> ผู้ดูแลหลายคน & Custom Domain</li>}
                  </ul>
                </div>
                <div className="pt-6">
                  {isCurrent ? (
                    <button disabled className="w-full rounded-xl bg-slate-100 py-2.5 text-xs font-bold text-slate-400">แพ็กเกจปัจจุบัน</button>
                  ) : (
                    <button onClick={() => handleOpenUpgrade(plan)} className="w-full rounded-xl bg-rose-900 py-2.5 text-xs font-bold text-white hover:bg-rose-800 transition-colors shadow-xs">
                      {plan.price_thb_monthly > 199 ? 'อัปเกรดเป็นแพ็กเกจนี้' : 'สลับแพ็กเกจ'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Invoices History */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-3">ประวัติการชำระเงิน (Invoice History)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 text-slate-400 font-semibold uppercase text-[10px]">
              <tr>
                <th className="py-2.5">รหัสใบเสร็จ</th>
                <th className="py-2.5">ยอดชำระ</th>
                <th className="py-2.5">ช่องทาง</th>
                <th className="py-2.5">สถานะ</th>
                <th className="py-2.5">วันที่ชำระ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td className="py-3 font-mono">{inv.id}</td>
                  <td className="py-3 font-bold text-slate-900">฿{inv.amount_thb}.00</td>
                  <td className="py-3 uppercase font-semibold text-[11px]">{inv.payment_method}</td>
                  <td className="py-3"><span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">ชำระแล้ว</span></td>
                  <td className="py-3 text-slate-500">{new Date(inv.paid_at!).toLocaleDateString('th-TH')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment / QR Modal */}
      {isQrModalOpen && selectedUpgradePlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 text-center space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h4 className="text-sm font-bold text-slate-900">ชำระเงินแพ็กเกจ {selectedUpgradePlan.name}</h4>
              <button onClick={() => setIsQrModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="h-4 w-4" /></button>
            </div>
            <div className="flex justify-center gap-2">
              <button onClick={() => setPaymentMethod('promptpay')} className={`rounded-xl px-4 py-2 text-xs font-bold flex items-center gap-1.5 ${paymentMethod === 'promptpay' ? 'bg-rose-900 text-white' : 'bg-slate-100 text-slate-700'}`}>
                <QrCode className="h-4 w-4" /> Thai PromptPay
              </button>
              <button onClick={() => setPaymentMethod('card')} className={`rounded-xl px-4 py-2 text-xs font-bold flex items-center gap-1.5 ${paymentMethod === 'card' ? 'bg-rose-900 text-white' : 'bg-slate-100 text-slate-700'}`}>
                <CreditCard className="h-4 w-4" /> บัตรเครดิต/เดบิต
              </button>
            </div>
            {paymentMethod === 'promptpay' ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 inline-block space-y-2">
                <div className="h-44 w-44 bg-white border border-slate-200 rounded-lg mx-auto flex items-center justify-center p-2 shadow-xs">
                  <img src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=PROMPTPAY_MOMENTRA_PAYMENT" alt="PromptPay QR" className="h-full w-full" />
                </div>
                <div className="text-xs font-bold text-slate-800">สแกนด้วย Mobile Banking ทุกธนาคาร</div>
                <div className="text-sm font-extrabold text-rose-900">฿{selectedUpgradePlan.price_thb_monthly}.00</div>
              </div>
            ) : (
              <div className="p-6 border border-slate-200 rounded-xl space-y-2 text-left text-xs">
                <label className="block text-slate-700 font-bold">หมายเลขบัตรเครดิต/เดบิต</label>
                <input type="text" placeholder="4242 •••• •••• 4242" className="w-full border rounded-lg p-2 font-mono" />
              </div>
            )}
            <button onClick={handleConfirmPayment} className="w-full rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition-colors">
              ยืนยันการชำระเงินและเปิดใช้งานแพ็กเกจ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
