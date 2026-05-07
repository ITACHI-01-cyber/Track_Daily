/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { LogOut, User, Settings } from 'lucide-react';
import { User as UserType } from '../types';

interface UserProfileProps {
  user: UserType;
  onLogout: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ user, onLogout }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const userInitials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();

  return (
    <div className="relative">
      {/* Avatar Button */}
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
        title={`${user.firstName} ${user.lastName}`}
      >
        <img
          src={user.avatarUrl}
          alt={user.firstName}
          className="w-10 h-10 rounded-full border-2 border-blue-500 object-cover"
        />
        <div className="hidden sm:flex flex-col items-start">
          <p className="text-sm font-semibold text-gray-800">
            {user.firstName || user.username}
          </p>
          <p className="text-xs text-gray-500">@{user.username}</p>
        </div>
      </button>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50">
          {/* User Info */}
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <p className="text-sm font-semibold text-gray-800">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-gray-600">{user.email}</p>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <button
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 transition-colors duration-200 flex items-center gap-2"
            >
              <User size={16} />
              View Profile
            </button>
            <button
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 transition-colors duration-200 flex items-center gap-2"
            >
              <Settings size={16} />
              Settings
            </button>
          </div>

          {/* Logout Button */}
          <button
            onClick={() => {
              setIsDropdownOpen(false);
              onLogout();
            }}
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200 flex items-center gap-2 border-t border-gray-200"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      )}
    </div>
  );
};
