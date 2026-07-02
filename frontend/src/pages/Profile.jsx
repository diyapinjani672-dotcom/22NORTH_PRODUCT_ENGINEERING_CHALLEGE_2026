import { useEffect, useState } from 'react'
import { profileApi } from '../services/api.js'
import { useAppContext } from '../hooks/useAppContext.jsx'
import { PageSkeleton } from '../components/Skeleton.jsx'

export default function Profile() {
  const { session, pushToast, t } = useAppContext()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    profileApi.get(session.booking.id)
      .then(setProfile)
      .catch((e) => pushToast(e.message, 'error'))
      .finally(() => setLoading(false))
  }, [session.booking.id])

  if (loading) return <div className="max-w-2xl mx-auto px-6 py-10"><PageSkeleton /></div>

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <p className="font-mono text-gold text-xs tracking-widest mb-2">{t('ACCOUNT')}</p>
      <h1 className="font-display font-bold text-2xl mb-8">{profile.first_name} {profile.last_name}</h1>

      <Section title="Contact">
        <Field label="Email" value={profile.email} />
        <Field label="Phone" value={profile.phone} />
      </Section>

      <Section title="Emergency Contact">
        <Field label="Name" value={profile.emergency_contact_name} />
        <Field label="Phone" value={profile.emergency_contact_phone} />
      </Section>

      <Section title="Frequent Flyer">
        <Field label="Tier" value={profile.frequent_flyer_tier} />
        <Field label="Number" value={profile.frequent_flyer_number || '—'} />
      </Section>

      <Section title="Preferences">
        <Field label="Seat" value={profile.preferred_seat} />
        <Field label="Meal" value={profile.preferred_meal} />
        <Field label="Language" value={profile.language.toUpperCase()} />
      </Section>
    </div>
  )
}

function Section({ title, children }) {
  const { t } = useAppContext()
  return (
    <div className="glass rounded-2xl p-5 mb-4">
      <p className="text-xs text-ink-faint uppercase tracking-wide mb-3">{t(title)}</p>
      <div className="space-y-1.5">{children}</div>
    </div>
  )
}

function Field({ label, value }) {
  const { t } = useAppContext()
  return (
    <div className="flex justify-between text-sm py-1">
      <span className="text-ink-muted">{t(label)}</span>
      <span className="font-medium">{t(value)}</span>
    </div>
  )
}

