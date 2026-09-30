import React from 'react';
import {
  InstagramActivityData,
  InstagramActivityNotification,
  InstagramActivityNotificationType,
  CharacterPreset,
} from '../../../types';
import { CharacterSelector, ImageUploader, SaveProfileButton } from '../../../components/FormControls';
import { useLanguage } from '../../../context/LanguageContext';
import { Plus, Trash2, ArrowUp, ArrowDown, User, Heart, Bell, Moon, Sun, Smartphone, Square, RectangleVertical } from 'lucide-react';

interface Props {
  data: InstagramActivityData;
  onChange: (updated: InstagramActivityData) => void;
  characters: CharacterPreset[];
  activeCharacterId?: string;
  onSaveCharacter: () => void;
  onSaveProfile?: () => void;
  onSelectCharacter: (char: CharacterPreset) => void;
  onDeleteCharacter?: (id: string) => void;
  onRenameCharacter?: (id: string, newName: string) => void;
}

export const InstagramActivityForm: React.FC<Props> = ({
  data,
  onChange,
  characters,
  activeCharacterId,
  onSaveCharacter,
  onSaveProfile,
  onSelectCharacter,
  onDeleteCharacter,
  onRenameCharacter,
}) => {
  const { t, isId } = useLanguage();
  const updateField = <K extends keyof InstagramActivityData>(key: K, value: InstagramActivityData[K]) => {
    onChange({ ...data, [key]: value });
  };

  const handleAddNotification = () => {
    const newNotif: InstagramActivityNotification = {
      id: `act-${Date.now()}`,
      type: 'follow',
      username: '',
      avatarUrl: '',
      hasStory: false,
      actionText: '',
      timestamp: '3m',
      section: 'Today',
      buttonText: 'Follow back',
      isFollowing: false,
    };
    onChange({
      ...data,
      notifications: [newNotif, ...data.notifications],
    });
  };

  const handleUpdateNotif = (id: string, updatedFields: Partial<InstagramActivityNotification>) => {
    const updated = data.notifications.map((n) =>
      n.id === id ? { ...n, ...updatedFields } : n
    );
    onChange({ ...data, notifications: updated });
  };

  const handleDeleteNotif = (id: string) => {
    onChange({
      ...data,
      notifications: data.notifications.filter((n) => n.id !== id),
    });
  };

  const handleMoveNotif = (index: number, direction: 'up' | 'down') => {
    const list = [...data.notifications];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;
    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;
    onChange({ ...data, notifications: list });
  };

  return (
    <div className="space-y-6">
      {/* Character Preset Selector */}
      <CharacterSelector
        characters={characters}
        activeCharacterId={activeCharacterId}
        onSelect={onSelectCharacter}
        onSaveCurrent={onSaveCharacter}
        onDeleteCharacter={onDeleteCharacter}
        onRenameCharacter={onRenameCharacter}
        addLabel="+ Add Folder"
      />

      {/* Global Theme & Header Options */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-4 shadow-sm">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
          <Moon className="w-4 h-4 text-purple-600" />
          <span>{t('theme.mode')}</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">{t('theme.mode')}</label>
            <div className="flex rounded-lg overflow-hidden border border-slate-200 bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => updateField('theme', 'light')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-md flex items-center justify-center space-x-1 transition-all ${
                  data.theme === 'light' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>{t('theme.light')}</span>
              </button>
              <button
                type="button"
                onClick={() => updateField('theme', 'dark')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-md flex items-center justify-center space-x-1 transition-all ${
                  data.theme === 'dark' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>{t('theme.dark')}</span>
              </button>
            </div>
          </div>

          {/* Aspect Ratio Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Container Aspect Ratio
            </label>
            <div className="flex rounded-lg overflow-hidden border border-slate-200 bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => updateField('aspectRatio', '1:1')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-md flex items-center justify-center space-x-1 transition-all ${
                  data.aspectRatio === '1:1' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Square className="w-3.5 h-3.5" />
                <span>1:1</span>
              </button>
              <button
                type="button"
                onClick={() => updateField('aspectRatio', '4:5')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-md flex items-center justify-center space-x-1 transition-all ${
                  (data.aspectRatio === '4:5' || !data.aspectRatio) ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <RectangleVertical className="w-3.5 h-3.5" />
                <span>4:5</span>
              </button>
              <button
                type="button"
                onClick={() => updateField('aspectRatio', '9:16')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-md flex items-center justify-center space-x-1 transition-all ${
                  data.aspectRatio === '9:16' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>9:16</span>
              </button>
            </div>
          </div>

          <div className="sm:col-span-2">
            <ImageUploader
              label="Your User Avatar (Bottom Nav)"
              value={data.userAvatar || ''}
              onChange={(url) => updateField('userAvatar', url)}
            />
          </div>
        </div>
      </div>

      {/* Follow Requests Section Config */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
            <User className="w-4 h-4 text-purple-600" />
            <span>Follow Requests Row</span>
          </h3>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={data.showFollowRequests !== false}
              onChange={(e) => updateField('showFollowRequests', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600" />
          </label>
        </div>

        {data.showFollowRequests !== false && (
          <div className="space-y-3 pt-2 border-t border-slate-200">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Requests Subtext</label>
              <input
                type="text"
                value={data.followRequestsSubtext || ''}
                onChange={(e) => updateField('followRequestsSubtext', e.target.value)}
                placeholder="Approve or ignore requests"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-purple-500 focus:bg-white"
              />
            </div>

            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.followRequestsUnread !== false}
                  onChange={(e) => updateField('followRequestsUnread', e.target.checked)}
                  className="rounded border-slate-300 bg-white text-purple-600 focus:ring-0 accent-purple-600"
                />
                <span>Show Blue Unread Dot</span>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <ImageUploader
                label="Request Avatar 1 (Front)"
                value={data.followRequestsAvatars?.[0] || ''}
                onChange={(url) => {
                  const updated = [...(data.followRequestsAvatars || [])];
                  updated[0] = url;
                  updateField('followRequestsAvatars', updated);
                }}
              />
              <ImageUploader
                label="Request Avatar 2 (Back)"
                value={data.followRequestsAvatars?.[1] || ''}
                onChange={(url) => {
                  const updated = [...(data.followRequestsAvatars || [])];
                  updated[1] = url;
                  updateField('followRequestsAvatars', updated);
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Notifications Builder */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
            <Bell className="w-4 h-4 text-purple-600" />
            <span>Notifications List ({data.notifications.length})</span>
          </h3>
          <button
            type="button"
            onClick={handleAddNotification}
            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Notification</span>
          </button>
        </div>

        <div className="space-y-4 pt-1">
          {data.notifications.map((notif, index) => (
            <div
              key={notif.id}
              className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3 relative group"
            >
              {/* Header card action */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-xs font-extrabold text-purple-600">
                  #{index + 1} Notification
                </span>

                <div className="flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={() => handleMoveNotif(index, 'up')}
                    disabled={index === 0}
                    className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-30 cursor-pointer"
                    title="Move Up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveNotif(index, 'down')}
                    disabled={index === data.notifications.length - 1}
                    className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-30 cursor-pointer"
                    title="Move Down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteNotif(notif.id)}
                    className="p-1 text-rose-500 hover:text-rose-600 cursor-pointer ml-1"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Type & Section Inputs */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Notification Type
                  </label>
                  <select
                    value={notif.type}
                    onChange={(e) => {
                      const newType = e.target.value as InstagramActivityNotificationType;
                      let newFields: Partial<InstagramActivityNotification> = { type: newType, actionText: '' };
                      if (newType === 'follow') {
                        newFields = {
                          ...newFields,
                          buttonText: 'Follow back',
                          isFollowing: false,
                        };
                      } else if (newType === 'follow_request') {
                        newFields = {
                          ...newFields,
                          buttonText: 'Confirm',
                          secondarySubtext: 'Delete',
                        };
                      }
                      handleUpdateNotif(notif.id, newFields);
                    }}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-purple-500 font-medium"
                  >
                    <option value="follow">Follow ("started following you")</option>
                    <option value="follow_request">Follow Request ("requested to follow you")</option>
                    <option value="comment">Comment ("commented on your post: [Action Text]")</option>
                    <option value="mention">Mention ("mentioned you in a photo: [Action Text]")</option>
                    <option value="like">Like ("liked your photo.")</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Header Time (Section)
                  </label>
                  <select
                    value={notif.section || 'Today'}
                    onChange={(e) => handleUpdateNotif(notif.id, { section: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-purple-500 font-medium"
                  >
                    <option value="New">New</option>
                    <option value="Today">Today</option>
                    <option value="This week">This week</option>
                    <option value="This month">This month</option>
                    <option value="Earlier">Earlier</option>
                  </select>
                </div>
              </div>

              {/* Username & Timestamp */}
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    value={notif.username || ''}
                    onChange={(e) => handleUpdateNotif(notif.id, { username: e.target.value })}
                    placeholder="username"
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-purple-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Timestamp
                  </label>
                  <input
                    type="text"
                    value={notif.timestamp || ''}
                    onChange={(e) => handleUpdateNotif(notif.id, { timestamp: e.target.value })}
                    placeholder="3m"
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Conditional Action Text Input (Visible ONLY for Comment or Mention) */}
              {(notif.type === 'comment' || notif.type === 'mention') && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Action Text {notif.type === 'comment' ? '(Comment Content)' : '(Mention Content)'}
                  </label>
                  <input
                    type="text"
                    value={notif.actionText || ''}
                    onChange={(e) => handleUpdateNotif(notif.id, { actionText: e.target.value })}
                    placeholder={notif.type === 'comment' ? 'Awesome post! 🔥' : '@you check this out!'}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-purple-500 font-medium"
                  />
                </div>
              )}

              {/* Avatar & Story Ring */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-end">
                <ImageUploader
                  label="User Avatar"
                  value={notif.avatarUrl || ''}
                  onChange={(url) => handleUpdateNotif(notif.id, { avatarUrl: url })}
                />

                <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer pb-2">
                  <input
                    type="checkbox"
                    checked={notif.hasStory || false}
                    onChange={(e) => handleUpdateNotif(notif.id, { hasStory: e.target.checked })}
                    className="rounded border-slate-300 bg-white text-purple-600 focus:ring-0 accent-purple-600"
                  />
                  <span>Has Story Ring (Gradient)</span>
                </label>
              </div>

              {/* Conditional Right Side Config */}
              {notif.type === 'follow_request' ? (
                <div className="pt-2 border-t border-slate-200 grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Primary Button (Blue)
                    </label>
                    <input
                      type="text"
                      value={notif.buttonText || ''}
                      onChange={(e) => handleUpdateNotif(notif.id, { buttonText: e.target.value })}
                      placeholder="Confirm"
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Secondary Button
                    </label>
                    <input
                      type="text"
                      value={notif.secondarySubtext || ''}
                      onChange={(e) => handleUpdateNotif(notif.id, { secondarySubtext: e.target.value })}
                      placeholder="Delete"
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              ) : notif.type === 'follow' ? (
                <div className="pt-2 border-t border-slate-200 space-y-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Button Label
                    </label>
                    <input
                      type="text"
                      value={notif.buttonText || ''}
                      onChange={(e) => handleUpdateNotif(notif.id, { buttonText: e.target.value })}
                      placeholder="Follow back"
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={notif.isFollowing || false}
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        handleUpdateNotif(notif.id, {
                          isFollowing: isChecked,
                          buttonText: isChecked
                            ? 'Following'
                            : (notif.buttonText && notif.buttonText !== 'Following' && notif.buttonText !== 'Mengikuti' ? notif.buttonText : 'Follow back'),
                        });
                      }}
                      className="rounded border-slate-300 bg-white text-purple-600 focus:ring-0 accent-purple-600 cursor-pointer"
                    />
                    <span>Following</span>
                  </label>
                </div>
              ) : (
                <div className="pt-2 border-t border-slate-200">
                  <ImageUploader
                    label="Post / Mention Thumbnail (Optional)"
                    value={notif.postThumbnail || ''}
                    onChange={(url) => handleUpdateNotif(notif.id, { postThumbnail: url })}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Save Profile Button */}
      <SaveProfileButton onSave={onSaveProfile} />
    </div>
  );
};
