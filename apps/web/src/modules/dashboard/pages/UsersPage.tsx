'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getAuthUser } from '@/lib/auth-store'
import { Plus, Pencil, Trash2, X, Eye, EyeOff, ShieldCheck, BarChart2, Briefcase } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type RoleSlug = 'ADMIN' | 'ACCOUNTANT' | 'CEO'

type UserRole = {
  id: string
  name: string
  slug: RoleSlug
}

type AppUser = {
  id: string
  name: string
  email: string
  role: UserRole
  createdAt: string
}

type ModalMode = 'add' | 'edit' | 'delete'

// ─── Role config ──────────────────────────────────────────────────────────────

const ROLES: { slug: RoleSlug; label: string; description: string; icon: React.ElementType; colors: string }[] = [
  {
    slug: 'ADMIN',
    label: 'Admin',
    description: 'Full access — all features',
    icon: ShieldCheck,
    colors: 'border-primary/30 bg-primary/5 text-primary',
  },
  {
    slug: 'ACCOUNTANT',
    label: 'Accountant',
    description: 'View all, add own',
    icon: BarChart2,
    colors: 'border-blue-400/30 bg-blue-50 text-blue-700',
  },
  {
    slug: 'CEO',
    label: 'CEO',
    description: 'View all, add own',
    icon: Briefcase,
    colors: 'border-amber-400/30 bg-amber-50 text-amber-700',
  },
]

function getRoleConfig(slug: string) {
  return ROLES.find((r) => r.slug === slug) ?? ROLES[0]
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) {
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const sz = size === 'sm' ? 'h-8 w-8 text-xs' : 'h-11 w-11 text-sm'

  return (
    <div className={`flex shrink-0 items-center justify-center rounded-full bg-primary-fixed font-semibold text-primary ${sz}`}>
      {initials}
    </div>
  )
}

// ─── Role Badge ───────────────────────────────────────────────────────────────

