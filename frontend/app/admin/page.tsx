'use client'

import { useEffect, useState } from 'react'
import { Building2, Users, TrendingUp, AlertTriangle, Plus, UserPlus, Trash2, Loader2, Download, Sparkles, Activity } from 'lucide-react'
import { adminAPI, downloadBlob } from '@/lib/api'
import toast from 'react-hot-toast'

type Organization = {
    id: number
    name: string
    description: string | null
    created_at: string
}

type Participant = {
    user_id: number
    email: string
    full_name: string | null
    role: string
    has_profile: boolean
    has_analysis: boolean
    overall_score: number | null
    readiness_label: string | null
    top_gaps: string[]
    last_analysis_at: string | null
}

type ReadinessSummary = {
    organization_id: number
    organization_name: string
    total_participants: number
    participants_with_analysis: number
    average_readiness_score: number | null
    readiness_distribution: Record<string, number>
    most_common_gaps: { gap: string; count: number }[]
    participants: Participant[]
}

type AIInteractionEvent = {
    id: number
    user_id: number
    user_email: string
    user_full_name: string | null
    feature: string
    credits_used: number
    created_at: string
}

type AIInteractionSummary = {
    organization_id: number
    organization_name: string
    total_interactions: number
    total_credits_used: number
    by_feature: { feature: string; count: number; total_credits_used: number }[]
    recent_events: AIInteractionEvent[]
}

