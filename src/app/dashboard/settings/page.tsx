'use client'

import Link from 'next/link'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function SettingsLandingPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Control account-wide defaults and branding that show up on countdown pages.
          </p>
        </div>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Branding settings</h2>
          </CardHeader>
          <CardBody>
            <p className="text-sm text-gray-600">
              your countdown pages (the values that replace <code>{"{{organizationName}}"}</code>,
              contact email, and other placeholders).
            </p>
            <div className="mt-6">
              <Link href="/dashboard/settings/branding">
                <Button>
                  Go to Branding settings
                </Button>
              </Link>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">SMS Settings</h2>
          </CardHeader>
          <CardBody>
            <p className="text-sm text-gray-600">
              Control which timezones receive SMS messages. Block specific regions to reduce costs.
            </p>
            <div className="mt-6">
              <Link href="/dashboard/settings/sms">
                <Button>
                  Manage SMS Settings
                </Button>
              </Link>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">SMS Settings</h2>
          </CardHeader>
          <CardBody>
            <p className="text-sm text-gray-600">
              Control which timezones receive SMS messages. Block specific regions to reduce costs.
            </p>
            <div className="mt-6">
              <Link href="/dashboard/settings/sms">
                <Button>
                  Manage SMS Settings
                </Button>
              </Link>
            </div>
          </CardBody>
        </Card>
      </div>
    </DashboardLayout>
  )
}
