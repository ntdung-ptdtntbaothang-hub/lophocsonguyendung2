import React from 'react';
import { NotificationItem } from '../types';
import { Bell, Check, Inbox, Gamepad2, BookOpen, Clock } from 'lucide-react';
import { storage } from '../services/storage';

interface NotificationsViewProps {
  notifications: NotificationItem[];
  onRefresh: () => void;
  onNavigateToItem: (type: 'submission' | 'game' | 'system', id?: string) => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  notifications,
  onRefresh,
  onNavigateToItem,
}) => {
  const handleMarkAllRead = () => {
    storage.markAllNotificationsRead();
    onRefresh();
  };

  const handleMarkRead = (id: string) => {
    storage.markNotificationRead(id);
    onRefresh();
  };

  const isUnread = (item: NotificationItem) => item.unread ?? !item.read;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-rose-600 uppercase">
            <Bell className="w-4 h-4" />
            <span>Trung Tâm Hoạt Động</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-display text-slate-900 mt-1">
            Thông Báo & Hoạt Động Mới
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cập nhật tức thời khi có học sinh nộp bài tập hoặc hoàn thành trò chơi củng cố
          </p>
        </div>

        {notifications.some(isUnread) && (
          <button
            onClick={handleMarkAllRead}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer shrink-0"
          >
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Đánh dấu đã đọc tất cả</span>
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            <Bell className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-bold text-slate-700">Chưa có thông báo nào</p>
            <p className="mt-1">Khi học sinh nộp bài hoặc chơi game, thông báo sẽ xuất hiện tại đây.</p>
          </div>
        ) : (
          notifications.map((item) => {
            const Icon = item.type === 'submission' ? Inbox : item.type === 'game' ? Gamepad2 : BookOpen;
            const iconColor = item.type === 'submission' 
              ? 'bg-blue-100 text-blue-700' 
              : item.type === 'game' 
              ? 'bg-purple-100 text-purple-700' 
              : 'bg-emerald-100 text-emerald-700';

            const unread = isUnread(item);

            return (
              <div
                key={item.id}
                onClick={() => {
                  handleMarkRead(item.id);
                  onNavigateToItem(item.type, item.linkId || item.referenceId);
                }}
                className={`p-4.5 sm:p-5 flex items-start justify-between gap-4 cursor-pointer transition-colors ${
                  unread ? 'bg-amber-50/40 hover:bg-amber-50/70' : 'hover:bg-slate-50/80'
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconColor}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                        {item.title}
                      </h4>
                      {unread && (
                        <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                      {item.message}
                    </p>
                    <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{item.time || (item.createdAt ? new Date(item.createdAt).toLocaleString('vi-VN') : 'Gần đây')}</span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkRead(item.id);
                    }}
                    className="text-xs text-slate-400 hover:text-slate-700 px-2 py-1 rounded hover:bg-slate-100"
                    title="Đánh dấu đã đọc"
                  >
                    {!unread ? 'Đã đọc' : 'Đánh dấu'}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
