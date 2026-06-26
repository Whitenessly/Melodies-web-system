import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar.jsx';
import Header from '../components/Header.jsx';
import MusicPlayer from '../components/MusicPlayer.jsx';

export default function PaymentHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In mock sandbox, let's auto-generate a sample list of receipts
    setTimeout(() => {
      setHistory([
        { id: '1', orderId: `order_${Date.now() - 86400000}`, amount: 59000, gateway: 'momo', status: 'SUCCESS', date: '2026-06-25' },
        { id: '2', orderId: `order_${Date.now() - 172800000}`, amount: 59000, gateway: 'vnpay', status: 'SUCCESS', date: '2026-06-24' }
      ]);
      setLoading(false);
    }, 400);
  }, []);

  return (
    <div className="min-h-screen bg-background text-white flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        
        <main className="md:ml-sidebar-width flex-1 p-8 overflow-y-auto flex flex-col gap-6">
          <div>
            <h1 className="font-display-lg text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary-container">receipt_long</span>
              Lịch sử Giao dịch thanh toán
            </h1>
            <p className="text-xs text-on-surface-variant mt-1.5">
              Tra cứu các hóa đơn thanh toán và nâng cấp gói cước hội viên Premium.
            </p>
          </div>

          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center text-secondary-container gap-3 min-h-[30vh]">
              <span className="material-symbols-outlined text-4xl animate-spin">sync</span>
            </div>
          ) : (
            <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-white/5 border-b border-white/5 text-on-surface-variant font-bold">
                    <th className="p-4">Ngày giao dịch</th>
                    <th className="p-4">Mã đơn hàng</th>
                    <th className="p-4">Cổng thanh toán</th>
                    <th className="p-4">Số tiền</th>
                    <th className="p-4 text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {history.map(item => (
                    <tr key={item.id} className="hover:bg-white/[0.01]">
                      <td className="p-4 text-on-surface-variant">{item.date}</td>
                      <td className="p-4 font-mono font-semibold text-white">{item.orderId}</td>
                      <td className="p-4 text-on-surface-variant capitalize">{item.gateway}</td>
                      <td className="p-4 text-white font-mono font-bold">{item.amount.toLocaleString()} VND</td>
                      <td className="p-4 text-center">
                        <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-status-success/15 text-status-success">
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </main>
      </div>
      <MusicPlayer />
    </div>
  );
}