export default function AdminDashboardPage() {
    const [orgs, setOrgs] = useState<Organization[]>([])
    const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null)
    const [summary, setSummary] = useState<ReadinessSummary | null>(null)
    const [loading, setLoading] = useState(true)
    const [loadingSummary, setLoadingSummary] = useState(false)

    const [showCreateForm, setShowCreateForm] = useState(false)
    const [newOrgName, setNewOrgName] = useState('')
    const [creating, setCreating] = useState(false)

    const [inviteEmail, setInviteEmail] = useState('')
    const [inviting, setInviting] = useState(false)

    const [downloadingReport, setDownloadingReport] = useState(false)

    const [aiSummary, setAiSummary] = useState<AIInteractionSummary | null>(null)
    const [loadingAiSummary, setLoadingAiSummary] = useState(false)

    const loadOrgs = async () => {
        setLoading(true)
        try {
            const list = await adminAPI.listMyOrganizations()
            setOrgs(list)
            if (list.length > 0 && !selectedOrgId) {
                setSelectedOrgId(list[0].id)
            }
        } catch {
            toast.error('Could not load organizations.')
        } finally {
            setLoading(false)
        }
    }

    const loadSummary = async (orgId: number) => {
        setLoadingSummary(true)
        try {
            const data = await adminAPI.getReadinessSummary(orgId)
            setSummary(data)
        } catch (err: any) {
            if (err?.response?.status === 403) {
                toast.error('You need org_admin access to view this organization.')
            } else {
                toast.error('Could not load readiness summary.')
            }
            setSummary(null)
        } finally {
            setLoadingSummary(false)
        }
    }

    const loadAiSummary = async (orgId: number) => {
        setLoadingAiSummary(true)
        try {
            const data = await adminAPI.getAIInteractions(orgId)
            setAiSummary(data)
        } catch {
            setAiSummary(null)
        } finally {
            setLoadingAiSummary(false)
        }
    }

    useEffect(() => { loadOrgs() }, [])
    useEffect(() => {
        if (selectedOrgId) {
            loadSummary(selectedOrgId)
            loadAiSummary(selectedOrgId)
        }
    }, [selectedOrgId])

    const handleCreateOrg = async () => {
        if (!newOrgName.trim()) return
        setCreating(true)
        try {
            const org = await adminAPI.createOrganization(newOrgName.trim())
            toast.success(`Organization "${org.name}" created`)
            setNewOrgName('')
            setShowCreateForm(false)
            await loadOrgs()
            setSelectedOrgId(org.id)
        } catch {
            toast.error('Could not create organization.')
        } finally {
            setCreating(false)
        }
    }

    const handleInvite = async () => {
        if (!selectedOrgId || !inviteEmail.trim()) return
        setInviting(true)
        try {
            await adminAPI.inviteMember(selectedOrgId, inviteEmail.trim())
            toast.success(`${inviteEmail} added`)
            setInviteEmail('')
            await loadSummary(selectedOrgId)
        } catch (err: any) {
            toast.error(err?.response?.data?.detail || 'Could not add member. They must already have a TrainPi account.')
        } finally {
            setInviting(false)
        }
    }

    const handleRemove = async (userId: number) => {
        if (!selectedOrgId) return
        try {
            await adminAPI.removeMember(selectedOrgId, userId)
            toast.success('Member removed')
            await loadSummary(selectedOrgId)
        } catch {
            toast.error('Could not remove member.')
        }
    }

    const handleDownloadReport = async () => {
        if (!selectedOrgId || !summary) return
        setDownloadingReport(true)
        try {
            const blob = await adminAPI.downloadReadinessSummaryReport(selectedOrgId)
            downloadBlob(blob, `${summary.organization_name.replace(/[^a-z0-9-_ ]/gi, '_')}-readiness-report.pdf`)
            toast.success('Report downloaded')
        } catch (err: any) {
            if (err?.response?.status === 403) {
                toast.error('You need org_admin access to download this report.')
            } else {
                toast.error('Could not generate report. Please try again.')
            }
        } finally {
            setDownloadingReport(false)
        }
    }

    if (loading) {
        return (
            <div className="max-w-6xl mx-auto pb-10">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
                    <Loader2 className="w-6 h-6 text-violet-600 mx-auto animate-spin" />
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-6xl mx-auto pb-10 space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Organization Admin</h1>
                    <p className="text-slate-500 font-medium mt-1">Monitor workforce readiness across your organization's participants.</p>
                </div>
                <button
                    type="button"
                    onClick={() => setShowCreateForm((s) => !s)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 text-white font-bold text-sm hover:bg-violet-700 transition"
                >
                    <Plus className="w-4 h-4" /> New Organization
                </button>
            </div>

            {showCreateForm && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex gap-3 items-center">
                    <input
                        type="text"
                        value={newOrgName}
                        onChange={(e) => setNewOrgName(e.target.value)}
                        placeholder="Organization name"
                        className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 text-sm"
                    />
                    <button
                        onClick={handleCreateOrg}
                        disabled={creating || !newOrgName.trim()}
                        className="px-5 py-2.5 rounded-xl bg-violet-600 text-white font-bold text-sm disabled:opacity-50"
                    >
                        {creating ? 'Creating…' : 'Create'}
                    </button>
                </div>
            )}

            {orgs.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
                    <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">You don't manage any organizations yet.</p>
                    <p className="text-slate-400 text-sm mt-1">Create one to start tracking participant readiness.</p>
                </div>
            ) : (
                <>
                    {/* Org selector */}
                    {orgs.length > 1 && (
                        <div className="flex gap-2 flex-wrap">
                            {orgs.map((org) => (
                                <button
                                    key={org.id}
                                    onClick={() => setSelectedOrgId(org.id)}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
                                        selectedOrgId === org.id ? 'bg-violet-600 text-white' : 'bg-white border border-slate-200 text-slate-700'
                                    }`}
                                >
                                    {org.name}
                                </button>
                            ))}
                        </div>
                    )}

                    {loadingSummary ? (
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
                            <Loader2 className="w-6 h-6 text-violet-600 mx-auto animate-spin" />
                        </div>
                    ) : summary ? (
                        <>
                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={handleDownloadReport}
                                    disabled={downloadingReport}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-sm transition disabled:opacity-60"
                                >
                                    <Download className="w-4 h-4" />
                                    {downloadingReport ? 'Generating…' : 'Download Org Report (PDF)'}
                                </button>
                            </div>

                            {/* Stat cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                                    <div className="flex items-center gap-2 text-slate-400 text-xs font-black uppercase tracking-widest mb-2">
                                        <Users className="w-4 h-4" /> Participants
                                    </div>
                                    <p className="text-3xl font-black text-slate-900">{summary.total_participants}</p>
                                    <p className="text-xs text-slate-500 mt-1">{summary.participants_with_analysis} with completed analysis</p>
                                </div>
                                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                                    <div className="flex items-center gap-2 text-slate-400 text-xs font-black uppercase tracking-widest mb-2">
                                        <TrendingUp className="w-4 h-4" /> Average Readiness
                                    </div>
                                    <p className="text-3xl font-black text-violet-600">
                                        {summary.average_readiness_score !== null ? `${summary.average_readiness_score}%` : '—'}
                                    </p>
                                </div>
                                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                                    <div className="flex items-center gap-2 text-slate-400 text-xs font-black uppercase tracking-widest mb-2">
                                        <AlertTriangle className="w-4 h-4" /> Top Org-Wide Gap
                                    </div>
                                    <p className="text-lg font-black text-slate-900 leading-tight">
                                        {summary.most_common_gaps[0]?.gap || 'None yet'}
                                    </p>
                                    {summary.most_common_gaps[0] && (
                                        <p className="text-xs text-slate-500 mt-1">{summary.most_common_gaps[0].count} participant(s) affected</p>
                                    )}
                                </div>
                            </div>

                            {/* Most common gaps */}
                            {summary.most_common_gaps.length > 0 && (
                                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                                    <p className="font-black text-slate-900 mb-4">Most Common Gaps Across Organization</p>
                                    <ul className="space-y-2">
                                        {summary.most_common_gaps.map((g) => (
                                            <li key={g.gap} className="flex items-center justify-between text-sm">
                                                <span className="font-bold text-slate-800">{g.gap}</span>
                                                <span className="text-slate-500">{g.count} participant(s)</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Invite member */}
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                                <p className="font-black text-slate-900 mb-4">Add Participant</p>
                                <div className="flex gap-3">
                                    <input
                                        type="email"
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                        placeholder="participant@example.com"
                                        className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 text-sm"
                                    />
                                    <button
                                        onClick={handleInvite}
                                        disabled={inviting || !inviteEmail.trim()}
                                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 text-white font-bold text-sm disabled:opacity-50"
                                    >
                                        <UserPlus className="w-4 h-4" /> {inviting ? 'Adding…' : 'Add'}
                                    </button>
                                </div>
                                <p className="text-xs text-slate-400 mt-2">They must already have a TrainPi account.</p>
                            </div>

                            {/* Participant table */}
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                                <p className="font-black text-slate-900 mb-4">Participants</p>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-slate-100">
                                                <th className="text-left text-[10px] font-black uppercase tracking-widest text-slate-400 py-2 pr-3">Email</th>
                                                <th className="text-left text-[10px] font-black uppercase tracking-widest text-slate-400 py-2 pr-3">Role</th>
                                                <th className="text-left text-[10px] font-black uppercase tracking-widest text-slate-400 py-2 pr-3">Readiness</th>
                                                <th className="text-left text-[10px] font-black uppercase tracking-widest text-slate-400 py-2 pr-3">Top Gaps</th>
                                                <th className="py-2"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {summary.participants.map((p) => (
                                                <tr key={p.user_id}>
                                                    <td className="py-2.5 pr-3 font-bold text-slate-900">{p.full_name || p.email}</td>
                                                    <td className="py-2.5 pr-3">
                                                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${p.role === 'org_admin' ? 'bg-violet-50 text-violet-700' : 'bg-slate-50 text-slate-600'}`}>
                                                            {p.role}
                                                        </span>
                                                    </td>
                                                    <td className="py-2.5 pr-3">
                                                        {p.has_analysis ? (
                                                            <span className="font-bold text-slate-900">{p.overall_score}% · {p.readiness_label}</span>
                                                        ) : (
                                                            <span className="text-slate-400">No analysis yet</span>
                                                        )}
                                                    </td>
                                                    <td className="py-2.5 pr-3 text-slate-600 text-xs">
                                                        {p.top_gaps.slice(0, 2).join(', ') || '—'}
                                                    </td>
                                                    <td className="py-2.5 text-right">
                                                        <button
                                                            onClick={() => handleRemove(p.user_id)}
                                                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* AI Interaction Monitoring (Exhibit A admin requirement) */}
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <Activity className="w-4 h-4 text-violet-600" />
                                    <p className="font-black text-slate-900">AI Interaction Monitoring</p>
                                </div>

                                {loadingAiSummary ? (
                                    <div className="py-8 text-center">
                                        <Loader2 className="w-5 h-5 text-violet-600 mx-auto animate-spin" />
                                    </div>
                                ) : !aiSummary ? (
                                    <p className="text-sm text-slate-400">Could not load AI usage data.</p>
                                ) : aiSummary.total_interactions === 0 ? (
                                    <p className="text-sm text-slate-400">No AI feature usage recorded for this organization yet.</p>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                                            <div className="rounded-xl bg-violet-50 border border-violet-100 p-4">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-violet-600 mb-1">Total AI Interactions</p>
                                                <p className="text-2xl font-black text-slate-900">{aiSummary.total_interactions}</p>
                                            </div>
                                            <div className="rounded-xl bg-violet-50 border border-violet-100 p-4">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-violet-600 mb-1">Total Credits Used</p>
                                                <p className="text-2xl font-black text-slate-900">{aiSummary.total_credits_used}</p>
                                            </div>
                                        </div>

                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Usage by Feature</p>
                                        <ul className="space-y-2 mb-5">
                                            {aiSummary.by_feature.map((f) => (
                                                <li key={f.feature} className="flex items-center justify-between text-sm py-1.5 border-b border-slate-50 last:border-0">
                                                    <span className="flex items-center gap-2 font-bold text-slate-800">
                                                        <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                                                        {f.feature}
                                                    </span>
                                                    <span className="text-slate-500 text-xs">{f.count}× · {f.total_credits_used} credits</span>
                                                </li>
                                            ))}
                                        </ul>

                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Recent Activity</p>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="border-b border-slate-100">
                                                        <th className="text-left text-[10px] font-black uppercase tracking-widest text-slate-400 py-2 pr-3">Participant</th>
                                                        <th className="text-left text-[10px] font-black uppercase tracking-widest text-slate-400 py-2 pr-3">Feature</th>
                                                        <th className="text-left text-[10px] font-black uppercase tracking-widest text-slate-400 py-2 pr-3">Credits</th>
                                                        <th className="text-left text-[10px] font-black uppercase tracking-widest text-slate-400 py-2">When</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {aiSummary.recent_events.slice(0, 15).map((e) => (
                                                        <tr key={e.id}>
                                                            <td className="py-2 pr-3 font-bold text-slate-900">{e.user_full_name || e.user_email}</td>
                                                            <td className="py-2 pr-3 text-slate-600 text-xs">{e.feature}</td>
                                                            <td className="py-2 pr-3 text-slate-600 text-xs">{e.credits_used}</td>
                                                            <td className="py-2 text-slate-400 text-xs">{new Date(e.created_at).toLocaleString()}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </>
                                )}
                            </div>
                        </>
                    ) : null}
                </>
            )}
        </div>
    )
}