function RoleBadge({ slug }: { slug: string }) {
  const cfg = getRoleConfig(slug)
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cfg.colors}`}>
      {cfg.label}
    </span>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function UserModal({
  mode,
  user,
  onClose,
  onSaved,
}: {
  mode: ModalMode
  user: AppUser | null
  onClose: () => void
  onSaved: () => void
}) {
  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [pin, setPin] = useState('')
  const [roleSlug, setRoleSlug] = useState<RoleSlug>((user?.role.slug as RoleSlug) ?? 'ACCOUNTANT')
  const [showPin, setShowPin] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isDelete = mode === 'delete'
  const isEdit = mode === 'edit'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      let res: Response
      if (isDelete) {
        res = await fetch(`/api/v1/users/${user!.id}`, { method: 'DELETE' })
      } else if (isEdit) {
        const body: Record<string, string> = { name, email, roleSlug }
        if (pin) body.pin = pin
        res = await fetch(`/api/v1/users/${user!.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      } else {
        res = await fetch('/api/v1/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, pin, roleSlug }),
        })
      }

      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.message || 'Something went wrong')
        return
      }
      onSaved()
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Modal card */}
      <div className="relative z-10 w-full max-w-md glass-surface rim-light squircle p-6 shadow-xl">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-title text-title-md font-bold text-on-surface">
            {isDelete ? 'Delete User' : isEdit ? 'Edit User' : 'Add New User'}
          </h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-outline transition hover:bg-surface-container-lowest hover:text-on-surface"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {isDelete ? (
          <div>
            <p className="text-body-md text-on-surface">
              Are you sure you want to delete{' '}
              <span className="font-semibold">{user?.name}</span>? This cannot be undone.
            </p>
            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
            <div className="mt-6 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 squircle border border-outline-variant bg-surface-container-lowest px-4 py-2.5 text-sm font-medium text-on-surface transition hover:bg-primary-fixed/10"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 squircle bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-60"
              >
                {loading ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="mb-1.5 block text-label-sm font-medium text-outline">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. John Smith"
                required
                className="w-full squircle border border-outline-variant bg-surface-container-lowest px-4 py-2.5 text-sm text-on-surface outline-none placeholder:text-outline focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition"
              />
            </div>

            {/* Email */}
            <div>
              <label className="mb-1.5 block text-label-sm font-medium text-outline">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@company.com"
                required
                className="w-full squircle border border-outline-variant bg-surface-container-lowest px-4 py-2.5 text-sm text-on-surface outline-none placeholder:text-outline focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition"
              />
            </div>

            {/* PIN */}
            <div>
              <label className="mb-1.5 block text-label-sm font-medium text-outline">
                PIN {isEdit && <span className="text-outline/60">(leave blank to keep current)</span>}
              </label>
              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="4-digit PIN"
                  required={!isEdit}
                  maxLength={4}
                  inputMode="numeric"
                  className="w-full squircle border border-outline-variant bg-surface-container-lowest px-4 py-2.5 pr-11 text-sm text-on-surface outline-none placeholder:text-outline focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPin((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-outline transition hover:text-on-surface"
                >
                  {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Role */}
            <div>
              <label className="mb-2 block text-label-sm font-medium text-outline">Role</label>
              <div className="grid grid-cols-3 gap-2">
                {ROLES.map((r) => {
                  const Icon = r.icon
                  const active = roleSlug === r.slug
                  return (
                    <button
                      key={r.slug}
                      type="button"
                      onClick={() => setRoleSlug(r.slug)}
                      className={`squircle flex flex-col items-center gap-1.5 border p-3 text-center transition ${
                        active
                          ? `${r.colors} ring-2 ring-primary/20`
                          : 'border-outline-variant bg-surface-container-lowest text-outline hover:border-primary/30'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-xs font-semibold">{r.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 squircle border border-outline-variant bg-surface-container-lowest px-4 py-2.5 text-sm font-medium text-on-surface transition hover:bg-primary-fixed/10"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 squircle bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
              >
                {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Add User'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<AppUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modal, setModal] = useState<{ mode: ModalMode; user: AppUser | null } | null>(null)

  useEffect(() => {
    const user = getAuthUser()
    if (!user) {
      router.replace('/')
      return
    }
    if (user.role !== 'ADMIN') {
      router.replace('/transactions')
    }
  }, [router])

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/v1/users')
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.message || 'Failed to load users')
        return
      }
      setUsers(json.data)
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  function openModal(mode: ModalMode, user: AppUser | null = null) {
    setModal({ mode, user })
  }

  function closeModal() {
    setModal(null)
  }

  function onSaved() {
    closeModal()
    fetchUsers()
  }

  return (
    <div className="min-w-0 flex-1 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-headline text-2xl font-bold text-on-surface">User Management</h1>
          <p className="mt-0.5 text-body-sm text-outline">
            Manage team members and their PIN access
          </p>
        </div>
        <button
          id="add-user-btn"
          onClick={() => openModal('add')}
          className="squircle flex items-center gap-2 bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 active:scale-95"
        >
          <Plus className="h-4 w-4" />
          Add User
        </button>
      </div>

      {/* Role legend cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {ROLES.map((r) => {
          const Icon = r.icon
          return (
            <div
              key={r.slug}
              className={`squircle border p-4 ${r.colors}`}
            >
              <div className="mb-1.5 flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span className="text-sm font-bold">{r.label}</span>
              </div>
              <p className="text-xs opacity-70">{r.description}</p>
            </div>
          )
        })}
      </div>

      {/* Users list */}
      <div className="glass-surface rim-light squircle overflow-hidden">
        {loading ? (
          <div className="flex h-48 items-center justify-center text-sm text-outline">
            Loading users…
          </div>
        ) : error ? (
          <div className="flex h-48 items-center justify-center text-sm text-red-500">
            {error}
          </div>
        ) : users.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center gap-2 text-outline">
            <p className="text-sm font-medium">No users yet</p>
            <button
              onClick={() => openModal('add')}
              className="text-xs text-primary underline"
            >
              Add the first user
            </button>
          </div>
        ) : (
          <div className="divide-y divide-outline/10">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-4 px-5 py-4 transition hover:bg-primary-fixed/5"
              >
                <Avatar name={user.name} />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-title text-title-sm font-semibold text-on-surface">
                      {user.name}
                    </span>
                    <RoleBadge slug={user.role.slug} />
                  </div>
                  <span className="truncate text-label-sm text-outline">{user.email}</span>
                </div>

                {/* Actions */}
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    id={`edit-user-${user.id}`}
                    onClick={() => openModal('edit', user)}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-outline transition hover:bg-primary-fixed/20 hover:text-primary"
                    aria-label={`Edit ${user.name}`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    id={`delete-user-${user.id}`}
                    onClick={() => openModal('delete', user)}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-outline transition hover:bg-red-50 hover:text-red-500"
                    aria-label={`Delete ${user.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <UserModal
          mode={modal.mode}
          user={modal.user}
          onClose={closeModal}
          onSaved={onSaved}
        />
      )}
    </div>
  )
}
