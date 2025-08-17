'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import Link from 'next/link'

interface User {
  id: string
  email: string
  role: string
}

interface Account {
  id: string
  name: string
  plan: string
}

interface Usage {
  storage: number
  egress: number
  transforms: number
  limits: {
    storage: number
    egress: number
    transforms: number
  }
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [account, setAccount] = useState<Account | null>(null)
  const [usage, setUsage] = useState<Usage | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    const accountData = localStorage.getItem('account')

    if (!token || !userData || !accountData) {
      router.push('/')
      return
    }

    setUser(JSON.parse(userData))
    setAccount(JSON.parse(accountData))
    fetchUsage(token)
  }, [router])

  const fetchUsage = async (token: string) => {
    try {
      const response = await axios.get('http://localhost:8080/v1/me/usage', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setUsage(response.data.usage)
    } catch (error) {
      console.error('Failed to fetch usage:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('account')
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!user || !account) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Seya Media Hub</h1>
              <p className="text-sm text-gray-600">{account.name} • {account.plan} plan</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user.email}</span>
              <button
                onClick={handleLogout}
                className="btn btn-secondary"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <Link
              href="/dashboard"
              className="border-b-2 border-primary-500 py-4 px-1 text-sm font-medium text-primary-600"
            >
              Overview
            </Link>
            <Link
              href="/dashboard/assets"
              className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
            >
              Assets
            </Link>
            <Link
              href="/dashboard/apikeys"
              className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
            >
              API Keys
            </Link>
            <Link
              href="/dashboard/usage"
              className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
            >
              Usage
            </Link>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Storage Usage */}
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Storage</h3>
              {usage && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-2xl font-bold text-gray-900">
                      {usage.storage} MB
                    </span>
                    <span className="text-sm text-gray-500">
                      of {usage.limits.storage} MB
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full"
                      style={{
                        width: `${Math.min((usage.storage / usage.limits.storage) * 100, 100)}%`
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Egress Usage */}
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Egress</h3>
              {usage && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-2xl font-bold text-gray-900">
                      {usage.egress} MB
                    </span>
                    <span className="text-sm text-gray-500">
                      of {usage.limits.egress} MB
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{
                        width: `${Math.min((usage.egress / usage.limits.egress) * 100, 100)}%`
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Transform Usage */}
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Transforms</h3>
              {usage && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-2xl font-bold text-gray-900">
                      {usage.transforms.toLocaleString()}
                    </span>
                    <span className="text-sm text-gray-500">
                      of {usage.limits.transforms.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-600 h-2 rounded-full"
                      style={{
                        width: `${Math.min((usage.transforms / usage.limits.transforms) * 100, 100)}%`
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Link
                href="/dashboard/assets"
                className="card hover:shadow-md transition-shadow cursor-pointer"
              >
                <h3 className="font-medium text-gray-900">View Assets</h3>
                <p className="text-sm text-gray-600 mt-1">Manage your uploaded files</p>
              </Link>
              
              <Link
                href="/dashboard/apikeys"
                className="card hover:shadow-md transition-shadow cursor-pointer"
              >
                <h3 className="font-medium text-gray-900">API Keys</h3>
                <p className="text-sm text-gray-600 mt-1">Manage your API access</p>
              </Link>
              
              <Link
                href="/dashboard/usage"
                className="card hover:shadow-md transition-shadow cursor-pointer"
              >
                <h3 className="font-medium text-gray-900">Usage Analytics</h3>
                <p className="text-sm text-gray-600 mt-1">View detailed usage reports</p>
              </Link>
              
              <div className="card hover:shadow-md transition-shadow cursor-pointer">
                <h3 className="font-medium text-gray-900">Documentation</h3>
                <p className="text-sm text-gray-600 mt-1">API docs and guides</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
